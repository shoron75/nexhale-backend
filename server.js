import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { bootstrapDatabase } from "./database/bootstrap.js";
import authRoutes from "./routes/auth.routes.js";
import brandsRoutes from "./routes/brands.routes.js";
import quitPlanRoutes from "./routes/quitPlan.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import userRoutes from "./routes/user.routes.js";
import aiQuitPlanRoutes from "./routes/aiQuitPlan.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Bootstrap Database
try {
	await bootstrapDatabase();
} catch (error) {
	console.error("Critical error during database bootstrap:", error);
	process.exit(1);
}

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/brands", brandsRoutes);
app.use("/api/quit-plan", quitPlanRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/ai-quit-plan", aiQuitPlanRoutes);

app.get("/", (req, res) => {
	res.send("Nexhale API is running");
});

// JSON Error Handler
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({
		message: "Internal Server Error",
		error: process.env.NODE_ENV === "development" ? err.message : undefined,
	});
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
