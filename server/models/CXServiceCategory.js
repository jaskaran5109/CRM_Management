import mongoose from "mongoose";

const cxServiceCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    status: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Status",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("CXServiceCategory", cxServiceCategorySchema);