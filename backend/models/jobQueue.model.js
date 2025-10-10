import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Issue_Assigned_Email', 'Issue_Completed_Email', 'Task_Assigned_Email', 'Task_Escalated_Email'],
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  attempts: {
    type: Number,
    default: 0,
  },
  lastError: {
    type: String,
  },
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);
export default Job;