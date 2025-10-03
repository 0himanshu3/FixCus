import express from "express";
import { addComment, createIssue, deleteComment, downvoteIssue, editComment, getIssueBySlug, getIssues, upvoteIssue } from "../controllers/issue.contoller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", isAuthenticated, createIssue);
router.get("/all",isAuthenticated, getIssues);

router.post("/upvote", isAuthenticated, upvoteIssue);
router.post("/downvote", isAuthenticated, downvoteIssue);
router.post("/comment", isAuthenticated, addComment);
// Edit a comment
router.put("/comment/:commentId", isAuthenticated, editComment);

// Delete a comment
router.delete("/comment/:commentId", isAuthenticated, deleteComment);

router.get("/:slug",isAuthenticated, getIssueBySlug);


export default router;
