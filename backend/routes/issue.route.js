import express from "express";
import { addComment, createIssue,getMunicipalityIssues, deleteComment,getMyIssues,getCompletedIssuesByMuni, downvoteIssue, getTopIssues,getSummary,getPendingIssues,editComment, getIssueBySlug, getIssues, upvoteIssue,getCompletedIssues,getIssueDetails, takeUpIssue, assignStaff, getAssignedStaff, assignTask, getTasksForUser, updateTask, submitTaskProof, approveRejectTaskProof, resolveIssue, getMonthlyAnalysis, submitFeedback, getFeedbackForIssue, getReportForIssue, analyzeFeedback, reassignTaskToCoordinator, completeTaskBySupervisor, getIssueTimeline,  getStaffDashboardDetails, classifyIssueImage, generateIssueFromImage, getSuggestedStaff, assignMultipleSuggestedStaff } from "../controllers/issue.contoller.js";
import { isAuthenticated, protectMunicipality } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", isAuthenticated, createIssue);
router.get("/completed-issues",isAuthenticated, getCompletedIssues);
router.get("/completed-issuesbymuni",isAuthenticated, getCompletedIssuesByMuni);
router.get("/issue-details/:id",isAuthenticated,getIssueDetails)
router.get("/all",isAuthenticated, getIssues);
router.get("/pending",isAuthenticated, getPendingIssues);
router.get("/monthly-analysis",isAuthenticated,getMonthlyAnalysis)
router.get("/municipality/:slug",isAuthenticated,getMunicipalityIssues)
router.post("/upvote", isAuthenticated, upvoteIssue);
router.post("/downvote", isAuthenticated, downvoteIssue);
router.post("/comment", isAuthenticated, addComment);
router.post("/takeup", protectMunicipality, takeUpIssue);
router.post("/assign-staff", protectMunicipality, assignStaff);


// Get assigned staff for an issue
router.post("/get-assigned-staff", protectMunicipality, getAssignedStaff);
// Edit a comment
router.put("/comment/:commentId", isAuthenticated, editComment);

// Delete a comment
router.delete("/comment/:commentId", isAuthenticated, deleteComment);



// Assign task
router.post("/assign", isAuthenticated, assignTask);

// Get tasks for user (filter by issueId)
router.get("/forUser/:userId", isAuthenticated, getTasksForUser);

// Worker: Add task update
router.post("/update/:taskId", isAuthenticated, updateTask);

// Worker: Submit task proof
router.post("/submitProof/:taskId", isAuthenticated, submitTaskProof);

// Coordinator: Approve / Reject proof
router.post("/approveReject/:taskId", isAuthenticated, approveRejectTaskProof);

// Supervisor resolves the issue
router.post("/resolve/:issueId", isAuthenticated,  resolveIssue);

router.post("/submitFeedback", isAuthenticated,  submitFeedback);
router.get('/feedback/:issueId', isAuthenticated, getFeedbackForIssue);
router.get('/report/:issueId', isAuthenticated, getReportForIssue);
router.get('/top', isAuthenticated, getTopIssues);
router.get('/my', isAuthenticated, getMyIssues);
router.get('/staff-summary', isAuthenticated, getSummary);
router.post("/analyze-feedback", isAuthenticated, analyzeFeedback);
router.get('/staff/dashboard', isAuthenticated, getStaffDashboardDetails );
router.get('/staff-dashboard/:staffId', isAuthenticated, getStaffDashboardDetails);

router.post(
  "/reassign/:taskId",
  isAuthenticated,
  reassignTaskToCoordinator
);

// Supervisor completes their task themselves (no approval)
router.post(
  "/completeBySupervisor/:taskId",
  isAuthenticated,
  completeTaskBySupervisor
);

router.get("/:issueId/suggested-staff", isAuthenticated, getSuggestedStaff);

router.post("/assign-suggested", isAuthenticated, assignMultipleSuggestedStaff);

// Get timeline events for an issue
router.get("/timeline/:issueId", isAuthenticated, getIssueTimeline);

router.get("/:slug",isAuthenticated, getIssueBySlug);
export default router;

//for image classification
router.post("/classify", classifyIssueImage);

router.post("/generate-from-image", generateIssueFromImage);