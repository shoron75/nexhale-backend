import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
	createAIQuitPlan,
	getAIQuitPlanDashboard,
	getAIRecommendations,
	simulateBrandSwitch,
} from "../controllers/aiQuitPlan.controller.js";

const router = express.Router();

router.use(protect);

router.post("/setup", createAIQuitPlan);
router.get("/dashboard", getAIQuitPlanDashboard);
router.get("/recommendations", getAIRecommendations);
router.get("/simulate-switch", simulateBrandSwitch);

export default router;
