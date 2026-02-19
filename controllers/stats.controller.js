import pool from "../config/db.js";

const flavorContributions = {
	Fruit: 0.3,
	Candy: 0.3,
	Menthol: 0.25,
	Mint: 0.25,
	Tobacco: 0.35,
	Dessert: 0.5,
	Creamy: 0.5,
	Neutral: 0.1,
	Unflavored: 0.1,
	Unknown: 0.4,
	Mixed: 0.4,
};

const getFlavorContribution = (flavor) => {
	if (!flavor) return 0.4;
	for (const [key, value] of Object.entries(flavorContributions)) {
		if (flavor.toLowerCase().includes(key.toLowerCase())) return value;
	}
	return 0.4;
};

const calculateVapeMetrics = (log) => {
	// If standard brand data is available, prioritize it
	if (log.nicotine_per_ml && log.liquid_amount) {
		const liquid = parseFloat(log.liquid_amount);
		const nicotine = liquid * parseFloat(log.nicotine_per_ml);

		// CEI for vape: (puffs * (1 + pg)) + flavor - basically similar but weighted?
		// Or simpler: liquid * toxicity?
		// The prompt asked to measure "same way we have cigarette brands".
		// For cigs: count * tar_per_cig
		// For vape: liquid * chemical_per_ml?
		// Let's stick to the CEI formula but use standard values if present.

		const puffs = parseInt(log.puffs || 0);
		const pg = 50; // Default or from brand?
		const flavorContr = getFlavorContribution(log.flavor);
		// If we have avg_puffs_per_ml, we can validate or normalize

		// Legacy calc for compatibility
		const pgContribution = liquid * (pg / 100);
		const cei = puffs * (1.0 + pgContribution + flavorContr);

		return { nicotine, cei };
	}

	const puffs = parseInt(log.puffs || 0);
	const liquid = parseFloat(log.liquid_amount || 0);
	const pg = parseInt(log.pg_percentage || 50);
	const nicotine = parseFloat(log.nicotine_amount || 0);
	const flavor = log.flavor || "Unknown";

	const pgContribution = liquid * (pg / 100);
	const flavorContr = getFlavorContribution(flavor);
	const cei = puffs * (1.0 + pgContribution + flavorContr);

	return { nicotine, cei };
};

