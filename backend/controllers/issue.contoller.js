import Issue from "../models/issue.model.js";
import { Task } from "../models/task.model.js";
import { User } from "../models/user.model.js";
import { Municipality } from "../models/muncipality.model.js";
import { ResolutionReport } from "../models/resolutionReport.model.js";
import {
    sendTaskEscalationNotificationToStaff,
    sendTaskAssignmentNotification,
    sendIssueAssignedNotification
} from "./notification.controller.js";
import Feedback from "../models/feedback.model.js";
import { createTimelineEvent, getTimelineEvents } from "../utils/timelineHelper.js";
import mongoose from "mongoose";
import fetch from "node-fetch";
import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

export const createIssue = async (req, res) => {
    try {
        
        const { title, content, category, issueLocation, issuePublishDate, images, videos, issueDistrict, issueState, issueCountry } = req.body;

        if (!title || !category || !issueLocation || !issuePublishDate) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        // reportedBy comes directly from authenticated user
        const reportedBy = req.user._id;

        const issue = new Issue({
            title,
            content,
            category,
            issueLocation,
            issueDistrict,
            issueState,
            issueCountry,
            issuePublishDate,
            images,
            videos,
            reportedBy,
        });

        await issue.save();

        // Create timeline event for issue creation
        await createTimelineEvent({
            issueId: issue._id,
            eventType: 'issue_created',
            title: 'Issue Created',
            description: `Issue "${title}" was created and published`,
            actorId: reportedBy,
            metadata: {
                category,
                location: issueDistrict,
                priority: issue.priority
            }
        });

        res.status(201).json({
            success: true,
            message: "Issue created successfully",
            issue,
        });
    } catch (err) {
        console.error("Error creating issue:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get all issues
export const getIssues = async (req, res) => {
    try {
        const {
            title,
            category,
            priority,
            status,
            location,
            votes,
            recency, // newest / oldest
        } = req.query;

        // Build filter object dynamically
        const filter = {};

        if (title) {
            filter.title = { $regex: title, $options: "i" }; // case-insensitive partial match
        }

        if (category) {
            filter.category = category;
        }

        if (priority) {
            filter.priority = priority;
        }

        if (status) {
            filter.status = status; // if user specifies status, use it
        } else {
            // Otherwise, exclude "Not Resolved"
            filter.status = { $ne: "Not Resolved" };
        }

        if (location) {
            filter.$or = [
                { issueDistrict: { $regex: location, $options: "i" } },
                { issueState: { $regex: location, $options: "i" } },
                { issueCountry: { $regex: location, $options: "i" } },
                { issueLocation: { $regex: location, $options: "i" } }
            ];
        }

        // Build sort option
        let sortOption = { createdAt: -1 }; // default newest first
        if (recency === "newest") sortOption = { createdAt: -1 };
        else if (recency === "oldest") sortOption = { createdAt: 1 };

        if (votes === "upvoted") sortOption = { upvotes: -1 };
        else if (votes === "downvoted") sortOption = { downvotes: -1 };

        const issues = await Issue.find(filter)
            .populate("reportedBy", "name email")
            .populate("staffsAssigned", "name email")
            .sort(sortOption);

        res.status(200).json({ success: true, issues });
    } catch (err) {
        console.error("Error fetching issues:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



export const upvoteIssue = async (req, res) => {
    const { issueId } = req.body;
    const userId = req.user._id;

    try {
        const issue = await Issue.findById(issueId);
        if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });

        // Remove from downvotes if present
        issue.downvotes = issue.downvotes.filter((id) => id.toString() !== userId.toString());

        // Toggle upvote
        if (issue.upvotes.includes(userId)) {
            issue.upvotes = issue.upvotes.filter((id) => id.toString() !== userId.toString());
        } else {
            issue.upvotes.push(userId);
        }

        await issue.save();
        res.status(200).json({ success: true, upvotes: issue.upvotes.length, downvotes: issue.downvotes.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


export const downvoteIssue = async (req, res) => {
    const { issueId } = req.body;
    const userId = req.user._id;

    try {
        const issue = await Issue.findById(issueId);
        if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });

        // Remove from upvotes if present
        issue.upvotes = issue.upvotes.filter((id) => id.toString() !== userId.toString());

        // Toggle downvote
        if (issue.downvotes.includes(userId)) {
            issue.downvotes = issue.downvotes.filter((id) => id.toString() !== userId.toString());
        } else {
            issue.downvotes.push(userId);
        }

        await issue.save();
        res.status(200).json({ success: true, upvotes: issue.upvotes.length, downvotes: issue.downvotes.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


export const addComment = async (req, res) => {
    const { issueId, content } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) return res.status(400).json({ success: false, message: "Comment cannot be empty" });

    try {
        const issue = await Issue.findById(issueId);
        if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });

        issue.comments.push({ user: userId, content });
        await issue.save();

        // Create timeline event for comment
        await createTimelineEvent({
            issueId: issueId,
            eventType: 'comment_added',
            title: 'Comment Added',
            description: `New comment added: ${content.substring(0, 50)}...`,
            actorId: userId,
            metadata: {
                commentContent: content
            }
        });

        const populatedIssue = await issue.populate("comments.user", "name email");
        res.status(200).json({ success: true, comments: populatedIssue.comments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const editComment = async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    try {
        const issue = await Issue.findOne({ "comments._id": commentId });

        if (!issue)
            return res.status(404).json({ success: false, message: "Comment not found" });

        const comment = issue.comments.id(commentId);

        // Only comment owner can edit
        if (comment.user.toString() !== userId.toString())
            return res.status(403).json({ success: false, message: "Unauthorized" });

        comment.content = content;
        await issue.save();

        res.status(200).json({ success: true, message: "Comment updated", comment });
    } catch (err) {
        console.error("Error editing comment:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const deleteComment = async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    try {
        const issue = await Issue.findOne({ "comments._id": commentId });

        if (!issue)
            return res.status(404).json({ success: false, message: "Comment not found" });

        const comment = issue.comments.id(commentId);

        // Only comment owner can delete
        if (comment.user.toString() !== userId.toString())
            return res.status(403).json({ success: false, message: "Unauthorized" });

        // Use pull to remove subdocument
        issue.comments.pull({ _id: commentId });
        await issue.save();

        res.status(200).json({ success: true, message: "Comment deleted" });
    } catch (err) {
        console.error("Error deleting comment:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
export const getIssueBySlug = async (req, res) => {
    const { slug } = req.params;

    try {
        // Fetch issue and populate basic relations
        const issue = await Issue.findOne({ slug })
            .populate("reportedBy", "name email")
            .populate("issueTakenUpBy", "name municipalityName email")
            .populate({
                path: "staffsAssigned.user",
                select: "name email _id",
            })
            .populate({
                path: "comments.user",
                select: "name email",
            });

        if (!issue) {
            return res.status(404).json({ success: false, message: "Issue not found" });
        }

        // Fetch ALL tasks for this issue and populate assignedBy/assignedTo and updates' authors
        const tasksForIssue = await Task.find({ issueId: issue._id })
            .populate("assignedBy", "name email _id")
            .populate("assignedTo", "name email _id")
            .populate({
                path: "taskUpdates.updatedBy",
                select: "name email _id",
            })
            .lean();

        // Build a map: assignedToId -> [tasks]
        const tasksByAssignee = tasksForIssue.reduce((acc, t) => {
            const assignedToId = t.assignedTo ? String(t.assignedTo._id) : "unassigned";
            if (!acc[assignedToId]) acc[assignedToId] = [];
            // pick only necessary fields for response
            acc[assignedToId].push({
                _id: t._id,
                title: t.title,
                description: t.description,
                status: t.status,
                deadline: t.deadline,
                roleOfAssignee: t.roleOfAssignee,
                taskCompletionProof: t.taskCompletionProof,
                taskProofImages: t.taskProofImages,
                taskProofSubmitted: t.taskProofSubmitted,
                assignedBy: t.assignedBy ? { id: t.assignedBy._id, name: t.assignedBy.name, email: t.assignedBy.email } : null,
                assignedTo: t.assignedTo ? { id: t.assignedTo._id, name: t.assignedTo.name, email: t.assignedTo.email } : null,
                taskUpdates: (t.taskUpdates || []).map((u) => ({
                    updateText: u.updateText,
                    updatedAt: u.updatedAt,
                    updatedBy: u.updatedBy ? { id: u.updatedBy._id, name: u.updatedBy.name, email: u.updatedBy.email } : null,
                })),
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
            });
            return acc;
        }, {});

        // Transform staffsAssigned to include role + user details (with _id) and their tasks
        const formattedStaffs = (issue.staffsAssigned || []).map((s) => {
            const userObj = s.user
                ? { id: s.user._id, name: s.user.name, email: s.user.email }
                : null;

            const assigneeId = s.user ? String(s.user._id) : null;
            const tasksForUser = assigneeId ? (tasksByAssignee[assigneeId] || []) : [];

            return {
                role: s.role,
                user: userObj,
                tasks: tasksForUser,
            };
        });

        // For completeness also include any tasks that are assigned to users not in staffsAssigned
        // (optional: include unassigned or outside staff tasks grouped separately)
        const staffIdsInIssue = new Set((issue.staffsAssigned || []).map((s) => (s.user ? String(s.user._id) : null)));
        const extraAssigned = Object.keys(tasksByAssignee)
            .filter((aid) => aid !== "unassigned" && !staffIdsInIssue.has(aid))
            .map((aid) => ({
                user: { id: aid },
                role: null,
                tasks: tasksByAssignee[aid],
            }));

        const allStaffsWithTasks = [...formattedStaffs, ...extraAssigned];

        // Build issue response
        const issueData = {
            _id: issue._id,
            title: issue.title,
            slug: issue.slug,
            category: issue.category,
            priority: issue.priority,
            status: issue.status,
            issueLocation: issue.issueLocation,
            issueDistrict: issue.issueDistrict,
            issueState: issue.issueState,
            issueCountry: issue.issueCountry,
            issuePublishDate: issue.issuePublishDate,
            content: issue.content,
            images: issue.images,
            videos: issue.videos,
            reportedBy: issue.reportedBy,
            staffsAssigned: allStaffsWithTasks,
            upvotes: issue.upvotes,
            downvotes: issue.downvotes,
            comments: issue.comments,
            deadline: issue.deadline,
            issueTakenUpBy: issue.issueTakenUpBy,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt,
            whatsappLink: issue.whatsappLink,
        };

        return res.status(200).json({ success: true, issue: issueData });
    } catch (err) {
        console.error("Error fetching issue by slug:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};


export const getCompletedIssues = async (req, res) => {
    try {
        const issues = await Issue.find({ status: 'Resolved' });
        res.status(200).json({
            success: true,
            issues
        });
    } catch (err) {
        console.error('Error fetching completed issues:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch completed issues'
        });
    }
};
export const getCompletedIssuesByMuni = async (req, res) => {
    try {
        const user=req.user
        const issues = await Issue.find({ 
                status: 'Resolved', 
                issueTakenUpBy: user._id 
                });
        res.status(200).json({
            success: true,
            issues
        });
    } catch (err) {
        console.error('Error fetching completed issues:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch completed issues'
        });
    }
};

export const getIssueDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const issue = await Issue.findById(id);

        if (!issue) {
            return res.status(404).json({ success: false, message: 'Issue not found' });
        }

        res.status(200).json({ success: true, issue });
    } catch (error) {
        console.error('Error fetching issue details:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const getMonthlyAnalysis = async (req, res) => {
    const { month } = req.query;
    const userId=req.user._id;
 
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    if (!month) return res.status(400).json({ error: 'Missing month' });

    try {
        // Parse year and month from the query
        const [year, monthIndex] = month.split('-').map(Number); // monthIndex is 1-based

        // Start and end dates for the month
        const startDate = new Date(year, monthIndex - 1, 1);
        const endDate = new Date(year, monthIndex, 0, 23, 59, 59, 999);
        
        // Get assigned issues in that month
        const assignedIssues = await Issue.find({
            issueTakenUpBy: userId,
            issuePublishDate: { $gte: startDate, $lte: endDate }
        });
       
        const completedIssues = assignedIssues.filter(issue => issue.status === 'Resolved');
        const totalAssigned = assignedIssues.length;
        const totalCompleted = completedIssues.length;

        const munic = await Municipality.findById(userId);
        const staffCount = await User.countDocuments({ role: 'Municipality Staff', district: munic?.district });

        const avgCompletionTimeHours = completedIssues.length > 0
            ? completedIssues.reduce((sum, issue) => {
                const created = new Date(issue.issueTakenUpTime);
                const resolved = new Date(issue.resolvedAt);
                return sum + (resolved - created) / (1000 * 60 * 60);
            }, 0) / completedIssues.length
            : 0;

        const issuesWithCounts = assignedIssues.map(issue => ({
            ...issue.toObject(), 
            upvoteCount: issue.upvotes?.length || 0,
            downvoteCount: issue.downvotes?.length || 0
            }));

            const mostUpvoted = issuesWithCounts.length
            ? issuesWithCounts.reduce((max, issue) => issue.upvoteCount > max.upvoteCount ? issue : max)
            : null;

            const mostDownvoted = issuesWithCounts.length
            ? issuesWithCounts.reduce((max, issue) => issue.downvoteCount > max.downvoteCount ? issue : max)
            : null;

            const votesData = issuesWithCounts
            .map(issue => ({
                title: issue.title,
                upvotes: issue.upvoteCount,
                downvotes: issue.downvoteCount
            }))
            .sort((a, b) => b.upvotes - a.upvotes)
            .slice(0, 5);
          
        res.json({
            assignedIssues: totalAssigned,
            completedIssues: totalCompleted,
            avgCompletionTimeHours,
            staffCount,
            mostUpvoted,
            mostDownvoted,
            votesData
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const takeUpIssue = async (req, res) => {
    try {
        const { issueId, deadline } = req.body;

        if (!issueId || !deadline) {
            return res.status(400).json({ success: false, message: "Issue ID and deadline are required" });
        }

        const issue = await Issue.findById(issueId);

        if (!issue) {
            return res.status(404).json({ success: false, message: "Issue not found" });
        }

        if (issue.status !== "Open") {
            return res.status(400).json({ success: false, message: "Only open issues can be taken up" });
        }

        // Check that deadline is not in the past
        const selectedDeadline = new Date(deadline);
        const now = new Date();
        now.setHours(0, 0, 0, 0); // ignore time, compare dates only
        if (selectedDeadline < now) {
            return res.status(400).json({ success: false, message: "Deadline cannot be in the past" });
        }

        // Assign the municipality and set deadline
        issue.issueTakenUpBy = req.municipality._id;
        issue.issueTakenUpTime = new Date();
        issue.deadline = selectedDeadline;
        issue.status = "In Progress";

        await issue.save();

        // Create timeline event for issue taken up
        await createTimelineEvent({
            issueId: issue._id,
            eventType: 'issue_taken_up',
            title: 'Issue Taken Up',
            description: `Issue was taken up by municipality with deadline: ${selectedDeadline.toLocaleDateString()}`,
            actorId: req.municipality._id,
            metadata: {
                deadline: selectedDeadline.toLocaleDateString(),
                municipalityName: req.municipality.municipalityName
            }
        });

        res.status(200).json({ success: true, message: "Issue successfully taken up", issue });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const assignStaff = async (req, res) => {
    try {
        const { issueId, staffEmail, role } = req.body;

        if (!issueId || !staffEmail || !role) {
            return res.status(400).json({ message: "Issue ID, Staff Email, and Role are required" });
        }

        // Find issue
        const issue = await Issue.findById(issueId);
        if (!issue) {
            return res.status(404).json({ message: "Issue not found" });
        }

        //there can only be one supervisor per issue
        if (role === "Supervisor") {
            const supervisorExists = issue.staffsAssigned.some(
                (s) => s.role === "Supervisor"
            );
            if (supervisorExists) {
                return res.status(400).json({ message: "There can be only one supervisor per issue" });
            }
        }


        // Find staff by email
        const staff = await User.findOne({ email: staffEmail });
        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }


        if (staff.role !== "Municipality Staff") {
            return res.status(400).json({ message: "User is not a Municipality Staff" });
        }

        // Check if staff already assigned with same role
        const alreadyAssigned = issue.staffsAssigned.some(
            (s) => s.user.toString() === staff._id.toString() && s.role === role
        );
        if (alreadyAssigned) {
            return res.status(400).json({ message: "Staff already assigned to this issue with this role" });
        }

        // Assign staff
        issue.staffsAssigned.push({ role, user: staff._id });
        staff.issuesParticipated.push({ issueId: issue._id });
        await issue.save();
        await staff.save();
      
        //send notification to the staff 
        await sendIssueAssignedNotification(issue, staff._id);

        // Create timeline event for staff assignment
        await createTimelineEvent({ 
            issueId: issue._id,
            eventType: 'staff_assigned',
            title: 'Staff Assigned',
            description: `${staff.name} was assigned as ${role}`,
            actorId: req.municipality._id,
            assignedStaffId: staff._id,
            assignedStaffRole: role,
            metadata: {
                staffName: staff.name,
                staffEmail: staff.email
            }
        });

        res.status(200).json({
            success: true,
            message: "Staff assigned successfully",
            issue,
        });
    } catch (error) {
        console.error("Error assigning staff:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
// Get assigned staff for an issue
export const getAssignedStaff = async (req, res) => {
    try {
        const { issueId } = req.body; // issueId from body

        if (!issueId) {
            return res.status(400).json({ message: "Issue ID is required" });
        }

        const issue = await Issue.findById(issueId).populate("staffsAssigned.user", "name email role");
        if (!issue) {
            return res.status(404).json({ message: "Issue not found" });
        }

        res.status(200).json({
            success: true,
            message: "Assigned staff fetched successfully",
            assignedStaff: issue.staffsAssigned, // contains [{ role, user: {name,email,role} }]
        });
    } catch (error) {
        console.error("Error fetching assigned staff:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// Resolve Issue (Supervisor)
export const resolveIssue = async (req, res) => {
    try {
        const { issueId } = req.params;
        const { summary, resolutionImages = [], staffPerformance = [] } = req.body;

        // Basic validation
        if (!summary || typeof summary !== "string" || summary.trim().length === 0) {
            return res.status(400).json({ message: "Summary is required" });
        }
        if (!Array.isArray(resolutionImages)) {
            return res.status(400).json({ message: "resolutionImages must be an array" });
        }
        if (!Array.isArray(staffPerformance)) {
            return res.status(400).json({ message: "staffPerformance must be an array" });
        }

        // Load issue
        const issue = await Issue.findById(issueId);
        if (!issue) return res.status(404).json({ message: "Issue not found" });

        // Prevent double-resolve
        if (String(issue.status).toLowerCase() === "resolved") {
            return res.status(400).json({ message: "Issue already resolved" });
        }

        // Optional: Enforce role-based permission (uncomment if you keep role on req.user)
        // if (!req.user || req.user.role !== "Supervisor") {
        //   return res.status(403).json({ message: "Only supervisors can resolve issues" });
        // }

        // sanitize & normalize staffPerformance entries, and filter out any entry that matches the supervisor
        const supervisorEmail = req.user?.email?.toLowerCase?.();
        const supervisorIdStr = req.user?._id ? String(req.user._id) : null;

        const cleanedStaff = staffPerformance
            .filter((p) => p && (p.email || p.name)) // must have at least an email or name
            .map((p) => {
                const item = {
                    name: String(p.name || "").trim(),
                    email: String(p.email || "").trim(),
                    role: String(p.role || "").trim(),
                    rating: Number.isFinite(Number(p.rating)) ? Number(p.rating) : 0,
                    comment: String(p.comment || "").trim(),
                };

                // attach userId if valid ObjectId provided
                if (p.userId) {
                    try {
                        item.userId = mongoose.Types.ObjectId(String(p.userId));
                    } catch (e) {
                        // ignore invalid ObjectId (optional)
                    }
                }
                return item;
            })
            // remove supervisor (defensive)
            .filter((p) => {
                if (!p) return false;
                if (supervisorEmail && p.email && p.email.toLowerCase() === supervisorEmail) return false;
                if (supervisorIdStr && p.userId && String(p.userId) === supervisorIdStr) return false;
                return true;
            })
            // ensure rating range
            .map((p) => {
                if (typeof p.rating !== "number" || Number.isNaN(p.rating)) p.rating = 0;
                if (p.rating < 1) p.rating = 1;
                if (p.rating > 5) p.rating = 5;
                return p;
            });

        // Create resolution report
        const report = new ResolutionReport({
            issue: issue._id,
            summary: summary.trim(),
            images: resolutionImages.map(String),
            supervisor: req.user._id,
            staffPerformance: cleanedStaff
        });

        await report.save();

        // Update issue: status + resolvedBy + resolvedAt + reference to report + optional human summary
        issue.status = "Resolved";
        issue.resolvedBy = req.user._id;
        issue.resolvedAt = Date.now();
        issue.resolutionReport = report._id;            // requires Issue schema to have this field (see note)
        await issue.save();

        // Create timeline event for issue resolution
        await createTimelineEvent({
            issueId: issue._id,
            eventType: 'issue_resolved',
            title: 'Issue Resolved',
            description: `Issue was marked as resolved with summary: ${summary.substring(0, 100)}...`,
            actorId: req.user._id,
            metadata: {
                summary,
                resolutionImagesCount: resolutionImages.length,
                staffPerformanceCount: cleanedStaff.length
            }
        });

        // return populated report for convenience
        const populatedReport = await ResolutionReport.findById(report._id)
            .populate("supervisor", "name email")
            .lean();

        return res.status(200).json({
            message: "Issue resolved successfully",
            resolutionReport: populatedReport
        });
    } catch (err) {
        console.error("resolveIssue error:", err);
        return res.status(500).json({ message: "Server Error" });
    }
};

//make separate
export async function escalateOverdueTasksService({ dryRun = false } = {}) {
    const now = new Date();
    const results = {
        processed: 0,
        skippedNoSupervisor: 0,
        skippedNoAssignedBy: 0,
        createdTasks: [],
        errors: []
    };

    // find overdue tasks not completed and not escalated
    const overdueTasks = await Task.find({
        deadline: { $lt: now },
        status: { $ne: "Completed" },
        hasEscalated: false
    });

    for (const task of overdueTasks) {
        results.processed++;
        try {
            // load issue
            const issue = await Issue.findById(task.issueId).lean();
            if (!issue) {
                results.errors.push({ taskId: task._id, msg: "Issue not found" });
                continue;
            }

            // find supervisor in issue.staffsAssigned
            const supervisorEntry = (issue.staffsAssigned || []).find(s => s.role === "Supervisor" && s.user);
            const supervisorId = supervisorEntry ? (supervisorEntry.user._id || supervisorEntry.user) : null;
            if (!supervisorId) {
                results.skippedNoSupervisor++;
                continue;
            }

            // compute new deadline = original deadline + 2 days
            const newDeadline = new Date(task.deadline.getTime() + (2 * 24 * 60 * 60 * 1000));

            if (task.roleOfAssignee === "Worker") {
                // escalate to the coordinator who assigned the worker (task.assignedBy)
                const coordinatorId = task.assignedBy;
                if (!coordinatorId) {
                    results.skippedNoAssignedBy++;
                    continue;
                }

                const newTaskData = {
                    title: task.title,
                    description: task.description,
                    issueId: task.issueId,
                    assignedBy: supervisorId,    // supervisor now assigns this escalated task
                    assignedTo: coordinatorId,   // coordinator will now handle it
                    roleOfAssignee: "Coordinator",
                    status: "Pending",
                    deadline: newDeadline,
                    taskUpdates: [],
                    taskCompletionProof: undefined,
                    taskProofImages: [],
                    taskProofSubmitted: false,
                    escalatedFrom: task._id
                };

                if (dryRun) {
                    results.createdTasks.push({ newTaskData, dryRun: true });
                } else {
                    const newTask = await Task.create(newTaskData);
                    await sendTaskEscalationNotificationToStaff(coordinatorId, issue);

                    // Send task assignment notification to coordinator
                    await sendTaskAssignmentNotification(newTask._id, coordinatorId, issue);

                    // mark original task as escalated
                    task.hasEscalated = true;
                    await task.save();

                    // Create timeline event for task escalation
                    await createTimelineEvent({
                        issueId: task.issueId,
                        eventType: 'task_escalated',
                        title: 'Task Escalated',
                        description: `Task "${task.title}" was escalated from Worker to Coordinator due to deadline expiry`,
                        actorId: supervisorId,
                        taskId: newTask._id,
                        metadata: {
                            // originalTaskId: task._id,
                            escalatedFrom: 'Worker',
                            escalatedTo: 'Coordinator',
                            newDeadline: newDeadline.toLocaleDateString()
                        }
                    });

                    results.createdTasks.push({ newTaskId: newTask._id, originalTask: task._id });
                }

            } else if (task.roleOfAssignee === "Coordinator") {
                // escalate to supervisor
                const newTaskData = {
                    title: task.title,
                    description: task.description,
                    issueId: task.issueId,
                    assignedBy: supervisorId,
                    assignedTo: supervisorId,
                    roleOfAssignee: "Supervisor",
                    status: "Pending",
                    deadline: newDeadline,
                    taskUpdates: [],
                    taskCompletionProof: undefined,
                    taskProofImages: [],
                    taskProofSubmitted: false,
                    escalatedFrom: task._id
                };

                if (dryRun) {
                    results.createdTasks.push({ newTaskData, dryRun: true });
                } else {
                    const newTask = await Task.create(newTaskData);
                    await sendTaskEscalationNotificationToStaff(supervisorId, issue);    //send noti to supervisor  

                    // Send task assignment notification to supervisor
                    await sendTaskAssignmentNotification(newTask._id, supervisorId, issue);

                    task.hasEscalated = true;
                    await task.save();

                    // Create timeline event for task escalation
                    await createTimelineEvent({
                        issueId: task.issueId,
                        eventType: 'task_escalated',
                        title: 'Task Escalated',
                        description: `Task "${task.title}" was escalated from Coordinator to Supervisor due to deadline expiry`,
                        actorId: supervisorId,
                        taskId: newTask._id,
                        metadata: {
                            // originalTaskId: task._id,
                            escalatedFrom: 'Coordinator',
                            escalatedTo: 'Supervisor',
                            newDeadline: newDeadline.toLocaleDateString()
                        }
                    });

                    results.createdTasks.push({ newTaskId: newTask._id, originalTask: task._id });
                }
            } else {
                // roleOfAssignee === Supervisor: do not escalate
                // mark as skipped silently
                continue;
            }
        } catch (err) {
            console.error("Error escalating task", task._id, err);
            results.errors.push({ taskId: task._id, error: err.message || String(err) });
        }
    }

    return results;
}

export const getPendingIssues = async (req, res) => {
    try {
        const userId = req.user._id;

        const pendingIssues = await Issue.find({
            issueTakenUpBy: userId,
            status: { $ne: "Resolved" },
        })
            .populate("reportedBy", "name email role")
            .sort({ createdAt: -1 });

        res.status(200).json({ pendingIssues });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch pending issues" });
    }
};


export const getReportForIssue = async (req, res) => {
    const { issueId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(issueId)) {
        return res.status(400).json({ success: false, message: "Invalid Issue ID." });
    }

    try {
        const report = await ResolutionReport.findOne({ issue: issueId }).populate(
            "supervisor",
            "name email" // Select fields from the User model for the supervisor
        );

        if (!report) {
            return res.status(404).json({ success: false, message: "No resolution report found for this issue." });
        }

        res.status(200).json({
            success: true,
            report,
        });
    } catch (error) {
        console.error("Error fetching report:", error);
        res.status(500).json({ success: false, message: "Internal server error while fetching the report." });
    }
};



export const getTopIssues = async (req, res) => {
  try {
    const user = req.user;
    const { limit = 5, status = 'In Progress' } = req.query;

    // 1. Get all issues in user's district
    const allIssues = await Issue.aggregate([
      { $match: { issueDistrict: user.district, status } },
      {
        $addFields: {
          upvotesCount: { $size: { $ifNull: ['$upvotes', []] } },
          downvotesCount: { $size: { $ifNull: ['$downvotes', []] } },
        },
      },
    ]);

    // 2. Separate top upvoted and top downvoted
    let topUpvoted = [...allIssues].sort((a, b) => b.upvotesCount - a.upvotesCount).slice(0, limit);
    let topDownvoted = [...allIssues].sort((a, b) => b.downvotesCount - a.downvotesCount).slice(0, limit);

    // 3. Remove duplicates if total issues < 10
    if (allIssues.length < 10) {
      const upvotedIds = new Set(topUpvoted.map(i => i._id.toString()));
      topDownvoted = topDownvoted.filter(issue => !upvotedIds.has(issue._id.toString()));
    }

    // 4. Project only required fields
    const projectFields = (issues) =>
      issues.map((issue) => ({
        _id: issue._id,
        title: issue.title,
        category: issue.category,
        slug:issue.slug,
        priority: issue.priority,
        status: issue.status,
        issueLocation: issue.issueLocation,
        issueDistrict: issue.issueDistrict,
        issueState: issue.issueState,
        issueCountry: issue.issueCountry,
        issuePublishDate: issue.issuePublishDate,
        deadline: issue.deadline,
        upvotesCount: issue.upvotesCount,
        downvotesCount: issue.downvotesCount,
        commentsCount: issue.comments ? issue.comments.length : 0,
        staffsAssigned: issue.staffsAssigned,
        issueTakenUpBy: issue.issueTakenUpBy,
      }));

    res.status(200).json({
      success: true,
      topUpvoted: projectFields(topUpvoted),
      topDownvoted: projectFields(topDownvoted),
    });
  } catch (err) {
    console.error('getTopIssues error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch top issues' });
  }
};

export const getSummary = async (req, res) => {
  try {
    const user = req.user;
    // 1. Get all issues in the user's district
    const allIssues = await Issue.find({ issueDistrict: user.district });

    // 2. Buckets for roles
    const supervisor = [];
    const coordinator = [];
    const worker = [];

    // 3. Traverse each issue
    for (const issue of allIssues) {
      if (!Array.isArray(issue.staffsAssigned)) continue;

      for (const staff of issue.staffsAssigned) {
        if (staff.user.equals(user._id)) {
          if (staff.role === 'Supervisor') supervisor.push(issue);
          if (staff.role === 'Coordinator') coordinator.push(issue);
          if (staff.role === 'Worker') worker.push(issue);
        }
      }
    }

    // 4. Helper to calculate resolved percentage
    const getResolvedPercentage = (issues) => {
      if (issues.length === 0) return 0;
      const resolvedCount = issues.filter(issue => issue.status === 'Resolved').length;
      return Math.round((resolvedCount / issues.length) * 100);
    };

    const resolvedPercent = {
      supervisor: getResolvedPercentage(supervisor),
      coordinator: getResolvedPercentage(coordinator),
      worker: getResolvedPercentage(worker),
    };

    // 5. Response
    res.status(200).json({
      success: true,
      supervisor,
      coordinator,
      worker,
      resolvedPercent,
    });
  } catch (err) {
    console.error('getSummary error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch staff summary' });
  }
};
// Get timeline events for an issue
export const getIssueTimeline = async (req, res) => {
    try {
        const { issueId } = req.params;

        if (!issueId) {
            return res.status(400).json({ success: false, message: "Issue ID is required" });
        }

        const timelineEvents = await getTimelineEvents(issueId);

        res.status(200).json({
            success: true,
            timelineEvents
        });
    } catch (error) {
        console.error("Error fetching timeline events:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


function normalizeToObjectId(rawId) {
  if (!rawId && rawId !== 0) throw new Error('No id provided');

  // If it's already an ObjectId
  if (rawId instanceof mongoose.Types.ObjectId) {
    return rawId;
  }

  // If it's an object with $oid
  if (typeof rawId === 'object' && rawId.$oid) {
    if (mongoose.Types.ObjectId.isValid(rawId.$oid)) {
      return new mongoose.Types.ObjectId(rawId.$oid);
    }
  }

  // If it's a string
  if (typeof rawId === 'string') {
    const s = rawId.trim();

    // Plain 24-character hex string
    if (/^[0-9a-fA-F]{24}$/.test(s) && mongoose.Types.ObjectId.isValid(s)) {
      return new mongoose.Types.ObjectId(s);
    }

    // "new ObjectId('...')" or "ObjectId('...')"
    const match = s.match(/(?:new\s+)?ObjectId\(['"]([0-9a-fA-F]{24})['"]\)/);
    if (match && match[1] && mongoose.Types.ObjectId.isValid(match[1])) {
      return new mongoose.Types.ObjectId(match[1]);
    }

    // JSON-style {"$oid":"..."} inside string
    try {
      const parsed = JSON.parse(s);
      if (parsed && parsed.$oid && mongoose.Types.ObjectId.isValid(parsed.$oid)) {
        return new mongoose.Types.ObjectId(parsed.$oid);
      }
    } catch (err) {
      // not JSON, ignore
    }
  }

  throw new Error(`Invalid id format: ${String(rawId).slice(0, 200)}`);
}

/** Controller using the normalizer and supporting either param or req.user fallback */
export const getStaffDashboardDetails = async (req, res) => {
  try {
    // prefer route param, fallback to logged-in user id
    const candidateId = req.params?.staffId ?? req?.user?._id;

    if (!candidateId) {
      return res.status(400).json({ success: false, message: 'Staff ID is required (params or authenticated user).' });
    }

    let staffObjectId;
    try {
      staffObjectId = normalizeToObjectId(candidateId);
    } catch (err) {
      console.error('Invalid staff id:', candidateId, err.message);
      return res.status(400).json({ success: false, message: 'Invalid staff id' });
    }

    // Use the normalized ObjectId for queries
    const allAssignedIssues = await Issue.find({ 'staffsAssigned.user': staffObjectId })
      .populate('reportedBy', 'name email')
      .lean();

    const allAssignedTasks = await Task.find({ assignedTo: staffObjectId })
      .populate('issueId', 'title category')
      .sort({ deadline: 1 })
      .lean();
    

    // Build dashboardData (same logic as before)
    const dashboardData = {
      issueStats: { total: allAssignedIssues.length, completed: 0, pending: 0, overdue: 0 },
      taskStats: { total: allAssignedTasks.length, completed: 0, pending: 0, overdue: 0 },
      roles: { Coordinator: [], Supervisor: [], Worker: [] },
      tasks: { completed: [], pending: [], overdue: [] },
    };

    const now = new Date();

    for (const issue of allAssignedIssues) {
      const staffAssignment = (issue.staffsAssigned || []).find(
        (staff) => String(staff.user) === String(staffObjectId)
      );
      if (staffAssignment && dashboardData.roles[staffAssignment.role]) {
        dashboardData.roles[staffAssignment.role].push(issue);
      }
      if (issue.status === 'Resolved') {
        dashboardData.issueStats.completed++;
      } else {
        if (issue.deadline && new Date(issue.deadline) < now) {
          dashboardData.issueStats.overdue++;
        } else {
          dashboardData.issueStats.pending++;
        }
      }
    }

    for (const task of allAssignedTasks) {
      if (task.status === 'Completed') {
        dashboardData.taskStats.completed++;
        dashboardData.tasks.completed.push(task);
      } else {
        if (task.deadline && new Date(task.deadline) < now) {
          dashboardData.taskStats.overdue++;
          dashboardData.tasks.overdue.push(task);
        } else {
          dashboardData.taskStats.pending++;
          dashboardData.tasks.pending.push(task);
        }
      }
    }

    dashboardData.issueStats.completionPercentage =
      dashboardData.issueStats.total > 0
        ? Math.round((dashboardData.issueStats.completed / dashboardData.issueStats.total) * 100)
        : 0;

    dashboardData.taskStats.completionPercentage =
      dashboardData.taskStats.total > 0
        ? Math.round((dashboardData.taskStats.completed / dashboardData.taskStats.total) * 100)
        : 0;

    return res.status(200).json({ success: true, dashboardData });
  } catch (error) {
    console.error('Error in getStaffDashboardDetails:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

export const getStaffDashboard = async (req, res) => {
  try {
    const rawStaffId = req?.user?._id;

    let staffObjectId;
    try {
      staffObjectId = normalizeToObjectId(rawStaffId);
    } catch (err) {
      console.error('Invalid staffId (not a valid ObjectId):', rawStaffId);
      return res.status(400).json({ success: false, message: 'Invalid staff id' });
    }

    // Use the normalized ObjectId for queries (separate calls, sequential)
    const allAssignedIssues = await Issue.find({ 'staffsAssigned.user': staffObjectId })
      .populate('reportedBy', 'name email')
      .lean();

    const allAssignedTasks = await Task.find({ assignedTo: staffObjectId })
      .populate('issueId', 'title category')
      .sort({ deadline: 1 })
      .lean();
    

    // If nothing assigned
    if ((!allAssignedIssues || allAssignedIssues.length === 0) && (!allAssignedTasks || allAssignedTasks.length === 0)) {
      return res.status(200).json({
        success: true,
        message: 'No issues or tasks assigned to you yet.',
        dashboardData: {
          issueStats: { total: 0, completed: 0, pending: 0, overdue: 0, completionPercentage: 0 },
          taskStats: { total: 0, completed: 0, pending: 0, overdue: 0, completionPercentage: 0 },
          roles: { Coordinator: [], Supervisor: [], Worker: [] },
          tasks: { completed: [], pending: [], overdue: [] }
        }
      });
    }

    // Build dashboardData
    const dashboardData = {
      issueStats: {
        total: allAssignedIssues.length,
        completed: 0,
        pending: 0,
        overdue: 0,
      },
      taskStats: {
        total: allAssignedTasks.length,
        completed: 0,
        pending: 0,
        overdue: 0,
      },
      roles: {
        Coordinator: [],
        Supervisor: [],
        Worker: [],
      },
      tasks: {
        completed: [],
        pending: [],
        overdue: [],
      },
    };

    const now = new Date();

    for (const issue of allAssignedIssues) {
      const staffAssignment = (issue.staffsAssigned || []).find(
        (staff) => String(staff.user) === String(staffObjectId)
      );
      if (staffAssignment && dashboardData.roles[staffAssignment.role]) {
        dashboardData.roles[staffAssignment.role].push(issue);
      }
      if (issue.status === 'Resolved') {
        dashboardData.issueStats.completed++;
      } else {
        if (issue.deadline && new Date(issue.deadline) < now) {
          dashboardData.issueStats.overdue++;
        } else {
          dashboardData.issueStats.pending++;
        }
      }
    }

    for (const task of allAssignedTasks) {
      if (task.status === 'Completed') {
        dashboardData.taskStats.completed++;
        dashboardData.tasks.completed.push(task);
      } else {
        if (task.deadline && new Date(task.deadline) < now) {
          dashboardData.taskStats.overdue++;
          dashboardData.tasks.overdue.push(task);
        } else {
          dashboardData.taskStats.pending++;
          dashboardData.tasks.pending.push(task);
        }
      }
    }

    // Percentages
    dashboardData.issueStats.completionPercentage =
      dashboardData.issueStats.total > 0
        ? Math.round((dashboardData.issueStats.completed / dashboardData.issueStats.total) * 100)
        : 0;

    dashboardData.taskStats.completionPercentage =
      dashboardData.taskStats.total > 0
        ? Math.round((dashboardData.taskStats.completed / dashboardData.taskStats.total) * 100)
        : 0;

    return res.status(200).json({
      success: true,
      dashboardData,
    });
  } catch (error) {
    console.error('Error in getStaffDashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred. Please try again later.',
    });
  }
};

export const getMunicipalityIssues = async (req, res) => {
  try {
    const { slug } = req.params;
    // Convert slug back to email
    const email = `${slug}@gmail.com`; // Assuming all emails end with @gmail.com

    const municipality = await Municipality.findOne({ email });

    if (!municipality) {
      return res.status(404).json({ success: false, message: 'Municipality not found' });
    }

    // Find issues where issueTakenUpBy == municipality._id
    const issues = await Issue.find({ issueTakenUpBy: new mongoose.Types.ObjectId(municipality._id) })
      .sort({ createdAt: -1 }); // Recent first

    // Count staff: users in same district with role "Municipality Staff"
    const staffCount = await User.countDocuments({
      district: municipality.district,
      role: 'Municipality Staff',
    });

    res.status(200).json({
      success: true,
      municipalityInfo: {
        municipalityName: municipality.name,
        district: municipality.district,
        state: municipality.state,
        staffCount,
      },
      issues,
    });
  } catch (err) {
    console.error('getMunicipalityIssues error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch municipality issues' });
  }
};

export const getMyIssues = async (req, res) => {
  try {
    const userId = req.user._id;

    const issues = await Issue.find({ reportedBy: userId, status: { $ne: "Not Resolved" } })
      .sort({ createdAt: -1 }); // Most recent first

    res.status(200).json({
      success: true,
      count: issues.length,
      issues,
    });
  } catch (error) {
    console.error("Error in getMyIssues:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your reported issues.",
    });
  }
};

export async function escalateIssuePriority() {
  const now = new Date();
  const results = {
    processed: 0,
    updated: 0,
    errors: []
  };

  const issuesToProcess = await Issue.find({
    status: "Open",
    priority: { $ne: "Critical" },
    issueTakenUpBy: null 
  });

  results.processed = issuesToProcess.length;
  const priorityLevels = ["Very Low", "Low", "Medium", "High", "Critical"];

  for (const issue of issuesToProcess) {
    try {
      const diffMs = now - new Date(issue.issuePublishDate);
      const diffHours = diffMs / (1000 * 60 * 60);
      const escalationPeriodsPassed = Math.floor(diffHours / 48);

      if (escalationPeriodsPassed <= 0) {
        continue;
      }

      const expectedPriorityIndex = Math.min(
        escalationPeriodsPassed, 
        priorityLevels.length - 1
      );

      const currentPriorityIndex = priorityLevels.indexOf(issue.priority);

      if (currentPriorityIndex < expectedPriorityIndex) {
        const newPriority = priorityLevels[expectedPriorityIndex];
        issue.priority = newPriority;
        await issue.save();
        results.updated++;
      }
    } catch (err) {
      console.error(`Error processing issue ${issue._id}:`, err);
      results.errors.push({ issueId: issue._id, error: err.message });
    }
  }

  return results;
}


// export const classifyIssueImage = async (req, res) => {
//   try {
//     const { imageUrl } = req.body;

//     if (!imageUrl) {
//       return res.status(400).json({ success: false, message: "Image URL required" });
//     }

//     // First, we download the image that the frontend has already uploaded to Firebase.
//     const imageResponse = await fetch(imageUrl);
//     if (!imageResponse.ok) {
//         return res.status(500).json({ success: false, message: "Failed to fetch image from URL" });
//     }
//     const imageBlob = await imageResponse.blob(); // Get the image as a binary blob

//     const hfResponse = await fetch(
//       "https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${process.env.HF_API_KEY}`,
//           "Content-Type": imageBlob.type,
//         },
//         body: imageBlob,
//       }
//     );

//     const result = await hfResponse.json();

//     if (!Array.isArray(result) || result.length === 0) {
//       console.error("Hugging Face API returned no results:", result);
//       return res.status(500).json({ success: false, message: "Model returned no results" });
//     }

//     const topPrediction = result[0];
//     const label = topPrediction.label.toLowerCase();

//     // This map connects the AI's general labels to YOUR specific project categories.
//     const categoryMap = {
//         "Road damage": ["road", "street", "pothole", "crack", "asphalt", "pavement", "manhole", "traffic cone", "highway"],
//         "Waterlogging / Drainage Issues": ["water", "puddle", "flood", "drain", "sewer", "gutter", "culvert", "clogged", "overflow"],
//         "Improper Waste Management": ["garbage", "trash", "litter", "waste", "dumpster", "bin", "plastic bag", "rubbish", "debris", "landfill"],
//         "Street lights/Exposed Wires": ["streetlight", "lamp post", "pole", "wire", "cable", "electrical", "power line", "utility pole"],
//         "Unauthorized loudspeakers": ["loudspeaker", "speaker", "amplifier", "sound system", "horn", "megaphone"],
//         "Burning of garbage": ["fire", "smoke", "burning", "flame", "bonfire", "incinerator"],
//         "Encroachment / Illegal Construction": ["construction site", "scaffolding", "brick", "cement", "barricade", "shop", "stall", "encroachment", "makeshift"],
//         "Damaged Public Property": ["bench", "bus stop", "sign", "fence", "wall", "graffiti", "vandalism", "broken"],
//         "Stray Animal Menace": ["dog", "cow", "pig", "monkey", "animal", "stray"],
//     };

//     let suggestedCategory = "General Issue"; 
//     let highestScore = 0;

//     // Find the best matching category from the model's predictions
//     for (const category in categoryMap) {
//         const keywords = categoryMap[category];
//         for (const prediction of result) {
//             const predLabel = prediction.label.toLowerCase();
//             if (keywords.some(keyword => predLabel.includes(keyword))) {
//                 if (prediction.score > highestScore) {
//                     suggestedCategory = category;
//                     highestScore = prediction.score;
//                 }
//             }
//         }
//     }

//     res.json({
//       success: true,
//       category: suggestedCategory,
//     });
    
//   } catch (err) {
//     console.error("Image classification error:", err);
//     res.status(500).json({ success: false, message: "Server error during classification" });
//   }
// };

dotenv.config({ path: 'config/config.env' });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to automatically discover the MIME type from a URL
async function urlToGenerativePart(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
  }
  
  const mimeType = response.headers.get('content-type');
  if (!mimeType || !mimeType.startsWith('image/')) {
      throw new Error(`URL did not point to a valid image. Found MIME type: ${mimeType}`);
  }

  const buffer = await response.arrayBuffer();
  return {
    inlineData: {
      data: Buffer.from(buffer).toString("base64"),
      mimeType,
    },
  };
}

export const generateIssueFromImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: "Image URL is required." });
    }

    // Using the model name confirmed to be available to your key
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Analyze the attached image of a civic issue. 
      Act as a concerned citizen reporting this problem.
      Based only on the visual information in the image, provide a structured JSON object with three fields:
      1. A concise, "title" for the issue (e.g., "Large pothole on main road"). Do not make it long as its just the title.
      2. A detailed "description" of the problem, explaining what is wrong and why it is a concern. Do not make it sound like telling whats in the image like "This image shows...". Instead, describe the issue as a citizen would when reporting it.
      3. A suggested "category" from this exact list: ["Road damage", "Waterlogging / Drainage Issues", "Improper Waste Management", "Street lights/Exposed Wires", "Burning of garbage", "Damaged Public Property", "Encroachment / Illegal Construction", "Unauthorized loudspeakers", "Stray Animal Menace", "General Issue"].
      4. The issues are in indian context so consider that while generating the response.
      5. If the image is unclear or does not depict a civic issue, respond with "title", "description" as "Unclear image, unable to determine issue" and "category" as "General Issue".
      6. Provide the response ONLY as a JSON object with no extra text or formatting.

      Your entire response must be ONLY the raw JSON object, with no extra text or markdown formatting.
    `;

    const imagePart = await urlToGenerativePart(imageUrl);

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    
    let data;
    try {
        const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        data = JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON from AI response:", responseText);
        throw new Error("AI returned a response in an unexpected format.");
    }

    res.json({ success: true, data });

  } catch (error) {
    console.error("Error with Gemini API:", error); 
    const errorMessage = error.message || "Failed to generate issue details from image.";
    res.status(500).json({ success: false, message: errorMessage });
  }
};


async function computeStaffStatsForCategory(category) {
  const pipeline = [
    { $match: { category } },
    { $unwind: "$staffsAssigned" },
    {
      $group: {
        _id: "$staffsAssigned.user",
        assignedCount: { $sum: 1 },
        resolvedCount: {
          $sum: {
            $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        userId: "$_id",
        assignedCount: 1,
        resolvedCount: 1,
        solvedRate: {
          $cond: [{ $eq: ["$assignedCount", 0] }, 0, { $divide: ["$resolvedCount", "$assignedCount"] }],
        },
      },
    },
  ];

  return Issue.aggregate(pipeline);
}

/**
 * GET /api/v1/issues/:issueId/suggested-staff
 * Returns top 5 suggested staff for the issue's category along with computed metrics.
 */

export const getSuggestedStaff = asyncHandler(async (req, res) => {
  const { issueId } = req.params;
  if (!issueId || !mongoose.Types.ObjectId.isValid(issueId)) {
    return res.status(400).json({ message: "Invalid issueId" });
  }

  // Load issue and ensure it exists
  const issue = await Issue.findById(issueId).lean();
  if (!issue) return res.status(404).json({ message: "Issue not found" });

  const category = issue.category;

  // Already assigned users
  const alreadyAssignedSet = new Set(
    (issue.staffsAssigned || [])
      .map(sa => sa && sa.user ? String(sa.user) : null)
      .filter(Boolean)
  );

  // staffStats for this category
  const staffStats = await computeStaffStatsForCategory(category);

  const workedUserIds = (staffStats || [])
    .map(s => String(s.userId))
    .filter(id => !alreadyAssignedSet.has(id));

  // Users: either worked in this category or have expertise
  const users = await User.find({
    role: "Municipality Staff",
    $or: [
      { _id: { $in: workedUserIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { expertises: category }
    ]
  })
    .select("name email avatar expertises issuesParticipated tasksAlloted")
    .lean();

  if (!users || users.length === 0) {
    return res.json({ suggested: [] });
  }

  // Map staffStats by userId
  const statsMap = new Map();
  (staffStats || []).forEach(s => {
    const uid = String(s.userId);
    if (alreadyAssignedSet.has(uid)) return;
    statsMap.set(uid, {
      assignedCount: s.assignedCount || 0,
      resolvedCount: s.resolvedCount || 0,
      solvedRate: typeof s.solvedRate === "number" ? s.solvedRate : (s.assignedCount ? (s.resolvedCount / s.assignedCount) : 0)
    });
  });

  const assignedCounts = Array.from(statsMap.values()).map(s => s.assignedCount || 0);
  const maxAssignedCount = assignedCounts.length ? Math.max(...assignedCounts) : 0;

  const WEIGHT_SOLVED = 0.50;
  const WEIGHT_TASK = 0.25;
  const WEIGHT_PARTICIPATION = 0.15;
  const WEIGHT_EXPERTISE = 0.10;

  const candidates = await Promise.all(users.map(async (u) => {
    const uid = String(u._id);
    if (alreadyAssignedSet.has(uid)) return null;

    const s = statsMap.get(uid) || { assignedCount: 0, resolvedCount: 0, solvedRate: 0 };
    const assignedCount = s.assignedCount;
    const resolvedCount = s.resolvedCount;
    const solvedRate = s.solvedRate;

    const totalTasks = await Task.countDocuments({ assignedTo: uid });
    const completedTasks = await Task.countDocuments({
      assignedTo: uid,
      $or: [{ status: "Completed" }, { status: "Done" }, { taskProofSubmitted: true }]
    });
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) : 0;

    const participationScore = maxAssignedCount > 0 ? (assignedCount / maxAssignedCount) : 0;
    const hasExpertise = Array.isArray(u.expertises) && u.expertises.includes(category) ? 1 : 0;

    const score =
      (solvedRate * WEIGHT_SOLVED) +
      (taskCompletionRate * WEIGHT_TASK) +
      (participationScore * WEIGHT_PARTICIPATION) +
      (hasExpertise * WEIGHT_EXPERTISE);

    return {
      userId: uid,
      name: u.name,
      email: u.email,
      avatar: u.avatar || null,
      assignedCount,
      resolvedCount,
      solvedRate,
      totalTasks,
      completedTasks,
      taskCompletionRate,
      participationScore,
      hasExpertise: Boolean(hasExpertise),
      score
    };
  }));

  const filteredCandidates = candidates.filter(Boolean);

  // Sort by score descending
  filteredCandidates.sort((a, b) => b.score - a.score || b.solvedRate - a.solvedRate || b.assignedCount - a.assignedCount);

  const topCandidates = filteredCandidates.slice(0, 5);

  // Compute suggested role for each candidate
  const hasSupervisor = !!(issue.staffsAssigned || []).some(s => String(s.role) === "Supervisor");
  const n = topCandidates.length;
  topCandidates.forEach((c, idx) => {
    let role = "Worker";

    if (hasSupervisor) {
      if (n < 3) {
        role = "Worker";
      } else if (n === 3 || n === 4) {
        role = idx === 0 ? "Coordinator" : "Worker";
      } else {
        role = idx <= 1 ? "Coordinator" : "Worker";
      }
    } else {
      if (n === 1) {
        role = "Supervisor";
      } else if (n === 2) {
        role = idx === 0 ? "Supervisor" : "Worker";
      } else if (n === 3 || n === 4) {
        role = idx === 0 ? "Supervisor" : idx === 1 ? "Coordinator" : "Worker";
      } else {
        role = idx === 0 ? "Supervisor" : (idx === 1 || idx === 2) ? "Coordinator" : "Worker";
      }
    }

    c.suggestedRole = role;
  });

  return res.json({ suggested: topCandidates });
});

/**
 * Assigns suggested top 5 staff to the issue:
 * - #1 => Supervisor
 * - #2 => Coordinator
 * - #3..#5 => Worker
 *
 * Creates AssignedStaff entries in `issue.staffsAssigned` (avoiding duplicates),
 * and creates Task documents for each newly assigned staff.
 */
export const assignMultipleSuggestedStaff = async (req, res) => {
  try {
    const { staffList } = req.body; // [{ email, role, issueId }, ...]

    if (!staffList || !Array.isArray(staffList) || staffList.length === 0) {
      return res.status(400).json({ message: "No staff provided" });
    }

    for (const staffData of staffList) {
      const { email, role, issueId } = staffData;
      if (!email || !role || !issueId) continue;

      // Find the issue
      const issue = await Issue.findById(issueId);
      if (!issue) continue;

      // Find the staff user by email
      const user = await User.findOne({ email });
      if (!user) continue;

      // Check if already assigned
      const alreadyAssigned = issue.staffsAssigned?.some(
        (s) => s.user.toString() === user._id.toString()
      );
      if (alreadyAssigned) continue;

      // Assign staff
      issue.staffsAssigned.push({ user: user._id, role });
      user.issuesParticipated.push({ issueId: issue._id });

      // Save both
      await Promise.all([issue.save(), user.save()]);

      // Send notification
      await sendIssueAssignedNotification(issue, user._id);

      // Create timeline event
      await createTimelineEvent({
        issueId: issue._id,
        eventType: "staff_assigned",
        title: "Staff Assigned",
        description: `${user.name} was assigned as ${role}`,
        actorId: req.municipality?._id || user._id, // ✅ fallback
        assignedStaffId: user._id,
        assignedStaffRole: role,
        metadata: {
          staffName: user.name,
          staffEmail: user.email,
        },
      });
    }

    res.status(200).json({ message: "Staffs assigned successfully" });
  } catch (err) {
    console.error("assignMultipleSuggestedStaff", err);
    res.status(500).json({ message: "Failed to assign staffs" });
  }
};


function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const reopenUnresolvedIssues = async () => {
  try {
    const now = new Date();
    
    const overdueIssues = await Issue.find({
  $and: [
    { deadline: { $exists: true } },
    { deadline: { $lt: now } },
    { resolvedAt: { $exists: false } },
     { status: { $nin: ['Resolved', 'Not Resolved'] } }
  ]
});

   
    for (const issue of overdueIssues) {
  if (!issue) continue;


  await Task.deleteMany({ issueId: issue._id });

  issue.status = 'Not Resolved';
  await issue.save();

  const baseTitle = issue.title.replace(/ Reopend-\d+$/, '');

  const similarIssues = await Issue.find({
    title: { $regex: `^${escapeRegExp(baseTitle)} Reopend-\\d+$`, $options: 'i' }
  });

  const nextReopenNumber = similarIssues.length + 1;
  const newTitle = `${baseTitle} Reopend-${nextReopenNumber}`;
  const newIssue = new Issue({
    title: newTitle,
    category: issue.category,
    priority: issue.priority,
    content: issue.content,
    images: issue.images,
    videos: [],
    issueLocation: issue.issueLocation,
    issueDistrict: issue.issueDistrict,
    issueState: issue.issueState,
    issueCountry: issue.issueCountry,
    issuePublishDate: new Date(),
    status: 'Open',
    reportedBy: issue.reportedBy, 
  });
  await newIssue.save();
}
    
  } catch (err) {
    console.error('Reopen Issues Error:', err);
    return 0;
  }
};

export const updateWhatsappLink = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { whatsappLink } = req.body;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    // This is a crucial security check on the backend.
    if (issue.whatsappLink) {
      return res.status(400).json({ success: false, message: 'A WhatsApp link has already been added to this issue.' });
    }

    issue.whatsappLink = whatsappLink;
    const updatedIssue = await issue.save();

    res.status(200).json({
      success: true,
      message: 'WhatsApp link added successfully.',
      issue: updatedIssue,
    });

  } catch (error) {
    console.error("Error adding WhatsApp link:", error);
    res.status(500).json({ success: false, message: 'Server error while adding the link.' });
  }
};