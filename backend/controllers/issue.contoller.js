import Issue from "../models/issue.model.js";
import { Task } from "../models/task.model.js";
import { User } from "../models/user.model.js";
import { Municipality } from "../models/muncipality.model.js";
export const createIssue = async (req, res) => {
  try {
    const { title, content, category, issueLocation, issuePublishDate, images, videos, issueDistrict, issueState, issueCountry } = req.body;

    if (!title || !category || !issueLocation || !issuePublishDate) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // ✅ reportedBy comes directly from authenticated user
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
      filter.status = status;
    }

    if (location) {
      // Support searching by district/state/country or legacy location string
      filter.$or = [
        { issueDistrict: { $regex: location, $options: "i" } },
        { issueState: { $regex: location, $options: "i" } },
        { issueCountry: { $regex: location, $options: "i" } },
        { issueLocation: { $regex: location, $options: "i" } }
      ];
    }

    // Build sort
    let sortOption = { createdAt: -1 }; // default newest first
    if (recency === "newest") sortOption = { createdAt: -1 };
    else if (recency === "oldest") sortOption = { createdAt: 1 };

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


// =====================
// Downvote an Issue
// =====================
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


// =====================
// Add a Comment
// =====================
export const addComment = async (req, res) => {
  const { issueId, content } = req.body;
  const userId = req.user._id;

  if (!content || !content.trim()) return res.status(400).json({ success: false, message: "Comment cannot be empty" });

  try {
    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });

    issue.comments.push({ user: userId, content });
    await issue.save();

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
};export const deleteComment = async (req, res) => {
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
  const { userId, month } = req.query;
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
          const created = new Date(issue.createdAt);
          const resolved = new Date(issue.updatedAt);
          return sum + (resolved - created) / (1000 * 60 * 60);
        }, 0) / completedIssues.length
      : 0;

    const mostUpvotedArr = await Issue.aggregate([
      { $match: { createdBy: userId, createdAt: { $gte: startDate, $lte: endDate } } },
      { $addFields: { upvoteCount: { $size: "$upvotes" } } },
      { $sort: { upvoteCount: -1 } },
      { $limit: 1 }
    ]);

    const mostDownvotedArr = await Issue.aggregate([
      { $match: { createdBy: userId, createdAt: { $gte: startDate, $lte: endDate } } },
      { $addFields: { downvoteCount: { $size: "$downvotes" } } },
      { $sort: { downvoteCount: -1 } },
      { $limit: 1 }
    ]);

    const mostUpvoted = mostUpvotedArr[0] || null;
    const mostDownvoted = mostDownvotedArr[0] || null;

    const votesData = await Issue.aggregate([
      { $match: { issueTakenUpBy: userId, createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $project: {
          title: 1,
          upvotes: { $size: "$upvotes" },
          downvotes: { $size: "$downvotes" }
        }
      },
      { $sort: { upvotes: -1 } },
      { $limit: 5 }
    ]);

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
    console.log(issueId, deadline);
    
    if (!issueId || !deadline) {
      return res.status(400).json({ success: false, message: "Issue ID and deadline are required" });
    }

    const issue = await Issue.findById(issueId);
    console.log(issue);
    
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    if (issue.status !== "Open") {
      return res.status(400).json({ success: false, message: "Only open issues can be taken up" });
    }

    // Check that deadline is not in the past
    const selectedDeadline = new Date(deadline);
    const now = new Date();
    now.setHours(0,0,0,0); // ignore time, compare dates only
    if (selectedDeadline < now) {
      return res.status(400).json({ success: false, message: "Deadline cannot be in the past" });
    }

    // Assign the municipality and set deadline
    issue.issueTakenUpBy = req.municipality._id;
    issue.deadline = selectedDeadline;
    issue.status = "In Progress";

    await issue.save();

    res.status(200).json({ success: true, message: "Issue successfully taken up", issue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const assignStaff = async (req, res) => {
  try {
    const { issueId, staffEmail, role } = req.body;
    console.log(issueId, staffEmail, role);
    
    if (!issueId || !staffEmail || !role) {
      return res.status(400).json({ message: "Issue ID, Staff Email, and Role are required" });
    }

    // Find issue
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Find staff by email
    const staff = await User.findOne({ email: staffEmail });
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    console.log(staff);
    

    if(staff.role !== "Municipality Staff"){
      return res.status(400).json({ message: "User is not a Municipality Staff" });
    }
    console.log(issue, staff, role);
    
    // Check if staff already assigned with same role
    const alreadyAssigned = issue.staffsAssigned.some(
      (s) => s.user.toString() === staff._id.toString() && s.role === role
    );
    if (alreadyAssigned) {
      return res.status(400).json({ message: "Staff already assigned to this issue with this role" });
    }

    // Assign staff
    issue.staffsAssigned.push({ role, user: staff._id });
    await issue.save();

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


// Assign Task (Coordinator / Supervisor)
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

    res.status(201).json({ message: "Task assigned successfully", task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get tasks for user
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

// Add Task Update (Worker / Coordinator / Supervisor)
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { updateText } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.taskUpdates.push({ updateText, updatedBy: req.user._id });
    task.status = "In Review";
    await task.save();

    res.status(200).json({ message: "Task updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Submit Task Proof (Worker)
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

    res.status(200).json({ message: "Task proof submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Approve / Reject Task Proof (Coordinator)
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
    res.status(200).json({ message: approve ? "Task approved" : "Task rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};


// Resolve Issue (Supervisor)
export const resolveIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { summary } = req.body;

    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    issue.status = "Resolved";
    issue.resolutionSummary = summary;
    issue.resolvedBy = req.user._id;
    issue.resolvedAt = Date.now();

    await issue.save();
    res.status(200).json({ message: "Issue resolved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};



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
      // load issue and its staffsAssigned (to find supervisor)
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
          // mark original task as escalated
          task.hasEscalated = true;
          await task.save();
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
          task.hasEscalated = true;
          await task.save();
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