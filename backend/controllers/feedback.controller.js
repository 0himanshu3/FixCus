import mongoose from "mongoose";
import Issue from "../models/issue.model.js";
import Feedback from "../models/feedback.model.js";
import { createTimelineEvent } from "../utils/timelineHelper.js";
export const submitFeedback = async (req, res, next) => {
    const { issueId, ...feedbackData } = req.body;
    const userId = req.user.id; // Assuming user ID is available from auth middleware

    // 1. Validate Input
    if (!issueId || !mongoose.Types.ObjectId.isValid(issueId)) {
        return res.status(400).json({ success: false, message: "A valid issue ID is required." });
    }

    if (!feedbackData.resolved || !feedbackData.satisfactionRating) {
        return res.status(400).json({ success: false, message: "Required feedback fields are missing." });
    }

    try {
        // 2. Verify the issue exists and is marked as 'Resolved'
        const issue = await Issue.findById(issueId);
        if (!issue) {
            return res.status(404).json({ success: false, message: "Issue not found." });
        }
        if (issue.status !== "Resolved") {
            return res.status(400).json({ success: false, message: "Feedback can only be submitted for resolved issues." });
        }

        // 3. Check if this user has already submitted feedback for this issue
        const existingFeedback = await Feedback.findOne({ issue: issueId, submittedBy: userId });
        if (existingFeedback) {
            return res.status(409).json({ success: false, message: "You have already submitted feedback for this issue." });
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
            eventType: 'feedback_submitted',
            title: 'Feedback Submitted',
            description: `User submitted feedback with satisfaction rating: ${feedbackData.satisfactionRating}/5`,
            actorId: userId,
            metadata: {
                satisfactionRating: feedbackData.satisfactionRating,
                resolved: feedbackData.resolved,
                resolutionTime: feedbackData.resolutionTime
            }
        });

        // 6. Send success response
        res.status(201).json({
            success: true,
            message: "Feedback submitted successfully.",
            feedback: newFeedback,
        });

    } catch (error) {
        console.error("Feedback submission error:", error);
        res.status(500).json({ success: false, message: "Internal server error while submitting feedback." });
    }
};


export const getFeedbackForIssue = async (req, res) => {
    const { issueId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(issueId)) {
        return res.status(400).json({ success: false, message: "Invalid Issue ID." });
    }

    try {
        const feedbacks = await Feedback.find({ issue: issueId }).populate(
            "submittedBy",
            "name email" // Select which fields from the User model to include
        );

        if (!feedbacks || feedbacks.length === 0) {
            return res.status(404).json({ success: false, message: "No feedback found for this issue." });
        }
        
        res.status(200).json({
            success: true,
            feedbacks,
        });
    } catch (error) {
        console.error("Error fetching feedback:", error);
        res.status(500).json({ success: false, message: "Internal server error while fetching feedback." });
    }
};



const reportGenerationPrompt = `You are an expert data analyst AI. Your task is to generate an insightful summary report based on citizen feedback for a resolved municipal issue. The feedback provided is a collection of entries, each containing multiple data points.

Your analysis must be comprehensive, easy to read, and structured into the following sections using markdown formatting:

1.  **Overall Sentiment & Satisfaction**:
    * Calculate the average "Overall Satisfaction" rating (out of 5).
    * Based on the average rating and comments, provide a one-sentence summary of the general public sentiment (e.g., "Overwhelmingly Positive," "Mixed but Leaning Positive," "Largely Negative").

2.  **Resolution Analysis**:
    * Summarize the "Issue Resolved" status (e.g., "Most users felt the issue was fully resolved...").
    * Identify the common sentiment regarding the "Resolution Time" and "Quality of Resolution."

3.  **Key Strengths**:
    * Based on positive comments, high ratings, and "Yes" answers for professionalism and communication, list 2-3 key highlights or strengths of the resolution process. What did the team do well?

4.  **Areas for Improvement**:
    * Based on negative comments, low ratings, and suggestions, identify 2-3 recurring pain points or areas needing improvement.

5.  **Actionable Suggestions**:
    * Synthesize the "Suggestions for improvement" from all feedback entries into a concise, actionable list for the municipality.

6.  **Final Verdict**:
    * Provide a brief, concluding paragraph summarizing whether the resolution effort was successful from the citizens' perspective and reaffirming the most critical takeaway.

Maintain a professional, objective, and data-driven tone throughout the report. The final output should be a single block of formatted text.`;

/**
 * Merges multiple feedback documents into a single string for AI analysis.
 * @param {string} issueId - The ID of the issue to fetch feedback for.
 * @returns {Promise<string>} A single string containing all formatted feedback.
 */
const mergeFeedbacks = async (issueId) => {
    // Populate submittedBy to get user names for context
    const feedbacks = await Feedback.find({ issue: issueId }).populate('submittedBy', 'name');
    if (!feedbacks || feedbacks.length === 0) {
        return "";
    }

    // Convert each feedback document into a detailed string format
    const formattedFeedbacks = feedbacks.map((fb, index) => {
        return `
--- Feedback Entry ${index + 1} ---
Submitted By: ${fb.submittedBy?.name || 'Anonymous'}
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

- Suggestions for Improvement: ${fb.suggestions || 'N/A'}
- Additional Comments: ${fb.additionalComments || 'N/A'}
`;
    }).join("\n");

    return formattedFeedbacks;
}

/**
 * @route   POST /api/v1/issues/analyze-feedback
 * @desc    Analyzes all feedback for an issue and returns an AI-generated summary.
 * @access  Private
 */
export const analyzeFeedback = async (req, res) => {
    const { issueId } = req.body;

    if (!issueId) {
        return res.status(400).json({ success: false, message: "Issue ID is required." });
    }

    try {
        const mergedFeedbacks = await mergeFeedbacks(issueId);

        if (!mergedFeedbacks) {
            return res.status(200).json({ analysis: "There is no citizen feedback available to analyze for this issue." });
        }

        // API call to OpenRouter
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_KEY}`, // Ensure OPENAI_KEY is in your .env
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "openai/gpt-4o-mini", // Using a capable free model
                "messages": [
                    {
                        "role": "system",
                        "content": reportGenerationPrompt
                    },
                    {
                        "role": "user",
                        "content": mergedFeedbacks
                    }
                ]
            })
        });
        console.log(response);
        

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`AI API request failed with status ${response.status}: ${errorBody}`);
        }

        const jsonResponse = await response.json();
        const analysis = jsonResponse.choices?.[0]?.message?.content;
        console.log(analysis);
        
        if (!analysis) {
            throw new Error("Received an invalid response from the AI model.");
        }

        res.status(200).json({ success: true, analysis });

    } catch (error) {
        console.error("Error in analyzeFeedback controller:", error);
        res.status(500).json({ success: false, message: `Failed to generate AI analysis: ${error.message}` });
    }
};
