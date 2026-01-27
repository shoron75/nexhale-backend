import pool from "./config/db.js";

async function verify() {
	try {
		console.log("Verifying database changes...");

		// 1. Check Vape_Brand table
		const [tables] = await pool.query("SHOW TABLES LIKE 'Vape_Brand'");
		if (tables.length > 0) {
			console.log("✅ Vape_Brand table exists.");
		} else {
			console.error("❌ Vape_Brand table MISSING.");
		}

		// 2. Check Vape_Log brand_id column
		const [columns] = await pool.query(
			"SHOW COLUMNS FROM Vape_Log LIKE 'brand_id'",
		);
		if (columns.length > 0) {
			console.log("✅ Vape_Log has brand_id column.");
		} else {
			console.error("❌ Vape_Log brand_id column MISSING.");
		}

		// 3. Check for seeds
		const [count] = await pool.query(
			"SELECT COUNT(*) as count FROM Vape_Brand",
		);
		console.log(`ℹ️ Number of vape brands: ${count[0].count}`);
		if (count[0].count > 0) {
			console.log("✅ Vape_Brand is seeded.");
		} else {
			console.error("❌ Vape_Brand is EMPTY.");
		}

		process.exit(0);
	} catch (error) {
		console.error("Verification failed:", error);
		process.exit(1);
	}
}

verify();
