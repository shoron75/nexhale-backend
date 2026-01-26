import pool from "../config/db.js";

export const getSummary = async (req, res) => {
	const userId = req.user.id;
	const month = req.query.month || new Date().getMonth() + 1;
	const year = req.query.year || new Date().getFullYear();

	try {
		const smokeQuery = `
      SELECT 
        COALESCE(SUM(sl.cigarette_count * cb.nicotine_per_cigarette), 0) as totalNicotine,
        COALESCE(SUM(sl.cigarette_count * cb.tar_per_cigarette), 0) as totalTar,
        COALESCE(SUM(sl.cost), 0) as totalCost,
        COALESCE(SUM(sl.cigarette_count), 0) as totalCigarettes
      FROM Smoking_Log sl
      JOIN Cigarette_Brand cb ON sl.brand_id = cb.brand_id
      WHERE sl.user_id = ? AND MONTH(sl.log_date) = ? AND YEAR(sl.log_date) = ?
    `;
		const [smokeRows] = await pool.query(smokeQuery, [userId, month, year]);
		const smokeStats = smokeRows[0];

		const [vapeRows] = await pool.query(
			"SELECT COALESCE(SUM(puffs), 0) as totalPuffs, COALESCE(SUM(liquid_amount), 0) as totalLiquid, COALESCE(SUM(nicotine_amount), 0) as totalVapeNicotine FROM Vape_Log WHERE user_id = ? AND MONTH(log_date) = ? AND YEAR(log_date) = ?",
			[userId, month, year],
		);
		const vapeStats = vapeRows[0];

		const combined = {
			totalNicotine: (
				parseFloat(smokeStats.totalNicotine || 0) +
				parseFloat(vapeStats.totalVapeNicotine || 0)
			).toFixed(2),
			totalTar: parseFloat(smokeStats.totalTar || 0).toFixed(2),
			totalCost: parseFloat(smokeStats.totalCost || 0).toFixed(2),
			totalCigarettes: parseInt(smokeStats.totalCigarettes || 0),
			totalPuffs: parseInt(vapeStats.totalPuffs || 0),
			totalLiquid: parseFloat(vapeStats.totalLiquid || 0).toFixed(2),
			totalChemical: (
				parseFloat(smokeStats.totalTar || 0) * 0.05 +
				parseFloat(vapeStats.totalPuffs || 0) * 0.1
			).toFixed(2),
		};

		res.json(combined);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};

export const getDailyStats = async (req, res) => {
	const userId = req.user.id;
	try {
		const [smoke] = await pool.query(
			`
            SELECT DAYNAME(log_date) as day, 
                   SUM(sl.cigarette_count * cb.nicotine_per_cigarette) as nicotine,
                   SUM(sl.cigarette_count * cb.tar_per_cigarette) as tar
            FROM Smoking_Log sl
            JOIN Cigarette_Brand cb ON sl.brand_id = cb.brand_id
            WHERE sl.user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY log_date, day
            ORDER BY log_date ASC
        `,
			[userId],
		);

		const [vape] = await pool.query(
			`
            SELECT DAYNAME(log_date) as day, 
                   SUM(nicotine_amount) as nicotine
            FROM Vape_Log
            WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY log_date, day
            ORDER BY log_date ASC
        `,
			[userId],
		);

		const days = [
			"Saturday",
			"Sunday",
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
		];
		const dayMap = new Map();
		days.forEach((d) => dayMap.set(d, { nicotine: 0, tar: 0 }));

		smoke.forEach((r) => {
			const entry = dayMap.get(r.day);
			if (entry) {
				entry.nicotine += parseFloat(r.nicotine || 0);
				entry.tar += parseFloat(r.tar || 0);
			}
		});
		vape.forEach((r) => {
			const entry = dayMap.get(r.day);
			if (entry) {
				entry.nicotine += parseFloat(r.nicotine || 0);
			}
		});

		const result = days.map((d) => ({
			name: d.substring(0, 3),
			nicotine: parseFloat(dayMap.get(d).nicotine.toFixed(2)),
			tar: parseFloat(dayMap.get(d).tar.toFixed(2)),
		}));

		res.json(result);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};

export const getWeeklyStats = async (req, res) => {
	const userId = req.user.id;
	try {
		const [smoke] = await pool.query(
			`
            SELECT WEEK(log_date) as week_num,
                   SUM(sl.cigarette_count * cb.nicotine_per_cigarette) as nicotine,
                   SUM(sl.cigarette_count * cb.tar_per_cigarette) as tar
            FROM Smoking_Log sl
            JOIN Cigarette_Brand cb ON sl.brand_id = cb.brand_id
            WHERE sl.user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
            GROUP BY week_num
            ORDER BY week_num ASC
        `,
			[userId],
		);

		const [vape] = await pool.query(
			`
            SELECT WEEK(log_date) as week_num,
                   SUM(nicotine_amount) as nicotine
            FROM Vape_Log
            WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
            GROUP BY week_num
            ORDER BY week_num ASC
        `,
			[userId],
		);

		const weeksMap = new Map();
		[...smoke, ...vape].forEach((r) => {
			const existing = weeksMap.get(r.week_num) || {
				nicotine: 0,
				tar: 0,
			};
			weeksMap.set(r.week_num, {
				nicotine: existing.nicotine + parseFloat(r.nicotine || 0),
				tar: existing.tar + parseFloat(r.tar || 0),
			});
		});

		const result = Array.from(weeksMap.entries())
			.sort((a, b) => a[0] - b[0])
			.map(([num, data], i) => ({
				name: `Week ${i + 1}`,
				nicotine: parseFloat(data.nicotine.toFixed(2)),
				tar: parseFloat(data.tar.toFixed(2)),
			}));

		res.json(result);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};

export const getMonthlyStats = async (req, res) => {
	const userId = req.user.id;
	try {
		const [smoke] = await pool.query(
			`
            SELECT MONTHNAME(log_date) as month,
                   SUM(sl.cigarette_count * cb.nicotine_per_cigarette) as nicotine,
                   SUM(sl.cigarette_count * cb.tar_per_cigarette) as tar
            FROM Smoking_Log sl
            JOIN Cigarette_Brand cb ON sl.brand_id = cb.brand_id
            WHERE sl.user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY MONTH(log_date), month
            ORDER BY MONTH(log_date) ASC
        `,
			[userId],
		);

		const [vape] = await pool.query(
			`
            SELECT MONTHNAME(log_date) as month,
                   SUM(nicotine_amount) as nicotine
            FROM Vape_Log
            WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY MONTH(log_date), month
            ORDER BY MONTH(log_date) ASC
        `,
			[userId],
		);

		const months = [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
		];
		const monthMap = new Map();
		months.forEach((m) => monthMap.set(m, { nicotine: 0, tar: 0 }));

		smoke.forEach((r) => {
			const entry = monthMap.get(r.month);
			if (entry) {
				entry.nicotine += parseFloat(r.nicotine || 0);
				entry.tar += parseFloat(r.tar || 0);
			}
		});
		vape.forEach((r) => {
			const entry = monthMap.get(r.month);
			if (entry) {
				entry.nicotine += parseFloat(r.nicotine || 0);
			}
		});

		const result = months.map((m) => ({
			name: m.substring(0, 3),
			nicotine: parseFloat(monthMap.get(m).nicotine.toFixed(2)),
			tar: parseFloat(monthMap.get(m).tar.toFixed(2)),
		}));

		res.json(result);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};

export const getHealthImpact = async (req, res) => {
	const userId = req.user.id;
	const month = new Date().getMonth() + 1;
	const year = new Date().getFullYear();

	try {
		const [smoke] = await pool.query(
			"SELECT SUM(sl.cigarette_count * cb.nicotine_per_cigarette) as nic, SUM(sl.cigarette_count * cb.tar_per_cigarette) as tar FROM Smoking_Log sl JOIN Cigarette_Brand cb ON sl.brand_id = cb.brand_id WHERE sl.user_id = ? AND MONTH(log_date) = ? AND YEAR(log_date) = ?",
			[userId, month, year],
		);
		const [vape] = await pool.query(
			"SELECT SUM(nicotine_amount) as nic, SUM(puffs) as puffs FROM Vape_Log WHERE user_id = ? AND MONTH(log_date) = ? AND YEAR(log_date) = ?",
			[userId, month, year],
		);

		const totalNic =
			parseFloat(smoke[0].nic || 0) + parseFloat(vape[0].nic || 0);
		const totalTar = parseFloat(smoke[0].tar || 0);
		const totalPuffs = parseInt(vape[0].puffs || 0);
		const cei = totalPuffs * 0.1;

		const [impacts] = await pool.query(
			`
      SELECT hi.*, hid.impact_type, hid.impact_description
      FROM Health_Impact hi
      LEFT JOIN Health_Impact_Detail hid ON hi.impact_id = hid.impact_id
      WHERE (? BETWEEN hi.tar_min AND hi.tar_max) 
         OR (? BETWEEN hi.nicotine_min AND hi.nicotine_max)
      ORDER BY hi.impact_id DESC
    `,
			[totalTar, totalNic],
		);

		if (impacts.length === 0) {
			const [first] = await pool.query(
				"SELECT * FROM Health_Impact WHERE impact_id = 1",
			);
			return res.json({
				riskTier: first[0].risk_tier,
				riskPercentage: first[0].risk_percentage,
				nicotineIntake: totalNic.toFixed(1),
				tarIntake: totalTar.toFixed(1),
				ceiIntake: cei.toFixed(1),
				details: [],
			});
		}

		const tier = impacts[0];
		const details = impacts
			.filter((i) => i.impact_id === tier.impact_id && i.impact_type)
			.map((i) => ({
				type: i.impact_type,
				description: i.impact_description,
			}));

		res.json({
			riskTier: tier.risk_tier,
			riskPercentage: tier.risk_percentage,
			nicotineIntake: totalNic.toFixed(1),
			tarIntake: totalTar.toFixed(1),
			ceiIntake: cei.toFixed(1),
			details,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};

export const getMoodStats = async (req, res) => {
	const userId = req.user.id;
	try {
		const query = `
      SELECT m.mood_type as mood, COUNT(*) as count
      FROM (
        SELECT mla.mood_id, mla.log_id FROM Mood_Log_Associated mla
        JOIN Smoking_Log sl ON mla.log_id = sl.log_id
        WHERE sl.user_id = ?
        UNION ALL
        SELECT mva.mood_id, mva.vape_log_id FROM Mood_Vape_Associated mva
        JOIN Vape_Log vl ON mva.vape_log_id = vl.vape_log_id
        WHERE vl.user_id = ?
      ) as combined_moods
      JOIN Mood m ON combined_moods.mood_id = m.mood_id
      GROUP BY m.mood_type
    `;
		const [rows] = await pool.query(query, [userId, userId]);
		res.json(rows);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};
