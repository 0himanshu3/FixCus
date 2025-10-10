import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { assignTask, getTasksForUser, updateTask, submitTaskProof, approveRejectTaskProof, reassignTaskToCoordinator, completeTaskBySupervisor } from "../controllers/task.controller.js";

const router = express.Router();

router.post("/assign", isAuthenticated, assignTask);
router.get("/forUser/:userId", isAuthenticated, getTasksForUser);
router.post("/update/:taskId", isAuthenticated, updateTask);
router.post("/submitProof/:taskId", isAuthenticated, submitTaskProof);
router.post("/approveReject/:taskId", isAuthenticated, approveRejectTaskProof);
router.post(
  "/reassign/:taskId",
  isAuthenticated,
  reassignTaskToCoordinator
);
router.post(
  "/completeBySupervisor/:taskId",
  isAuthenticated,
  completeTaskBySupervisor
);

export default router;