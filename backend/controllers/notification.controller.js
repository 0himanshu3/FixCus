import { Notification } from "../models/notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import { io } from "../server.js";
import { generateIssueAssignedEmailTemplate, generateIssueCompletedEmailTemplate, generateTaskAssignmentEmailTemplate, generateTaskEscalationEmailTemplate, generateTaskDeadlineReminderEmailTemplate } from "../utils/emailTemplates.js";

//Send notification when an issue is assigned to a staff
export const sendIssueAssignedNotification = async (issue, staffId) => {
    try {
        const staff = await User.findById(staffId);
        if (!staff) return console.error("Staff not found:", staffId);

        const msg = `You have been assigned a new project: "${issue.title}"`;

        // Create in-app notification
        await Notification.create({
            userId: staff._id,
            message: msg,
            type: "issue-assigned",
            relatedIssue: issue._id,
            url: `/issue/${issue.slug}`
        });

      const emailBody = generateIssueAssignedEmailTemplate(staff.name, issue.title);

      // Send the email
      await sendEmail({
        email: staff.email,
        subject: "New Issue Assigned",
        message: emailBody
      });

        // Emit real-time notification via socket
        io.to(staff._id.toString()).emit("new-notification", {
            message: msg,
            type: "issue-assigned",
            isRead: false
        });

    } catch (error) {
        console.error("Error sending issue-assigned notification:", error);
    }
};

