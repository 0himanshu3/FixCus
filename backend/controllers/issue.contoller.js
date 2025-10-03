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
    const issues = await Issue.find()
      .populate("reportedBy", "name email")
      .populate("staffsAssigned", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, issues });
  } catch (err) {
    console.error("Error fetching issues:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
