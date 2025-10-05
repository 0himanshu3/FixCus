// models/ResolutionReport.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const StaffPerformanceSchema = new Schema({
  name:    { type: String, required: true },
  email:   { type: String, required: true },
  role:    { type: String, required: true }, // e.g. "Worker" | "Coordinator"
  rating:  { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
  userId:  { type: Schema.Types.ObjectId, ref: "User", required: false }, // optional link
}, { _id: false });

const ResolutionReportSchema = new Schema({
  issue: {
    type: Schema.Types.ObjectId,
    ref: "Issue",
    required: true,
    index: true
  },
  summary: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String // expected to be URL strings (uploaded to Firebase or other storage)
  }],
  supervisor: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  staffPerformance: {
    type: [StaffPerformanceSchema],
    default: []
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// Avoid model overwrite in serverless / hot-reload environments
export const ResolutionReport = mongoose.models?.ResolutionReport
  || mongoose.model("ResolutionReport", ResolutionReportSchema);

export default ResolutionReport;
