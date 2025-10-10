import { Notification } from "../models/notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import { io } from "../server.js";
import { generateIssueAssignedEmailTemplate, generateIssueCompletedEmailTemplate, generateTaskAssignmentEmailTemplate, generateTaskEscalationEmailTemplate, generateTaskDeadlineReminderEmailTemplate } from "../utils/emailTemplates.js";
import Job from "../models/jobQueue.model.js";

//Send notification when an issue is assigned to a staff
export const sendIssueAssignedNotification = async (issue, staffId) => {
    try {
        const staff = await User.findById(staffId).select('name email');
        if (!staff) return console.error("Staff not found:", staffId);

        const msg = `You have been assigned a new issue: "${issue.title}"`;

        // Create in-app notification and email job concurrently
        await Promise.all([
            Notification.create({
                userId: staff._id,
                message: msg,
                type: "issue-assigned",
                relatedIssue: issue._id,
                url: `/issue/${issue.slug}`
            }),
            Job.create({
                type: "Issue_Assigned_Email",
                payload: {
                    email: staff.email,
                    staffName: staff.name,
                    issueTitle: issue.title,
                },
            })
        ]);

        // Emit real-time notification via socket
        io.to(staff._id.toString()).emit("new-notification", { message: msg });

    } catch (error) {
        console.error("Error creating issue-assigned notification job:", error);
    }
};

//Send notification when an issue is escalated
export const sendTaskEscalationNotificationToStaff = async (staffId, issue, escalationData = {}) => {
    try {
        const staff = await User.findById(staffId).select('name email');
        if (!staff) return { success: false, error: "Staff not found" };

        const { taskId, escalationType, newDeadline } = escalationData;
        let msg = `A task for issue "${issue.title}" has been escalated.`; // Default message
        
        // Simplified message generation
        if (escalationType?.includes('to-coordinator') || escalationType?.includes('to-supervisor')) {
            msg = `TASK ESCALATION: A task from issue "${issue.title}" has been escalated to you. New deadline: ${newDeadline ? newDeadline.toLocaleDateString() : 'N/A'}`;
        } else if (escalationType?.includes('from-worker') || escalationType?.includes('from-coordinator')) {
            msg = `TASK UPDATE: Your task from issue "${issue.title}" has been escalated due to an overdue deadline.`;
        }

        // Create in-app notification and email job concurrently
        const [notification] = await Promise.all([
            Notification.create({
                recipientId: staff._id,
                message: msg,
                type: "task-escalation",
                relatedIssue: issue._id,
                relatedTask: taskId,
                url: `/issue/${issue.slug}`
            }),
            Job.create({
                type: "Task_Escalation_Email",
                payload: {
                    email: staff.email,
                    staffName: staff.name,
                    issueTitle: issue.title,
                    message: msg 
                }
            })
        ]);

        // Emit real-time notification via socket
        io.to(staff._id.toString()).emit("new-notification", { message: msg });
        return { success: true, notificationId: notification._id };

    } catch (error) {
        console.error("Error creating escalation notification job:", error);
        return { success: false, error: error.message };
    }
};

// Send notification when a task is created
export const sendTaskAssignmentNotification = async (taskId, assigneeId, issue) => {
    try {
        const assignee = await User.findById(assigneeId).select('name email');
        if (!assignee) return { success: false, error: "Assignee not found" };

        const msg = `NEW TASK: You have been assigned a new task for issue "${issue.title}".`;

        const [notification] = await Promise.all([
            Notification.create({
                recipientId: assignee._id,
                message: msg,
                type: "task-assigned",
                relatedIssue: issue._id,
                relatedTask: taskId,
                url: `/issue/${issue.slug}`
            }),
            Job.create({
                type: "Task_Assignment_Email",
                payload: {
                    email: assignee.email,
                    staffName: assignee.name,
                    issueTitle: issue.title,
                }
            })
        ]);

        io.to(assignee._id.toString()).emit("new-notification", { message: msg });
        return { success: true, notificationId: notification._id };

    } catch (error) {
        console.error("Error creating task assignment notification job:", error);
        return { success: false, error: error.message };
    }
};

