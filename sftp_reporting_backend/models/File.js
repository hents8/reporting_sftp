import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true, unique: true },
  type: { type: String, enum: ["file", "directory"], required: true },
  size: Number,
  modified: Date,
  extension: String,
  syncDate: { type: Date, default: Date.now },
  thumbnail: { type: String, default: null }
});

export default mongoose.model("File", fileSchema);
