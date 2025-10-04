import mongoose, { Schema } from 'mongoose';

const notificationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: [
            'issue-assigned',       
            'issue-updated',        
            'issue-completed',      
            'issue-rejected',       
            'task-assigned',        
            'role-change',
            'issue-escalation',
            'task-escalation-coordinator',
            'task-escalation-supervisor',
            'task-escalated-from-worker',
            'task-escalated-from-coordinator',
            'task-deadline-reminder',
            'task-completed',
            'task-status-update',
            'general'               
        ],
        required: true
    },
    issueId: {
        type: Schema.Types.ObjectId,
        ref: "Issue",
    },
    taskId: {
        type: Schema.Types.ObjectId,
        ref: "Task",
    },
    url: {      //to reach the relevant page like issue page to see assigned task from its noti
        type: String,
        default: '/'           
    }
}, { timestamps: true });

export const Notification = mongoose.model("Notification", notificationSchema);
