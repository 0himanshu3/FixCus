import mongoose from "mongoose";

const taskUpdateSchema = new mongoose.Schema({
  updateText: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // Who made the update
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: "Issue", required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  roleOfAssignee: { type: String, enum: ["Supervisor", "Worker", "Coordinator"] },

  status: { type: String, enum: ["Pending", "In Review", "Completed"], default: "Pending" },

  deadline: { type: Date, required: true }, // ✅ Task deadline

  taskUpdates: [taskUpdateSchema],

  taskCompletionProof: { type: String }, // Could be a link or text description
  taskProofImages: [{ type: String }],
  taskProofSubmitted: { type: Boolean, default: false }

}, { timestamps: true });

export const Task = mongoose.model("Task", taskSchema);