// Send notification when a task deadline is approaching
export const sendTaskDeadlineReminderNotification = async (taskId, assigneeId, issue, deadline) => {
    try {
        const assignee = await User.findById(assigneeId).select('name email');
        if (!assignee) return { success: false, error: "Assignee not found" };

        const timeLeft = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
        const msg = `DEADLINE REMINDER: Your task for issue "${issue.title}" is due in ${timeLeft} day(s).`;

        const [notification] = await Promise.all([
            Notification.create({
                recipientId: assignee._id,
                message: msg,
                type: "task-deadline-reminder",
                relatedIssue: issue._id,
                relatedTask: taskId,
                url: `/issue/${issue.slug}`
            }),
            Job.create({
                type: "Task_Deadline_Reminder_Email",
                payload: {
                    email: assignee.email,
                    staffName: assignee.name,
                    issueTitle: issue.title,
                    deadline: deadline.toISOString(),
                    timeLeft: timeLeft
                }
            })
        ]);
        
        io.to(assignee._id.toString()).emit("new-notification", { message: msg });
        return { success: true, notificationId: notification._id };

    } catch (error) {
        console.error("Error creating deadline reminder notification job:", error);
        return { success: false, error: error.message };
    }
};

//Send notification when an issue is completed
export const sendIssueCompletedNotification = async (issue, citizenId) => {
    try {
        const citizen = await User.findById(citizenId).select('name email');
        if (!citizen) return console.error("Citizen not found:", citizenId);

        const msg = `Your issue "${issue.title}" has been marked as resolved`;

        // Create in-app notification and email job concurrently
        await Promise.all([
            Notification.create({
                recipientId: citizen._id,
                message: msg,
                type: "issue-completed",
                relatedIssue: issue._id,
                url: `/issue/${issue.slug}`
            }),
            // Create a job for the slow email task
            Job.create({
                type: "Issue_Completed_Email",
                payload: {
                    email: citizen.email,
                    staffName: citizen.name, 
                    issueTitle: issue.title,
                },
            })
        ]);

        // Emit real-time notification via socket
        io.to(citizen._id.toString()).emit("new-notification", {
            message: msg,
            type: "issue-completed",
            isRead: false
        });

    } catch (error) {
        console.error("Error creating issue-completed notification job:", error);
    }
};

// Send notification when an issue is rejected (municipality)
export const sendIssueRejectedNotification = async (issue, citizenId) => {
    try {
        const citizen = await User.findById(citizenId);
        if (!citizen) return console.error("Citizen not found:", citizenId);

        const msg = `Your application for issue "${issue.title}" has been rejected`;

        // In-app notification
        await Notification.create({
            userId: citizen._id,
            message: msg,
            type: "issue-rejected",
            relatedIssue: issue._id,
            url: `/issue/${issue.slug}`
        });

        // Send email
        await sendEmail({
            email: citizen.email,
            subject: `Issue Rejected: ${issue.title}`,
            message: `Hello ${citizen.name},\n\nWe regret to inform you that your application for "${issue.title}" has been rejected.\n\n- Municipality Team`
        });

    } catch (error) {
        console.error("Error sending issue-rejected notification:", error);
    }
};

//Generic send notification function
export const sendNotification = async (req, res, next) => {
    try {
        const { userId, message, type, relatedIssue, relatedTask, url } = req.body;
        if (!userId || !message || !type) {
            return next(new ApiError(400, "userId, message, and type are required"));
        }

        const notification = await Notification.create({
            userId, message, type, relatedIssue, relatedTask, url
        });

        io.to(userId.toString()).emit("new-notification", {
            message, type, isRead: false
        });

        return res.status(201).json(new ApiResponse(201, notification, "Notification sent successfully"));

    } catch (error) {
        next(new ApiError(500, "Error sending notifications"));
    }
};

//Fetch all notifications
export const getAllNotifications = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
        return res.status(200).json(new ApiResponse(200, notifications, "Notifications fetched successfully"));
    } catch (error) {
        next(error);
    }
};

//Mark notification as read
export const markNotificationAsRead = async (req, res, next) => {
    try {
        const updatedNotification = await Notification.findByIdAndUpdate(
            req.params.notificationId,
            { isRead: true },
            { new: true }
        );

        if (!updatedNotification) return next(new ApiError(404, "Notification not found"));

        // Emit socket event for real-time update
        io.to(updatedNotification.userId.toString()).emit("notification-updated", {
            action: "read",
            notificationId: updatedNotification._id
        });

        return res.status(200).json(new ApiResponse(200, updatedNotification, "Notification updated successfully"));
    } catch (error) {
        next(error);
    }
};

//Delete notification
export const deleteNotification = async (req, res, next) => {
    try {
        const { notificationId } = req.params;
        const deletedNotification = await Notification.findByIdAndDelete(notificationId);

        if (!deletedNotification) return next(new ApiError(404, "Notification not found"));

        // Emit socket event for real-time update
        io.to(deletedNotification.userId.toString()).emit("notification-updated", {
            action: "delete",
            notificationId: deletedNotification._id
        });

        return res.status(200).json(new ApiResponse(200, null, "Notification deleted successfully"));
    } catch (error) {
        next(error);
    }
};


