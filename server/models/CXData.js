import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    callReceiveDate: {
      type: Date,
      required: true,
    },
    customerEmail: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    customerName: {
      type: String,
      required: [ true, "Customer name is required"],
      trim: true,
    },

    contactNo: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
      match: [/^[0-9]{10}$/, "Contact number must be 10 digits"],
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    pincode: {
      type: String,
      trim: true,
      match: [/^[0-9]{6}$/, "Pincode must be 6 digits"],
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    model: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CXModel",
      default: null,
    },

    serviceCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CXServiceCategory",
      default: null,
    },

    assignedStatus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoleStatus",
      default: null,
    },
    status: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Status",
      default: null,
    },
  },
  { timestamps: true }
);

customerSchema.index({ callReceiveDate: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ serviceCategory: 1 });

export default mongoose.model("Customer", customerSchema);