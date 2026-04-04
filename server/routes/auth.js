import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import Status from "../models/Status.js";
import crypto from "crypto";
import { Resend } from "resend";

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

// Generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Email transporter
// const transporter = nodemailer.createTransport({
//   service: "gmail", // You can change this to your email service
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

export const sendResetEmail = async (user, resetUrl) => {
  try {
    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "🔐 Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">🔐 Password Reset</h2>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px;">Hi ${user.name},</p>
            <p style="color: #555; font-size: 14px;">You requested a password reset for your account. Click the button below to create a new password.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #e94560; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center;">⏱️ This link expires in 1 hour</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Didn't request this? No worries, just ignore this email.</p>
          </div>
        </div>
      `,
    });

    console.log("Email sent:", response);
  } catch (error) {
    console.error("Resend Error:", error);
  }
};

// @route POST /api/auth/signup
router.post("/signup", async (req, res) => {
  const { name, email, password, phoneNumber, status } = req.body;

  if (!name || !email || !password)
    return res
      .status(400)
      .json({ message: "Name, email and password are required" });

  if (phoneNumber && !/^[0-9]{10}$/.test(phoneNumber)) {
    return res.status(400).json({ message: "Phone number must be 10 digits" });
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email))
    return res.status(400).json({ message: "Email is invalid" });

  if (password.length < 6)
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });

  try {
    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already registered" });

    // First user ever becomes admin automatically
    const count = await User.countDocuments();
    const role = count === 0 ? "admin" : "user";

    let validatedStatus = null;

    if (status) {
      if (!mongoose.Types.ObjectId.isValid(status)) {
        return res.status(400).json({ message: "Invalid status id" });
      }

      const statusExists = await Status.findById(status);
      if (!statusExists) {
        return res.status(400).json({ message: "Status not found" });
      }

      validatedStatus = status;
    }

    const user = await User.create({
      name,
      email,
      password,
      phoneNumber: phoneNumber || "",
      role,
      status: validatedStatus,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      status: user.status,
      token: generateToken(user._id),
      userRole: user.userRole,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  try {
    const user = await User.findOne({ email })
      .populate("userRole", "name")
      .populate("status", "name");
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      token: generateToken(user._id),
      userRole: user.userRole,
      status: user.status,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        message:
          "If an account exists with this email, a password reset link has been sent. Please check your inbox and spam folder.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set token and expiry (1 hour)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // const mailOptions = {
    //   from: process.env.EMAIL_USER,
    //   to: user.email,
    //   subject: "🔐 Password Reset Request",
    //   html: `
    //     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
    //       <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
    //         <h2 style="margin: 0; font-size: 24px;">🔐 Password Reset</h2>
    //       </div>
    //       <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
    //         <p style="color: #333; font-size: 16px;">Hi ${user.name},</p>
    //         <p style="color: #555; font-size: 14px;">You requested a password reset for your account. Click the button below to create a new password.</p>
    //         <div style="text-align: center; margin: 30px 0;">
    //           <a href="${resetUrl}" style="background-color: #e94560; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
    //         </div>
    //         <p style="color: #999; font-size: 12px; text-align: center;">⏱️ This link expires in 1 hour</p>
    //         <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    //         <p style="color: #999; font-size: 12px;">Didn't request this? No worries, just ignore this email or contact support if you have concerns.</p>
    //       </div>
    //     </div>
    //   `,
    // };

    await resend.emails.send({
      from: process.env.EMAIL_USER, // e.g. no-reply@yourdomain.com
      to: user.email,
      subject: "🔐 Password Reset Request",
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h2 style="margin: 0; font-size: 24px;">🔐 Password Reset</h2>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="color: #333; font-size: 16px;">Hi ${user.name},</p>
          <p style="color: #555; font-size: 14px;">
            You requested a password reset for your account. Click the button below to create a new password.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
              style="background-color: #e94560; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>

          <p style="color: #999; font-size: 12px; text-align: center;">
            ⏱️ This link expires in 1 hour
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

          <p style="color: #999; font-size: 12px;">
            Didn't request this? No worries, just ignore this email or contact support if you have concerns.
          </p>
        </div>
      </div>
    `,
    });

    res.json({
      message:
        "Password reset link has been sent to your email. Please check your inbox and spam folder.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res
      .status(500)
      .json({ message: "Unable to send reset email. Please try again later." });
  }
});

// @route POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res
      .status(400)
      .json({ message: "Reset link and new password are required" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  try {
    // Hash the token to compare with stored hash
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Reset link has expired or is invalid. Please request a new password reset.",
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({
      message:
        "Your password has been reset successfully! You can now log in with your new password.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res
      .status(500)
      .json({
        message:
          "Unable to reset password. Please try again later or contact support.",
      });
  }
});

// @route GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

// @route PUT /api/auth/update-profile
router.put("/update-profile", protect, async (req, res) => {
  try {
    const { name, phoneNumber } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (phoneNumber && !/^[0-9]{10}$/.test(phoneNumber)) {
      return res
        .status(400)
        .json({ message: "Phone number must be 10 digits" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phoneNumber: phoneNumber || "" },
      { new: true },
    ).select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// @route PUT /api/auth/change-password
router.put("/change-password", protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch)
      return res.status(401).json({ message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save(); // triggers bcrypt pre-save hook
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