// Send notification when a task is completed
export const sendTaskCompletionNotification = async (taskId, issue, completedBy) => {
  try {
    // Notify the person who assigned the task
    const task = await Task.findById(taskId).populate('assignedBy', 'name email');
    if (!task) {
      console.error("Task not found:", taskId);
      return { success: false, error: "Task not found" };
    }

    const assigner = task.assignedBy;
    if (!assigner) {
      
      return { success: false, error: "No assigner found" };
    }

    const msg = `TASK COMPLETED: A task for issue "${issue.title}" has been completed by ${completedBy}. Please review the completion.`;

    const notification = await Notification.create({
      userId: assigner._id,
      message: msg,
      type: "task-completed",
      relatedIssue: issue._id,
      relatedTask: taskId,
      url: `/issue/${issue.slug}`,
      metadata: {
        taskId,
        issueId: issue._id,
        completedBy,
        completedAt: new Date().toISOString()
      }
    });

    io.to(assigner._id.toString()).emit("new-notification", {
      message: msg,
      type: "task-completed",
      isRead: false,
      notificationId: notification._id,
      relatedIssue: issue._id,
      relatedTask: taskId,
      url: `/issue/${issue.slug}`
    });

    
    return { success: true, notificationId: notification._id };

  } catch (error) {
    console.error("Error sending task completion notification:", error);
    return { success: false, error: error.message };
  }
};

// Send notification when a task status is updated
export const sendTaskStatusUpdateNotification = async (taskId, issue, oldStatus, newStatus, updatedBy) => {
  try {
    const task = await Task.findById(taskId).populate('assignedTo', 'name email');
    if (!task) {
      console.error("Task not found:", taskId);
      return { success: false, error: "Task not found" };
    }

    const assignee = task.assignedTo;
    if (!assignee) {
      
      return { success: false, error: "No assignee found" };
    }

    const msg = `TASK STATUS UPDATE: Task for issue "${issue.title}" status changed from "${oldStatus}" to "${newStatus}" by ${updatedBy}.`;

    const notification = await Notification.create({
      userId: assignee._id,
      message: msg,
      type: "task-status-update",
      relatedIssue: issue._id,
      relatedTask: taskId,
      url: `/issue/${issue.slug}`,
      metadata: {
        taskId,
        issueId: issue._id,
        oldStatus,
        newStatus,
        updatedBy,
        updatedAt: new Date().toISOString()
      }
    });

    io.to(assignee._id.toString()).emit("new-notification", {
      message: msg,
      type: "task-status-update",
      isRead: false,
      notificationId: notification._id,
      relatedIssue: issue._id,
      relatedTask: taskId,
      url: `/issue/${issue.slug}`
    });

    
    return { success: true, notificationId: notification._id };

  } catch (error) {
    console.error("Error sending task status update notification:", error);
    return { success: false, error: error.message };
  }
};

// Service to send deadline reminders for tasks approaching their deadline
export const sendDeadlineRemindersService = async ({ dryRun = false } = {}) => {
  const results = {
    processed: 0,
    remindersSent: 0,
    errors: []
  };

  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    // Find tasks due in the next 1-2 days that are not completed
    const upcomingTasks = await Task.find({
      deadline: { 
        $gte: tomorrow, 
        $lte: dayAfterTomorrow 
      },
      status: { $ne: "Completed" },
      hasEscalated: false
    }).populate('assignedTo', 'name email').populate('issueId', 'title');

    

    for (const task of upcomingTasks) {
      results.processed++;
      try {
        const issue = task.issueId;
        if (!issue) {
          results.errors.push({ taskId: task._id, error: "Issue not found" });
          continue;
        }

        if (dryRun) {
          results.remindersSent++;
        } else {
          const reminderResult = await sendTaskDeadlineReminderNotification(
            task._id, 
            task.assignedTo._id, 
            issue, 
            task.deadline
          );
          
          if (reminderResult.success) {
            results.remindersSent++;
          } else {
            results.errors.push({ 
              taskId: task._id, 
              error: reminderResult.error 
            });
          }
        }
      } catch (error) {
        console.error(`Error processing deadline reminder for task ${task._id}:`, error);
        results.errors.push({ 
          taskId: task._id, 
          error: error.message 
        });
      }
    }

    
    return results;

  } catch (error) {
    console.error("Error in deadline reminder service:", error);
    return { ...results, errors: [...results.errors, { error: error.message }] };
  }
};
