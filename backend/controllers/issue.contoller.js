import Issue from "../models/issue.model.js";
export const createIssue = async (req, res) => {
  try {
    const { title, content, category, issueLocation, issuePublishDate, images, videos } = req.body;

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
      filter.eventLocation = { $regex: location, $options: "i" }; // case-insensitive partial match
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
      .populate("staffsAssigned", "name email")
      .populate({
        path: "comments.user",
        select: "name email",
      });

    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    // Explicitly send all fields including images, videos, and comments
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
      staffsAssigned: issue.staffsAssigned,
      upvotes: issue.upvotes,
      downvotes: issue.downvotes,
      comments: issue.comments,
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