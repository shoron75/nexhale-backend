import express from "express";
import {
	getQuitPlanProgress,
	updateQuitPlan,
	logProgress,
	logVapeProgress,
} from "../controllers/quitPlan.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getQuitPlanProgress);
router.post("/", protect, updateQuitPlan);
router.post("/log", protect, logProgress);
router.post("/log-vape", protect, logVapeProgress);

export default router;
