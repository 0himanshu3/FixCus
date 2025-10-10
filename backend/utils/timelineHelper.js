import { TimelineEvent } from "../models/timeline.model.js";
import { User } from "../models/user.model.js";
import { Municipality } from "../models/muncipality.model.js";
import Issue from "../models/issue.model.js";

/**
 * Creates a timeline event for an issue
 * @param {Object} eventData - The event data
 * @param {string} eventData.issueId - The issue ID
 * @param {string} eventData.eventType - The type of event
 * @param {string} eventData.title - Event title
 * @param {string} eventData.description - Event description
 * @param {string} eventData.actorId - ID of the user who performed the action
 * @param {Object} eventData.metadata - Additional metadata
 * @param {string} eventData.taskId - Task ID (if applicable)
 * @param {string} eventData.assignedStaffId - Assigned staff ID (if applicable)
 * @param {string} eventData.assignedStaffRole - Assigned staff role (if applicable)
 */
export const createTimelineEvent = async (eventData) => {
    try {
        const { issueId, eventType, title, description, actorId, metadata = {}, taskId, assignedStaffId, assignedStaffRole } = eventData;

        // Determine actor role
        let actorRole = "Citizen";
        if (actorId) {
            // First check if it's a municipality user
            const municipality = await Municipality.findById(actorId);
            if (municipality) {
                actorRole = "Municipality Staff";
            } else {
                // Check if it's a regular user
                const user = await User.findById(actorId);
                if (user) {
                    // If it's a municipality staff, check their specific role in this issue
                    if (user.role === "Municipality Staff" && issueId) {
                        const issue = await Issue.findById(issueId);
                        if (issue && issue.staffsAssigned) {
                            const staffAssignment = issue.staffsAssigned.find(
                                staff => staff.user && staff.user.toString() === actorId.toString()
                            );
                            if (staffAssignment) {
                                // Use the specific role from the issue assignment
                                actorRole = staffAssignment.role; // Supervisor, Worker, or Coordinator
                            } else {
                                actorRole = "Municipality Staff";
                            }
                        } else {
                            actorRole = "Municipality Staff";
                        }
                    } else {
                        // Map other user roles to timeline actor roles
                        const roleMapping = {
                            "Admin": "Admin",
                            "User": "Citizen",  // Regular users are citizens
                            "Municipality Staff": "Municipality Staff"
                        };
                        if (roleMapping[user.role]) {
                            actorRole = roleMapping[user.role];
                        } else {
                            // Default to Citizen for any other role
                            actorRole = "Citizen";
                        }
                    }
                }
            }
        }

        const timelineEvent = new TimelineEvent({
            issueId,
            eventType,
            title,
            description,
            actor: actorId,
            actorRole,
            metadata,
            taskId,
            assignedStaffId,
            assignedStaffRole
        });

        await timelineEvent.save();
        return timelineEvent;
    } catch (error) {
        console.error("Error creating timeline event:", error);
        // Don't throw error to avoid breaking the main workflow
    }
};

/**
 * Gets timeline events for an issue
 * @param {string} issueId - The issue ID
 * @returns {Array} Array of timeline events
 */
export const getTimelineEvents = async (issueId) => {
    try {
        const events = await TimelineEvent.find({ issueId })
            .populate('actor', 'name email')
            .populate('assignedStaffId', 'name email')
            .sort({ createdAt: 1 }); // Chronological order

        return events;
    } catch (error) {
        console.error("Error fetching timeline events:", error);
        return [];
    }
};