const getZone = (nicotine, cei) => {
	let nicZone = "Green";
	if (nicotine > 15) nicZone = "Red";
	else if (nicotine > 6) nicZone = "Yellow";

	let ceiZone = "Green";
	if (cei > 300) ceiZone = "Red";
	else if (cei > 150) ceiZone = "Yellow";

	const zones = ["Green", "Yellow", "Red"];
	const worstIdx = Math.max(zones.indexOf(nicZone), zones.indexOf(ceiZone));
	return zones[worstIdx];
};

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
			`SELECT vl.puffs, vl.liquid_amount, vl.nicotine_amount, vl.flavor, vl.pg_percentage, vl.log_date,
              vb.nicotine_per_ml
             FROM Vape_Log vl
             LEFT JOIN Vape_Brand vb ON vl.brand_id = vb.brand_id
             WHERE vl.user_id = ? AND MONTH(vl.log_date) = ? AND YEAR(vl.log_date) = ?`,
			[userId, month, year],
		);

		let totalVapeNic = 0;
		let totalVapeCEI = 0;

		vapeRows.forEach((log) => {
			const metrics = calculateVapeMetrics(log);
			totalVapeNic += metrics.nicotine;
			totalVapeCEI += metrics.cei;
		});

		const [ytdRows] = await pool.query(
			"SELECT COALESCE(SUM(cost), 0) as ytdCost FROM Smoking_Log WHERE user_id = ? AND YEAR(log_date) = ? AND MONTH(log_date) <= ?",
			[userId, year, month],
		);
		const ytdCost = ytdRows[0].ytdCost;

		// Get current daily zone (for today)
		const [todayVape] = await pool.query(
			`SELECT vl.puffs, vl.liquid_amount, vl.nicotine_amount, vl.flavor, vl.pg_percentage,
                    vb.nicotine_per_ml
             FROM Vape_Log vl
             LEFT JOIN Vape_Brand vb ON vl.brand_id = vb.brand_id
             WHERE vl.user_id = ? AND DATE(vl.log_date) = CURDATE()`,
			[userId],
		);

		const [todaySmoke] = await pool.query(
			`SELECT SUM(sl.cigarette_count * cb.nicotine_per_cigarette) as nic,
                    SUM(sl.cigarette_count * cb.tar_per_cigarette) as tar,
                    SUM(sl.cigarette_count) as count
             FROM Smoking_Log sl
             JOIN Cigarette_Brand cb ON sl.brand_id = cb.brand_id
             WHERE sl.user_id = ? AND DATE(sl.log_date) = CURDATE()`,
			[userId],
		);

		let dailyNic = parseFloat(todaySmoke[0].nic || 0);
		let dailyCEI = parseFloat(todaySmoke[0].tar || 0);
		let totalPuffs = 0;
		let totalLiquid = 0;

		todayVape.forEach((log) => {
			const m = calculateVapeMetrics(log);
			dailyNic += m.nicotine;
			dailyCEI += m.cei;
			totalPuffs += parseInt(log.puffs || 0);
			totalLiquid += parseFloat(log.liquid_amount || 0);
		});

		const combined = {
			totalNicotine: (
				parseFloat(smokeStats.totalNicotine || 0) + totalVapeNic
			).toFixed(2),
			totalTar: (
				parseFloat(smokeStats.totalTar || 0) + totalVapeCEI
			).toFixed(2),
			totalCost: parseFloat(smokeStats.totalCost || 0).toFixed(2),
			totalCigarettes: parseInt(smokeStats.totalCigarettes || 0),
			totalVapeCEI: totalVapeCEI.toFixed(2),
			totalChemical: (
				parseFloat(smokeStats.totalTar || 0) + totalVapeCEI
			).toFixed(2),
			ytdCost: parseFloat(ytdCost || 0).toFixed(2),
			dailyZone: getZone(dailyNic, dailyCEI),
			dailyCigarettes: parseInt(todaySmoke[0].count || 0),
			dailyTar: dailyCEI.toFixed(2),
			totalPuffs,
			totalLiquid,
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
            GROUP BY DATE(log_date), day
            ORDER BY DATE(log_date) ASC
        `,
			[userId],
		);

		const [vape] = await pool.query(
			`
            SELECT DAYNAME(log_date) as day, 
                   SUM(nicotine_amount) as nicotine
            FROM Vape_Log
            WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(log_date), day
            ORDER BY DATE(log_date) ASC
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
	const month = parseInt(req.query.month) || new Date().getMonth() + 1;
	const year = parseInt(req.query.year) || new Date().getFullYear();

	try {
		// We'll split the month into 4 buckets: Days 1-7, 8-14, 15-21, 22-end
		const buckets = [
			{ name: "Week 1", start: 1, end: 7 },
			{ name: "Week 2", start: 8, end: 14 },
			{ name: "Week 3", start: 15, end: 21 },
			{ name: "Week 4", start: 22, end: 31 },
		];

		const [smoke] = await pool.query(
			`
            SELECT DAY(log_date) as day_num,
                   (sl.cigarette_count * cb.nicotine_per_cigarette) as nicotine,
                   (sl.cigarette_count * cb.tar_per_cigarette) as tar
            FROM Smoking_Log sl
            JOIN Cigarette_Brand cb ON sl.brand_id = cb.brand_id
            WHERE sl.user_id = ? AND MONTH(log_date) = ? AND YEAR(log_date) = ?
        `,
			[userId, month, year],
		);

		const [vape] = await pool.query(
			`
            SELECT DAY(vl.log_date) as day_num,
                   vl.nicotine_amount as nicotine,
                   vl.puffs,
                   vl.liquid_amount,
                   vl.flavor,
                   vl.pg_percentage,
                   vb.nicotine_per_ml
            FROM Vape_Log vl
            LEFT JOIN Vape_Brand vb ON vl.brand_id = vb.brand_id
            WHERE vl.user_id = ? AND MONTH(vl.log_date) = ? AND YEAR(vl.log_date) = ?
        `,
			[userId, month, year],
		);

		const result = buckets.map((bucket) => {
			let nic = 0;
			let tar = 0;
			let cei = 0;

			smoke.forEach((r) => {
				if (r.day_num >= bucket.start && r.day_num <= bucket.end) {
					nic += parseFloat(r.nicotine || 0);
					tar += parseFloat(r.tar || 0);
				}
			});

			vape.forEach((r) => {
				if (r.day_num >= bucket.start && r.day_num <= bucket.end) {
					const m = calculateVapeMetrics({
						puffs: r.puffs,
						liquid_amount: r.liquid_amount, // Need to add this to query
						nicotine_amount: r.nicotine,
						flavor: r.flavor,
						pg_percentage: r.pg_percentage,
						nicotine_per_ml: r.nicotine_per_ml,
					});
					nic += m.nicotine;
					cei += m.cei;
				}
			});

			return {
				name: bucket.name,
				nicotine: parseFloat(nic.toFixed(2)),
				tar: parseFloat(tar.toFixed(2)),
				chemical: parseFloat((tar + cei).toFixed(2)),
			};
		});

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
			`SELECT vl.puffs, vl.liquid_amount, vl.nicotine_amount, vl.flavor, vl.pg_percentage, 
                    vb.nicotine_per_ml
             FROM Vape_Log vl
             LEFT JOIN Vape_Brand vb ON vl.brand_id = vb.brand_id
             WHERE vl.user_id = ? AND MONTH(vl.log_date) = ? AND YEAR(vl.log_date) = ?`,
			[userId, month, year],
		);

		let totalVapeNic = 0;
		let totalVapeCEI = 0;

		vape.forEach((log) => {
			const m = calculateVapeMetrics(log);
			totalVapeNic += m.nicotine;
			totalVapeCEI += m.cei;
		});

		const totalNic = parseFloat(smoke[0].nic || 0) + totalVapeNic;
		const totalTar = parseFloat(smoke[0].tar || 0);
		const totalCEI = parseFloat(smoke[0].tar || 0) + totalVapeCEI;

		const [impacts] = await pool.query(
			`
      SELECT hi.*, hid.impact_type, hid.impact_description
      FROM Health_Impact hi
      LEFT JOIN Health_Impact_Detail hid ON hi.impact_id = hid.impact_id
      WHERE (? BETWEEN hi.tar_min AND hi.tar_max) 
         OR (? BETWEEN hi.nicotine_min AND hi.nicotine_max)
      ORDER BY hi.impact_id DESC
    `,
			[totalCEI, totalNic],
		);

		if (impacts.length === 0) {
			const [first] = await pool.query(
				"SELECT * FROM Health_Impact WHERE impact_id = 1",
			);
			return res.json({
				riskTier: first[0].risk_tier,
				riskPercentage: first[0].risk_percentage,
				nicotineIntake: totalNic.toFixed(1),
				ceiIntake: totalCEI.toFixed(1),
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
			ceiIntake: totalCEI.toFixed(1),
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