//Send notification when an issue is completed
export const sendIssueCompletedNotification = async (issue, citizenId) => {
    try {
        const citizen = await User.findById(citizenId);
        if (!citizen) return console.error("Citizen not found:", citizenId);

        const msg = `Your issue "${issue.title}" has been marked as resolved`;

        // In-app notification
        await Notification.create({
            userId: citizen._id,
            message: msg,
            type: "issue-completed",
            relatedIssue: issue._id,
            url: `/issue/${issue.slug}`
        });

        // Emit real-time
        io.to(citizen._id.toString()).emit("new-notification", {
            message: msg,
            type: "issue-completed",
            isRead: false
        });

        const emailMsg = generateIssueCompletedEmailTemplate(citizen.name, issue.title);
        // Send email
        await sendEmail({
            email: citizen.email,
            subject: `Issue Completed: ${issue.title}`,
            message: emailMsg
        });

    } catch (error) {
        console.error("Error sending issue-completed notification:", error);
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

//Send notification when an issue is escalated to a supervisor or coordinator
export const sendTaskEscalationNotificationToStaff = async (staffId, issue, escalationData = {}) => {
  try {
    const staff = await User.findById(staffId);
    if (!staff) {
      console.error("Staff not found:", staffId);
      return { success: false, error: "Staff not found" };
    }

    const { 
      taskId, 
      originalTaskId, 
      escalationType, 
      newDeadline, 
      escalatedTo 
    } = escalationData;

    let msg, notificationType, url;

    // Determine notification content based on escalation type
    switch (escalationType) {
      case 'worker-to-coordinator':
        msg = `TASK ESCALATION: A task from issue "${issue.title}" has been escalated to you (Coordinator) due to overdue deadline. New deadline: ${newDeadline ? newDeadline.toLocaleDateString() : 'N/A'}`;
        notificationType = "task-escalation-coordinator";
        url = `/issue/${issue.slug}`;
        break;
      
      case 'coordinator-to-supervisor':
        msg = `TASK ESCALATION: A task from issue "${issue.title}" has been escalated to you (Supervisor) due to overdue deadline. New deadline: ${newDeadline ? newDeadline.toLocaleDateString() : 'N/A'}`;
        notificationType = "task-escalation-supervisor";
        url = `/issue/${issue.slug}`;
        break;
      
      case 'task-escalated-from-worker':
        msg = `TASK UPDATE: Your task from issue "${issue.title}" has been escalated to the Coordinator due to overdue deadline.`;
        notificationType = "task-escalated-from-worker";
        url = `/issue/${issue.slug}`;
        break;
      
      case 'task-escalated-from-coordinator':
        msg = `TASK UPDATE: Your task from issue "${issue.title}" has been escalated to the Supervisor due to overdue deadline.`;
        notificationType = "task-escalated-from-coordinator";
        url = `/issue/${issue.slug}`;
        break;
      
      default:
        msg = `TASK ESCALATION: A task from issue "${issue.title}" has been escalated to you due to overdue deadline.`;
        notificationType = "issue-escalation";
        url = `/issue/${issue.slug}`;
    }

    // Create in-app notification
    const notification = await Notification.create({
      userId: staff._id,
      message: msg,
      type: notificationType,
      relatedIssue: issue._id,
      relatedTask: taskId || originalTaskId,
      url: url,
      metadata: {
        escalationType,
        originalTaskId,
        newTaskId: taskId,
        escalatedTo,
        newDeadline: newDeadline ? newDeadline.toISOString() : null
      }
    });

    const emailMsg = generateTaskEscalationEmailTemplate(issue.title, msg);
    // Send email notification
    await sendEmail({
      email: staff.email,
      subject: "Task Escalation Notification",
      message: emailMsg
    });

    // Emit real-time notification via socket
    io.to(staff._id.toString()).emit("new-notification", {
      message: msg,
      type: notificationType,
      isRead: false,
      notificationId: notification._id,
      relatedIssue: issue._id,
      relatedTask: taskId || originalTaskId,
      url: url
    });

    console.log(`Escalation notification sent to ${staff.name} (${staff.email}): ${msg}`);
    return { success: true, notificationId: notification._id };

  } catch (error) {
    console.error("Error sending escalation notification:", error);
    return { success: false, error: error.message };
  }
};

// Send notification when a task is created (new assignment)
export const sendTaskAssignmentNotification = async (taskId, assigneeId, issue) => {
  try {
    const assignee = await User.findById(assigneeId);
    if (!assignee) {
      console.error("Assignee not found:", assigneeId);
      return { success: false, error: "Assignee not found" };
    }

    const msg = `NEW TASK ASSIGNED: You have been assigned a new task for issue "${issue.title}". Please review and start working on it.`;

    const notification = await Notification.create({
      userId: assignee._id,
      message: msg,
      type: "task-assigned",
      relatedIssue: issue._id,
      relatedTask: taskId,
      url: `/issue/${issue.slug}`,
      metadata: {
        taskId,
        issueId: issue._id,
        assignmentType: "new"
      }
    });

    const emailMsg = generateTaskAssignmentEmailTemplate(issue.title, assignee.name);
    // Send email notification
    await sendEmail({
      email: assignee.email,
      subject: "New Task Assigned",
      message: emailMsg
    });

    io.to(assignee._id.toString()).emit("new-notification", {
      message: msg,
      type: "task-assigned",
      isRead: false,
      notificationId: notification._id,
      relatedIssue: issue._id,
      relatedTask: taskId,
      url: `/issue/${issue.slug}`
    });

    console.log(`Task assignment notification sent to ${assignee.name}: ${msg}`);
    return { success: true, notificationId: notification._id };

  } catch (error) {
    console.error("Error sending task assignment notification:", error);
    return { success: false, error: error.message };
  }
};

// Send notification when a task deadline is approaching
export const sendTaskDeadlineReminderNotification = async (taskId, assigneeId, issue, deadline) => {
  try {
    const assignee = await User.findById(assigneeId);
    if (!assignee) {
      console.error("Assignee not found:", assigneeId);
      return { success: false, error: "Assignee not found" };
    }

    const timeLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
    const msg = `DEADLINE REMINDER: Your task for issue "${issue.title}" is due in ${timeLeft} day(s). Please ensure timely completion.`;

    const notification = await Notification.create({
      userId: assignee._id,
      message: msg,
      type: "task-deadline-reminder",
      relatedIssue: issue._id,
      relatedTask: taskId,
      url: `/issue/${issue.slug}`,
      metadata: {
        taskId,
        issueId: issue._id,
        deadline: deadline.toISOString(),
        daysLeft: timeLeft
      }
    });

    const emailMsg = generateTaskDeadlineReminderEmailTemplate(issue.title, assignee.name, deadline, timeLeft);
    // Send email notification
    await sendEmail({
      email: assignee.email,
      subject: "Task Deadline Reminder",
      message: emailMsg
    });

    io.to(assignee._id.toString()).emit("new-notification", {
      message: msg,
      type: "task-deadline-reminder",
      isRead: false,
      notificationId: notification._id,
      relatedIssue: issue._id,
      relatedTask: taskId,
      url: `/issue/${issue.slug}`
    });

    console.log(`Deadline reminder sent to ${assignee.name}: ${msg}`);
    return { success: true, notificationId: notification._id };

  } catch (error) {
    console.error("Error sending deadline reminder notification:", error);
    return { success: false, error: error.message };
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
      console.log("No assigner found for task:", taskId);
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

    console.log(`Task completion notification sent to ${assigner.name}: ${msg}`);
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
      console.log("No assignee found for task:", taskId);
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

    console.log(`Task status update notification sent to ${assignee.name}: ${msg}`);
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

    console.log(`Found ${upcomingTasks.length} tasks with upcoming deadlines`);

    for (const task of upcomingTasks) {
      results.processed++;
      try {
        const issue = task.issueId;
        if (!issue) {
          results.errors.push({ taskId: task._id, error: "Issue not found" });
          continue;
        }

        if (dryRun) {
          console.log(`[DRY RUN] Would send deadline reminder for task ${task._id} to ${task.assignedTo?.name}`);
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
            console.log(`Deadline reminder sent for task ${task._id}`);
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

    console.log(`Deadline reminder service completed: ${results.remindersSent} reminders sent, ${results.errors.length} errors`);
    return results;

  } catch (error) {
    console.error("Error in deadline reminder service:", error);
    return { ...results, errors: [...results.errors, { error: error.message }] };
  }
};
