import express from "express";
import {
	getSummary,
	getWeeklyStats,
	getDailyStats,
	getMonthlyStats,
	getMoodStats,
	getHealthImpact,
} from "../controllers/stats.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/summary", protect, getSummary);
router.get("/daily", protect, getDailyStats);
router.get("/weekly", protect, getWeeklyStats);
router.get("/monthly", protect, getMonthlyStats);
router.get("/moods", protect, getMoodStats);
router.get("/health", protect, getHealthImpact);

export default router;
