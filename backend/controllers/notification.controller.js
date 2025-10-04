import { Notification } from "../models/notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { sendEmail } from "../utils/sendEmail.js";
// import { io } from "../server.js";

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
            url: `/issues/${issue._id}`
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

        const msg = `Your issue "${issue.title}" has been marked as completed`;

        // In-app notification
        await Notification.create({
            userId: citizen._id,
            message: msg,
            type: "issue-completed",
            relatedIssue: issue._id,
            url: `/issues/${issue._id}`
        });

        // Emit real-time
        io.to(citizen._id.toString()).emit("new-notification", {
            message: msg,
            type: "issue-completed",
            isRead: false
        });

        // Send email
        await sendEmail({
            email: citizen.email,
            subject: `Issue Completed: ${issue.title}`,
            message: `Hello ${citizen.name},\n\nYour issue "${issue.title}" has been completed. Thank you for reporting it.\n\n- Municipality Team`
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
            url: `/issues/${issue._id}`
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

        return res.status(200).json(new ApiResponse(200, null, "Notification deleted successfully"));
    } catch (error) {
        next(error);
    }
};
