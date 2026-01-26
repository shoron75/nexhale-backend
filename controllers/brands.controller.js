import pool from "../config/db.js";

export const getBrands = async (req, res) => {
	try {
		const [rows] = await pool.query("SELECT * FROM Cigarette_Brand");
		res.json(
			rows.map((row) => ({
				id: row.brand_id,
				brand: row.brand_name,
				variant: row.variant,
				category: row.category,
				nicotineMg: row.nicotine_per_cigarette,
				tarMg: row.tar_per_cigarette,
				displayName: `${row.brand_name} - ${row.variant} - ${row.category}`,
			})),
		);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};
