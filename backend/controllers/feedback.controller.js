import mongoose from "mongoose";
import Issue from "../models/issue.model.js";
import Feedback from "../models/feedback.model.js";
import { createTimelineEvent } from "../utils/timelineHelper.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const submitFeedback = async (req, res, next) => {
  const { issueId, ...feedbackData } = req.body;
  const userId = req.user.id; // Assuming user ID is available from auth middleware

  // 1. Validate Input
  if (!issueId || !mongoose.Types.ObjectId.isValid(issueId)) {
    return res
      .status(400)
      .json({ success: false, message: "A valid issue ID is required." });
  }

  if (!feedbackData.resolved || !feedbackData.satisfactionRating) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Required feedback fields are missing.",
      });
  }

  try {
    // 2. Verify the issue exists and is marked as 'Resolved'
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found." });
    }
    if (issue.status !== "Resolved") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Feedback can only be submitted for resolved issues.",
        });
    }

    // 3. Check if this user has already submitted feedback for this issue
    const existingFeedback = await Feedback.findOne({
      issue: issueId,
      submittedBy: userId,
    });
    if (existingFeedback) {
      return res
        .status(409)
        .json({
          success: false,
          message: "You have already submitted feedback for this issue.",
        });
    }

    // 4. Create and save the new feedback document
    const newFeedback = new Feedback({
      ...feedbackData,
      issue: issueId,
      submittedBy: userId,
    });

    await newFeedback.save();

    // Create timeline event for feedback submission
    await createTimelineEvent({
      issueId: issueId,
      eventType: "feedback_submitted",
      title: "Feedback Submitted",
      description: `User submitted feedback with satisfaction rating: ${feedbackData.satisfactionRating}/5`,
      actorId: userId,
      metadata: {
        satisfactionRating: feedbackData.satisfactionRating,
        resolved: feedbackData.resolved,
        resolutionTime: feedbackData.resolutionTime,
      },
    });

    // 6. Send success response
    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully.",
      feedback: newFeedback,
    });
  } catch (error) {
    console.error("Feedback submission error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error while submitting feedback.",
      });
  }
};

export const getFeedbackForIssue = async (req, res) => {
  const { issueId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(issueId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Issue ID." });
  }

  try {
    const feedbacks = await Feedback.find({ issue: issueId }).populate(
      "submittedBy",
      "name email" // Select which fields from the User model to include
    );

    if (!feedbacks || feedbacks.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No feedback found for this issue." });
    }

    res.status(200).json({
      success: true,
      feedbacks,
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error while fetching feedback.",
      });
  }
};

const reportGenerationPrompt = `You are an expert data analyst AI for a civic issues platform. Your task is to generate an insightful summary report based on a collection of citizen feedback for a resolved municipal issue.

Your analysis must be comprehensive, professional, and structured into the following sections using simple markdown (headings, bold text, lists):

1.  **Executive Summary**:
    * Start with a "Sentiment Score" out of 10 (e.g., "Sentiment Score: 9/10 - Excellent").
    * Provide a one-sentence "Key Takeaway" that summarizes the most important finding from the feedback.

2.  **Performance Metrics**:
    * Summarize the success rate of the "Issue Resolved" status.
    * Analyze the common sentiment for "Resolution Time" and "Quality of Resolution." Use direct but anonymous quotes from the feedback to support your analysis (e.g., As one citizen noted, the service was "exceptionally fast.").

3.  **Key Strengths Identified**:
    * Based on positive feedback, list 2-3 key strengths of the resolution process. Use a new line for each strength.

4.  **Opportunities for Improvement**:
    * Based on negative feedback, low ratings, or constructive suggestions, identify any recurring pain points. If no issues were found, state this clearly.

5.  **Actionable Suggestions**:
    * Synthesize all feedback and suggestions into a concise list of actionable recommendations for the municipality. If the suggestions were only positive, frame the action as "Maintain and reinforce current high standards."

Maintain a data-driven tone. The final output must be a single block of text formatted ONLY with markdown. Do not include any non-standard symbols or emojis.`;
/**
 * Merges multiple feedback documents into a single string for AI analysis.
 * @param {string} issueId - The ID of the issue to fetch feedback for.
 * @returns {Promise<string>} A single string containing all formatted feedback.
 */
const mergeFeedbacks = async (issueId) => {
  // Populate submittedBy to get user names for context
  const feedbacks = await Feedback.find({ issue: issueId }).populate(
    "submittedBy",
    "name"
  );
  if (!feedbacks || feedbacks.length === 0) {
    return "";
  }

  // Convert each feedback document into a detailed string format
  const formattedFeedbacks = feedbacks
    .map((fb, index) => {
      return `
--- Feedback Entry ${index + 1} ---
Submitted By: ${fb.submittedBy?.name || "Anonymous"}
Date: ${new Date(fb.createdAt).toLocaleDateString()}

- Was the issue resolved? ${fb.resolved}
- Time taken to resolve: ${fb.resolutionTime}
- Quality of resolution: ${fb.resolutionQuality}
- Staff Professionalism: ${fb.staffProfessionalism}

- Overall Satisfaction Rating: ${fb.satisfactionRating}/5
- Was complaint taken seriously? ${fb.takenSeriously}
- Was communication clear? ${fb.clearCommunication}
- Future trust in municipality: ${fb.futureTrust}
- Would use system again? ${fb.useSystemAgain}

- Suggestions for Improvement: ${fb.suggestions || "N/A"}
- Additional Comments: ${fb.additionalComments || "N/A"}
`;
    })
    .join("\n");

  return formattedFeedbacks;
};

/**
 * @route   POST /api/v1/issues/analyze-feedback
 * @desc    Analyzes all feedback for an issue and returns an AI-generated summary.
 * @access  Private
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const analyzeFeedback = async (req, res) => {
  const { issueId } = req.body;

  if (!issueId) {
    return res
      .status(400)
      .json({ success: false, message: "Issue ID is required." });
  }

  try {
    const mergedFeedbacks = await mergeFeedbacks(issueId);

    if (!mergedFeedbacks) {
      return res
        .status(200)
        .json({
          analysis:
            "There is no citizen feedback available to analyze for this issue.",
        });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // We combine the system instructions and the user data into a single, clear prompt.
    const fullPrompt = `
            ${reportGenerationPrompt}

            Here is the raw, combined feedback from all citizens regarding the issue. Please analyze it based on the instructions above:
            ---
            ${mergedFeedbacks}
            ---
        `;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const analysis = response.text();

    if (!analysis) {
      throw new Error("Received an empty response from the Gemini model.");
    }

    res.status(200).json({ success: true, analysis });
  } catch (error) {
    console.error("Error in analyzeFeedback controller:", error);
    res
      .status(500)
      .json({
        success: false,
        message: `Failed to generate AI analysis: ${error.message}`,
      });
  }
};
