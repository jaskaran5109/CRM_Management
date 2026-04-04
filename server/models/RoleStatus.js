import mongoose from "mongoose";

const roleStatusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    userRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserRole",
      required: true,
    },
    nextRoles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserRole",
      },
    ],
    status: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Status",
      required: true,
    },
  },
  { timestamps: true },
);

roleStatusSchema.index({ name: 1, userRole: 1, status: 1 }, { unique: true });

export default mongoose.model("RoleStatus", roleStatusSchema);
