import express from "express";
import { createIssue, getIssues } from "../controllers/issue.contoller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", isAuthenticated, createIssue);
router.get("/all", getIssues);

export default router;
