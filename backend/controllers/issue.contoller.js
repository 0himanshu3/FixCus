import Issue from "../models/issue.model.js";
import  {User} from "../models/user.model.js"
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
    const issue = await Issue.findOne({ slug })
      .populate("reportedBy", "name email")
      .populate("issueTakenUpBy", "name municipalityName email") // populate municipality
      .populate({
        path: "staffsAssigned.user", // populate user inside staffsAssigned
        select: "name email",        // only return name + email
      })
      .populate({
        path: "comments.user",
        select: "name email",
      });

    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    // Transform staffsAssigned to include role + user details
    const formattedStaffs = issue.staffsAssigned.map((s) => ({
      role: s.role,
      user: s.user ? { name: s.user.name, email: s.user.email } : null,
    }));

    // Include deadline and issueTakenUpBy
    const issueData = {
      _id: issue._id,
      title: issue.title,
      slug: issue.slug,
      category: issue.category,
      priority: issue.priority,
      status: issue.status,
      issueLocation: issue.issueLocation,
      issuePublishDate: issue.issuePublishDate,
      content: issue.content,
      images: issue.images,
      videos: issue.videos,
      reportedBy: issue.reportedBy,
      staffsAssigned: formattedStaffs,
      upvotes: issue.upvotes,
      downvotes: issue.downvotes,
      comments: issue.comments,
      deadline: issue.deadline,
      issueTakenUpBy: issue.issueTakenUpBy,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    };

    res.status(200).json({ success: true, issue: issueData });
  } catch (err) {
    console.error("Error fetching issue by slug:", err);
    res.status(500).json({ success: false, message: "Server error" });
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