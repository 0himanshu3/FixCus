// models/task.js
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

  deadline: { type: Date, required: true },

  taskUpdates: [taskUpdateSchema],

  taskCompletionProof: { type: String },
  taskProofImages: [{ type: String }],
  taskProofSubmitted: { type: Boolean, default: false },

  // NEW: escalation metadata
  hasEscalated: { type: Boolean, default: false },        // set true when this task has been escalated
  escalatedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Task" } // id of original task if this one was created via escalation

}, { timestamps: true });

export const Task = mongoose.model("Task", taskSchema);
