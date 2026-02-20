import pool from "../config/db.js";
import * as aiService from "../services/ai.service.js";

// Create a new AI-based Quit Plan
export const createAIQuitPlan = async (req, res) => {
	const userId = req.user.id;
	const { currentIntake, targetIntake, timelineMonths, brandId, brandType } =
		req.body;

	try {
		// 1. Get brand info
		let brandTable =
			brandType === "Vape" ? "Vape_Brand" : "Cigarette_Brand";
		let nicCol =
			brandType === "Vape" ? "nicotine_per_ml" : "nicotine_per_cigarette";

		const [brands] = await pool.query(
			`SELECT * FROM ${brandTable} WHERE brand_id = ?`,
			[brandId],
		);
		if (brands.length === 0)
			return res.status(404).json({ message: "Brand not found" });

		const brand = brands[0];
		const brandNicotine = parseFloat(brand[nicCol]);
		const brandName = brand.brand_name || brand.name;

		// 2. Get AI Advice (Initial)
		const aiAdvice = await aiService.generateQuitPlanAdvice({
			currentIntake,
			targetIntake,
			timelineMonths,
			brandNicotine,
			brandName,
		});

		// 3. Save Plan to DB
		const [result] = await pool.query(
			`INSERT INTO Quit_Plan 
       (user_id, target_nicotine_amount, starting_date, target_timeline_months, starting_nicotine_mg, daily_nicotine_allowance_mg, selected_brand_id, selected_brand_type, current_status) 
       VALUES (?, ?, CURRENT_DATE, ?, ?, ?, ?, ?, 'Active')`,
			[
				userId,
				targetIntake,
				timelineMonths,
				currentIntake,
				aiAdvice.daily_stick_allowance * brandNicotine * 30, // Monthly target based on daily allowance
				aiAdvice.daily_stick_allowance * brandNicotine,
				brandId,
				brandType,
			],
		);

		res.status(201).json({
			message: "AI Quit Plan created successfully",
			planId: result.insertId,
			aiAdvice,
		});
	} catch (error) {
		console.error("Controller Error (createAIQuitPlan):", error);
		res.status(500).json({ message: "Server error" });
	}
};

// Get Dashboard Data
export const getAIQuitPlanDashboard = async (req, res) => {
	const userId = req.user.id;

	try {
		// 1. Get latest plan
		const [plans] = await pool.query(
			`SELECT qp.*, cb.brand_name as cigarette_brand, vb.name as vape_brand 
       FROM Quit_Plan qp
       LEFT JOIN Cigarette_Brand cb ON qp.selected_brand_id = cb.brand_id AND qp.selected_brand_type = 'Cigarette'
       LEFT JOIN Vape_Brand vb ON qp.selected_brand_id = vb.brand_id AND qp.selected_brand_type = 'Vape'
       WHERE qp.user_id = ? ORDER BY qp.plan_id DESC LIMIT 1`,
			[userId],
		);

		if (plans.length === 0)
			return res
				.status(404)
				.json({ message: "No active quit plan found" });
		const plan = plans[0];

		// Ensure decimal values are numbers
		plan.target_nicotine_amount =
			parseFloat(plan.target_nicotine_amount) || 0;
		plan.starting_nicotine_mg = parseFloat(plan.starting_nicotine_mg) || 0;
		plan.daily_nicotine_allowance_mg =
			parseFloat(plan.daily_nicotine_allowance_mg) || 0;

		// 2. Get current nicotine intake for the month
		const startDate = new Date();
		startDate.setDate(1);
		const startDateStr = startDate.toISOString().split("T")[0];

		const [smokeRows] = await pool.query(
			`SELECT SUM(sl.cigarette_count * cb.nicotine_per_cigarette) as total 
       FROM Smoking_Log sl
       JOIN Cigarette_Brand cb ON sl.brand_id = cb.brand_id
       WHERE sl.user_id = ? AND sl.log_date >= ?`,
			[userId, startDateStr],
		);

		const [vapeRows] = await pool.query(
			"SELECT SUM(nicotine_amount) as total FROM Vape_Log WHERE user_id = ? AND log_date >= ?",
			[userId, startDateStr],
		);

		const currentMonthlyIntake =
			(parseFloat(smokeRows[0].total) || 0) +
			(parseFloat(vapeRows[0].total) || 0);

		// 3. Get Health Metrics (Simplified simulation)
		const totalAvoided = plan.starting_nicotine_mg - currentMonthlyIntake;
		const progressPercent = Math.min(
			100,
			Math.max(
				0,
				(currentMonthlyIntake / plan.target_nicotine_amount) * 100,
			),
		);

		let statusZone = "Green";
		if (progressPercent > 90) statusZone = "Red";
		else if (progressPercent > 70) statusZone = "Yellow";

		res.json({
			plan,
			stats: {
				currentMonthlyIntake,
				targetMonthlyIntake: plan.target_nicotine_amount,
				dailyAllowanceMg: plan.daily_nicotine_allowance_mg,
				totalNicotineAvoided: Math.max(0, totalAvoided),
				progressPercent,
				statusZone,
			},
		});
	} catch (error) {
		console.error("Controller Error (getAIQuitPlanDashboard):", error);
		res.status(500).json({ message: "Server error" });
	}
};

// Get Smart Recommendations
export const getAIRecommendations = async (req, res) => {
	const userId = req.user.id;
	const { mood, cravingLevel } = req.query;

	try {
		const [plans] = await pool.query(
			"SELECT * FROM Quit_Plan WHERE user_id = ? ORDER BY plan_id DESC LIMIT 1",
			[userId],
		);
		if (plans.length === 0)
			return res.status(404).json({ message: "No plan found" });
		const plan = plans[0];

		const hour = new Date().getHours();
		let timeOfDay = "Morning";
		if (hour >= 12 && hour < 17) timeOfDay = "Afternoon";
		if (hour >= 17 && hour < 21) timeOfDay = "Evening";
		if (hour >= 21 || hour < 5) timeOfDay = "Night";

		const interventions = await aiService.getInterventions({
			mood: mood || "Neutral",
			timeOfDay,
			cravingLevel: cravingLevel || "Moderate",
		});

		res.json(interventions);
	} catch (error) {
		console.error("Controller Error (getAIRecommendations):", error);
		res.status(500).json({ message: "Server error" });
	}
};

// Simulate Brand Switch
export const simulateBrandSwitch = async (req, res) => {
	const userId = req.user.id;

	try {
		const [plans] = await pool.query(
			`SELECT qp.*, cb.brand_name, cb.nicotine_per_cigarette 
             FROM Quit_Plan qp
             JOIN Cigarette_Brand cb ON qp.selected_brand_id = cb.brand_id
             WHERE qp.user_id = ? AND qp.selected_brand_type = 'Cigarette'
             ORDER BY qp.plan_id DESC LIMIT 1`,
			[userId],
		);

		if (plans.length === 0)
			return res.status(400).json({
				message: "Only available for cigarette quit plans currently",
			});
		const plan = plans[0];

		const suggestions = await aiService.getBrandSuggestions(
			{
				brand_name: plan.brand_name,
				nicotine_per_cigarette: plan.nicotine_per_cigarette,
			},
			plan.target_nicotine_amount,
		);

		res.json(suggestions);
	} catch (error) {
		console.error("Controller Error (simulateBrandSwitch):", error);
		res.status(500).json({ message: "Server error" });
	}
};
