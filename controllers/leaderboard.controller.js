import pool from "../config/db.js";

export const getLeaderboard = async (req, res) => {
	const { type = "tar", period = "daily" } = req.query;

	try {
		let query = "";
		const column =
			type === "nicotine"
				? "cb.nicotine_per_cigarette"
				: "cb.tar_per_cigarette";
		const dateFilter =
			period === "daily"
				? "CURDATE()"
				: "DATE_SUB(CURDATE(), INTERVAL 1 MONTH)";

		query = `
      SELECT 
        u.user_id as id,
        CONCAT('user-', u.user_id) as name,
        SUM(sl.cigarette_count * ${column}) as value,
        MAX(CASE WHEN sl.log_date = CURDATE() THEN 1 ELSE 0 END) as hasSubmittedToday
      FROM Users u
      JOIN Smoking_Log sl ON u.user_id = sl.user_id
      JOIN Cigarette_Brand cb ON sl.brand_id = cb.brand_id
      WHERE sl.log_date >= ${dateFilter}
      GROUP BY u.user_id, u.user_name
      ORDER BY value ASC
      LIMIT 10
    `;

		const [rows] = await pool.query(query);

		// Add ranks and medals
		const ranked = rows.map((row, index) => ({
			...row,
			rank: index + 1,
			medal:
				index === 0
					? "gold"
					: index === 1
						? "silver"
						: index === 2
							? "bronze"
							: undefined,
			hasSubmittedToday: !!row.hasSubmittedToday,
		}));

		res.json(ranked);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};
