import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { analyzeFeedback, getFeedbackForIssue, submitFeedback, } from "../controllers/feedback.controller.js";
const router = express.Router();


router.post("/submitFeedback", isAuthenticated,  submitFeedback);
router.get('/feedback/:issueId', isAuthenticated, getFeedbackForIssue);

router.post("/analyze-feedback", isAuthenticated, analyzeFeedback);

export default router;