import mongoose from "mongoose";

const timelineEventSchema = new mongoose.Schema({
    issueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Issue",
        required: true
    },
    eventType: {
        type: String,
        enum: [
            'issue_created',           // Issue posted by user
            'issue_taken_up',          // Municipality takes up the issue
            'staff_assigned',          // Staff member assigned to issue
            'task_created',            // Task created and assigned
            'task_updated',            // Task status updated
            'task_proof_submitted',    // Worker submits proof
            'task_approved',           // Task approved by coordinator/supervisor
            'task_rejected',           // Task rejected by coordinator/supervisor
            'task_escalated',          // Task escalated due to deadline
            'issue_resolved',          // Issue marked as resolved
            'feedback_submitted',      // User submits feedback
            'comment_added'            // Comment added to issue
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    actorRole: {
        type: String,
        enum: ["Citizen", "Municipality Staff", "Supervisor", "Coordinator", "Worker", "Admin"],
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // For task-related events
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    },
    // For staff assignment events
    assignedStaffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    assignedStaffRole: {
        type: String,
        enum: ["Supervisor", "Worker", "Coordinator"]
    }
}, { 
    timestamps: true 
});

// Index for efficient querying
timelineEventSchema.index({ issueId: 1, createdAt: 1 });

export const TimelineEvent = mongoose.model("TimelineEvent", timelineEventSchema);
