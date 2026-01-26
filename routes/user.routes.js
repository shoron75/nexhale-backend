import express from "express";
import {
	getProfile,
	updateProfile,
	changePassword,
	changeEmail,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.patch("/profile", protect, updateProfile);
router.post("/change-password", protect, changePassword);
router.post("/change-email", protect, changeEmail);

export default router;
