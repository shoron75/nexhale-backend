import pool from "./config/db.js";

async function migrate() {
	try {
		console.log("Starting migration: Updating Quit_Plan table...");

		const [columns] = await pool.query("SHOW COLUMNS FROM Quit_Plan");
		const columnNames = columns.map((c) => c.Field);

		const additions = [
			{ name: "target_timeline_months", type: "INT DEFAULT 1" },
			{ name: "starting_nicotine_mg", type: "DECIMAL(10,2) DEFAULT 0" },
			{
				name: "daily_nicotine_allowance_mg",
				type: "DECIMAL(10,2) DEFAULT 0",
			},
			{ name: "selected_brand_id", type: "INT" },
			{
				name: "selected_brand_type",
				type: "ENUM('Cigarette', 'Vape') DEFAULT 'Cigarette'",
			},
		];

		for (const col of additions) {
			if (!columnNames.includes(col.name)) {
				console.log(`Adding column: ${col.name}`);
				await pool.query(
					`ALTER TABLE Quit_Plan ADD COLUMN ${col.name} ${col.type}`,
				);
			} else {
				console.log(`Column ${col.name} already exists.`);
			}
		}

		console.log("Migration completed successfully!");
		process.exit(0);
	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	}
}

migrate();
