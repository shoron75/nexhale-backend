import pool from "../config/db.js";

// Get current quit plan and progress
export const getQuitPlanProgress = async (req, res) => {
	const userId = req.user.id;

	try {
		// 1. Get current plan
		const [plans] = await pool.query(
			"SELECT target_nicotine_amount FROM Quit_Plan WHERE user_id = ? ORDER BY plan_id DESC LIMIT 1",
			[userId],
		);

		// 2. Get current month progress
		const startDate = new Date();
		startDate.setDate(1);
		const startDateStr = startDate.toISOString().split("T")[0];

		// Cigarette nicotine
		const [smokeRows] = await pool.query(
			`SELECT SUM(sl.cigarette_count * cb.nicotine_per_cigarette) as total 
       FROM Smoking_Log sl
       JOIN Cigarette_Brand cb ON sl.brand_id = cb.brand_id
       WHERE sl.user_id = ? AND sl.log_date >= ?`,
			[userId, startDateStr],
		);

		// Vape nicotine
		const [vapeRows] = await pool.query(
			"SELECT SUM(nicotine_amount) as total FROM Vape_Log WHERE user_id = ? AND log_date >= ?",
			[userId, startDateStr],
		);

		const totalCigaretteNic = parseFloat(smokeRows[0].total) || 0;
		const totalVapeNic = parseFloat(vapeRows[0].total) || 0;

		// 3. Get weekly breakdown
		const [weeklySmoke] = await pool.query(
			`SELECT WEEK(log_date) as week_num, SUM(sl.cigarette_count * cb.nicotine_per_cigarette) as nicotine 
       FROM Smoking_Log sl JOIN Cigarette_Brand cb ON sl.brand_id = cb.brand_id 
       WHERE sl.user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK) GROUP BY week_num`,
			[userId],
		);

		const [weeklyVape] = await pool.query(
			"SELECT WEEK(log_date) as week_num, SUM(nicotine_amount) as nicotine FROM Vape_Log WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK) GROUP BY week_num",
			[userId],
		);

		// Combine weekly stats
		const weeksMap = new Map();
		const allWeeks = [...weeklySmoke, ...weeklyVape];
		allWeeks.forEach((w) => {
			const existing = weeksMap.get(w.week_num) || 0;
			weeksMap.set(w.week_num, existing + parseFloat(w.nicotine));
		});

		const weeklyProgress = Array.from(weeksMap.entries())
			.map(([num, total]) => ({ week_num: num, week_total: total }))
			.sort((a, b) => b.week_num - a.week_num);

		res.json({
			plan: plans[0]
				? { nicotine_limit: plans[0].target_nicotine_amount }
				: { nicotine_limit: 500 },
			totalConsumed: totalCigaretteNic + totalVapeNic,
			weeklyProgress,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};

// Create or update quit plan
export const updateQuitPlan = async (req, res) => {
	const userId = req.user.id;
	const { nicotineLimit } = req.body;

	try {
		await pool.query(
			'INSERT INTO Quit_Plan (user_id, target_nicotine_amount, starting_date, current_status) VALUES (?, ?, CURRENT_DATE, "Active")',
			[userId, nicotineLimit],
		);
		res.status(201).json({ message: "Quit plan updated", nicotineLimit });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};

// Log progress (Smoking_Log)
export const logProgress = async (req, res) => {
	const userId = req.user.id;
	const { date, cigaretteCount, brandId, cost, mood } = req.body;

	try {
		const [result] = await pool.query(
			"INSERT INTO Smoking_Log (user_id, log_date, cigarette_count, brand_id, cost) VALUES (?, NOW(), ?, ?, ?)",
			[userId, cigaretteCount, brandId, cost || 0],
		);

		if (mood) {
			const [moods] = await pool.query(
				"SELECT mood_id FROM Mood WHERE mood_type = ?",
				[mood],
			);
			if (moods.length > 0) {
				await pool.query(
					"INSERT INTO Mood_Log_Associated (mood_id, log_id) VALUES (?, ?)",
					[moods[0].mood_id, result.insertId],
				);
			}
		}

		res.json({ message: "Smoking progress logged successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};

// Log vape progress
export const logVapeProgress = async (req, res) => {
	const userId = req.user.id;
	const {
		puffs,
		liquidAmount,
		flavor,
		pgPercentage,
		nicotineAmount,
		mood,
	} = req.body;

	try {
		const [result] = await pool.query(
			"INSERT INTO Vape_Log (user_id, log_date, puffs, liquid_amount, nicotine_amount, flavor, pg_percentage) VALUES (?, NOW(), ?, ?, ?, ?, ?)",
			[
				userId,
				puffs,
				liquidAmount,
				nicotineAmount || 0,
				flavor,
				pgPercentage || 50,
			],
		);

		if (mood) {
			const [moods] = await pool.query(
				"SELECT mood_id FROM Mood WHERE mood_type = ?",
				[mood],
			);
			if (moods.length > 0) {
				await pool.query(
					"INSERT INTO Mood_Vape_Associated (mood_id, vape_log_id) VALUES (?, ?)",
					[moods[0].mood_id, result.insertId],
				);
			}
		}

		res.json({ message: "Vape session logged successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};
