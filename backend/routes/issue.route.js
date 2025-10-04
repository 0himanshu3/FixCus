import express from "express";
import { addComment, createIssue, deleteComment, downvoteIssue, editComment, getIssueBySlug, getIssues, upvoteIssue,getCompletedIssues,getIssueDetails, takeUpIssue, assignStaff, getAssignedStaff } from "../controllers/issue.contoller.js";
import { isAuthenticated, protectMunicipality } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", isAuthenticated, createIssue);
router.get("/completed-issues",isAuthenticated, getCompletedIssues);
router.get("/issue-details/:id",isAuthenticated,getIssueDetails)
router.get("/all",isAuthenticated, getIssues);

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

router.get("/:slug",isAuthenticated, getIssueBySlug);


export default router;
