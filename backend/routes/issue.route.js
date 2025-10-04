import express from "express";
import { addComment, createIssue, deleteComment, downvoteIssue, editComment, getIssueBySlug, getIssues, upvoteIssue,getCompletedIssues,getIssueDetails, takeUpIssue, assignStaff, getAssignedStaff, assignTask, getTasksForUser, updateTask, submitTaskProof, approveRejectTaskProof, resolveIssue, getMonthlyAnalysis } from "../controllers/issue.contoller.js";
import { isAuthenticated, protectMunicipality } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", isAuthenticated, createIssue);
router.get("/completed-issues",isAuthenticated, getCompletedIssues);
router.get("/issue-details/:id",isAuthenticated,getIssueDetails)
router.get("/all",isAuthenticated, getIssues);
router.get("/monthly-analysis",getMonthlyAnalysis)
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

router.get("/:slug",isAuthenticated, getIssueBySlug);


export default router;
