import { Task } from "../models/task.model.js";
import { User } from "../models/user.model.js";
import Issue  from "../models/issue.model.js";
import mongoose from "mongoose";
import { sendTaskAssignmentNotification } from "./notification.controller.js";
import { createTimelineEvent } from "../utils/timelineHelper.js";


export const assignTask = async (req, res) => {
    try {
        const { issueId, assignedTo, roleOfAssignee, title, description, deadline } = req.body;

        const task = await Task.create({
            title,
            description,
            issueId,
            assignedBy: req.user._id,
            assignedTo,
            roleOfAssignee,
            deadline,
        });

        // Update user's tasksAlloted
        await User.findByIdAndUpdate(assignedTo, { $push: { tasksAlloted: { taskId: task._id } } });

        // Send notification to the assigned user
        const issue = await Issue.findById(issueId);
        if (issue) {
            await sendTaskAssignmentNotification(task._id, assignedTo, issue);
        }

        // Create timeline event for task creation
        await createTimelineEvent({
            issueId: issueId,
            eventType: 'task_created',
            title: 'Task Created',
            description: `Task "${title}" was created and assigned to ${roleOfAssignee}`,
            actorId: req.user._id,
            taskId: task._id,
            metadata: {
                taskTitle: title,
                // taskDescription: description,
                deadline: deadline,
                roleOfAssignee
            }
        });

        res.status(201).json({ message: "Task assigned successfully", task });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

export const getTasksForUser = async (req, res) => {
    try {
        const { userId } = req.params;   // from route param
        const { issueId } = req.query;   // from query param

        if (!userId || !issueId) {
            return res.status(400).json({ success: false, message: "User ID and Issue ID are required" });
        }

        // Ensure the issue exists
        const issue = await Issue.findById(issueId);
        if (!issue) {
            return res.status(404).json({ success: false, message: "Issue not found" });
        }

        // Fetch tasks assigned to this user for this issue
        const tasks = await Task.find({
            assignedTo: userId,
            issueId: issueId, // Make sure Task schema has issueId reference!
        })
            .populate("assignedBy", "name email role")
            .populate("assignedTo", "name email role")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, tasks });
    } catch (err) {
        console.error("Error fetching tasks for user:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


export const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { updateText } = req.body;

        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: "Task not found" });

        task.taskUpdates.push({ updateText, updatedBy: req.user._id });
        task.status = "In Review";
        await task.save();

        // Create timeline event for task update
        await createTimelineEvent({
            issueId: task.issueId,
            eventType: 'task_updated',
            title: 'Task Updated',
            description: `Task was updated: ${updateText}`,
            actorId: req.user._id,
            taskId: task._id,
            metadata: {
                updateText,
                newStatus: "In Review"
            }
        });

        res.status(200).json({ message: "Task updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};


export const submitTaskProof = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { proofText, proofImages } = req.body;

        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: "Task not found" });

        task.taskCompletionProof = proofText;
        task.taskProofImages = proofImages || [];
        task.taskProofSubmitted = true;
        task.status = "In Review";
        await task.save();

        // Create timeline event for task proof submission
        await createTimelineEvent({
            issueId: task.issueId,
            eventType: 'task_proof_submitted',
            title: 'Task Proof Submitted',
            description: `Task proof was submitted for review`,
            actorId: req.user._id,
            taskId: task._id,
            metadata: {
                proofText,
                proofImagesCount: (proofImages || []).length
            }
        });

        res.status(200).json({ message: "Task proof submitted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

export const approveRejectTaskProof = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { approve } = req.body;

        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: "Task not found" });

        task.status = approve ? "Completed" : "Pending";
        if (!approve) {
            task.taskProofSubmitted = false;
            task.taskCompletionProof = "";
            task.taskProofImages = [];
        }

        await task.save();

        // Create timeline event for task approval/rejection
        await createTimelineEvent({
            issueId: task.issueId,
            eventType: approve ? 'task_approved' : 'task_rejected',
            title: approve ? 'Task Approved' : 'Task Rejected',
            description: `Task was ${approve ? 'approved' : 'rejected'} by ${req.user.role}`,
            actorId: req.user._id,
            taskId: task._id,
            metadata: {
                approved: approve,
                reviewerRole: req.user.role
            }
        });

        res.status(200).json({ message: approve ? "Task approved" : "Task rejected" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};



export const reassignTaskToCoordinator = async (req, res) => {
  const { taskId } = req.params;
  const { coordinatorId, deadline } = req.body;
  console.log(req.body);
  
  const actorId = req.user && req.user._id;

  if (!coordinatorId) {
    return res.status(400).json({ success: false, message: "coordinatorId is required" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const origTask = await Task.findById(taskId).session(session);
    if (!origTask) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Original task not found" });
    }

    // Only allow the supervisor who is assigned this task to reassign it
    if (
      !origTask.assignedTo ||
      String(origTask.assignedTo) !== String(actorId) ||
      origTask.roleOfAssignee !== "Supervisor"
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: "Not authorized to reassign this task" });
    }

    // Ensure coordinator exists
    const coordinatorUser = await User.findById(coordinatorId).session(session);
    if (!coordinatorUser) {
      await session.abortTransaction();
      session.endSession();
      console.log("Coordinator user not found:", coordinatorId);
      
      return res.status(404).json({ success: false, message: "Coordinator user not found" });
    }

    // Prepare new task doc with same details but new assignee and deadline
    const newTaskData = {
      title: origTask.title,
      description: origTask.description,
      issueId: origTask.issueId,
      assignedBy: actorId, // supervisor reassigns
      assignedTo: coordinatorUser._id,
      roleOfAssignee: "Coordinator",
      status: "Pending",
      deadline: deadline ? new Date(deadline) : origTask.deadline,
      taskUpdates: [], // start fresh for the new task
      taskCompletionProof: undefined,
      taskProofImages: [],
      taskProofSubmitted: false,
      hasEscalated: false,
      escalatedFrom: origTask._id,
    };

    // Create new task
    const newTask = await Task.create([newTaskData], { session });
    // newTask is an array because create([...])
    const created = newTask[0];

    // Delete original task
    await Task.findByIdAndDelete(origTask._id, { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Task reassigned to coordinator",
      task: created,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("reassignTaskToCoordinator error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

export const completeTaskBySupervisor = async (req, res) => {
  const { taskId } = req.params;
  const { completionText, proofImages = [] } = req.body;
  const actorId = req.user && req.user._id;

  if (!completionText && (!Array.isArray(proofImages) || proofImages.length === 0)) {
    return res.status(400).json({
      success: false,
      message: "Provide completionText or at least one proof image URL",
    });
  }

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Only allow the supervisor assigned to this task to complete it
    if (
      !task.assignedTo ||
      String(task.assignedTo) !== String(actorId) ||
      task.roleOfAssignee !== "Supervisor"
    ) {
      return res.status(403).json({ success: false, message: "Not authorized to complete this task" });
    }

    // Update fields and mark completed
    if (completionText) task.taskCompletionProof = completionText;
    if (Array.isArray(proofImages) && proofImages.length > 0) task.taskProofImages = proofImages;
    task.taskProofSubmitted = true;
    task.status = "Completed";
    // if you want to keep audit trail add an update entry to taskUpdates
    task.taskUpdates = task.taskUpdates || [];
    task.taskUpdates.push({
      updateText: completionText ? `Completed by supervisor: ${completionText}` : "Completed by supervisor",
      updatedBy: actorId,
      updatedAt: new Date(),
    });

    await task.save();

    // Create timeline event for supervisor task completion
    await createTimelineEvent({
        issueId: task.issueId,
        eventType: 'task_approved',
        title: 'Task Completed by Supervisor',
        description: `Task was completed directly by supervisor`,
        actorId: actorId,
        taskId: task._id,
        metadata: {
            completionText,
            proofImagesCount: proofImages.length,
            completedBy: 'Supervisor'
        }
    });

    return res.status(200).json({ success: true, message: "Task completed by supervisor", task });
  } catch (err) {
    console.error("completeTaskBySupervisor error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
