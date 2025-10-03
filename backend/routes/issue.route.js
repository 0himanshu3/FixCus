import express from "express";
import { createIssue, getIssues,getCompletedIssues,getIssueDetails} from "../controllers/issue.contoller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", isAuthenticated, createIssue);
router.get("/all", getIssues);
router.get("/completed-issues",isAuthenticated, getCompletedIssues);
router.get("/issue-details/:id",isAuthenticated,getIssueDetails)

export default router;
