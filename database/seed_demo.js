import pool from "../config/db.js";
import bcrypt from "bcrypt";

function DATE_SUB(date, days) {
	const d = new Date(date);
	d.setDate(d.getDate() - days);
	return d.toISOString().split("T")[0];
}

function DATE_ADD(date, days) {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d.toISOString().split("T")[0];
}

async function seedDemoData() {
	try {
		console.log(
			"Starting expanded demo data seeding (Multiple Users - 6 Months Historical Data)...",
		);

		const demoUsers = [
			{
				name: "Samin Yasar",
				email: "demo@example.com",
				flavor: "Mint",
				brandId: 9,
				avgCigs: 5,
				avgPuffs: 30,
			},
			{
				name: "Arif Ahmed",
				email: "arif@example.com",
				flavor: "Mango",
				brandId: 1,
				avgCigs: 2,
				avgPuffs: 10,
			},
			{
				name: "Sadia Islam",
				email: "sadia@example.com",
				flavor: "Tobacco",
				brandId: 4,
				avgCigs: 12,
				avgPuffs: 0,
			},
			{
				name: "Rakibul Islam",
				email: "rakib@example.com",
				flavor: "Blueberry",
				brandId: 10,
				avgCigs: 0,
				avgPuffs: 100,
			},
			{
				name: "Nusrat Jahan",
				email: "nusrat@example.com",
				flavor: "Grape",
				brandId: 12,
				avgCigs: 8,
				avgPuffs: 20,
			},
			{
				name: "Tanvir Hossain",
				email: "tanvir@example.com",
				flavor: "Watermelon",
				brandId: 7,
				avgCigs: 15,
				avgPuffs: 50,
			},
			{
				name: "Mehedi Hasan",
				email: "mehedi@example.com",
				flavor: "Mint",
				brandId: 3,
				avgCigs: 1,
				avgPuffs: 5,
			},
			{
				name: "Zarin Tasnim",
				email: "zarin@example.com",
				flavor: "Strawberry",
				brandId: 11,
				avgCigs: 4,
				avgPuffs: 40,
			},
			{
				name: "Farhan Ahmed",
				email: "farhan@example.com",
				flavor: "Vanilla",
				brandId: 2,
				avgCigs: 3,
				avgPuffs: 15,
			},
			{
				name: "Abir Hasan",
				email: "abir@example.com",
				flavor: "Mango",
				brandId: 5,
				avgCigs: 6,
				avgPuffs: 25,
			},
		];

		const hashedPassword = await bcrypt.hash("demo123", 10);
		const moods = await pool.query("SELECT mood_id FROM Mood");
		const moodIds = moods[0].map((m) => m.mood_id);

		for (const userData of demoUsers) {
			console.log(
				`Processing user: ${userData.name} (${userData.email})`,
			);

			// 1. Create or Get User
			const [existing] = await pool.query(
				"SELECT * FROM Users WHERE email = ?",
				[userData.email],
			);
			let userId;
			if (existing.length === 0) {
				const [result] = await pool.query(
					"INSERT INTO Users (user_name, email, pass, registration_date) VALUES (?, ?, ?, DATE_SUB(CURDATE(), INTERVAL 185 DAY))",
					[userData.name, userData.email, hashedPassword],
				);
				userId = result.insertId;
			} else {
				userId = existing[0].user_id;

				// Skip if user already has many logs (assuming already seeded)
				const [logCount] = await pool.query(
					"SELECT COUNT(*) as count FROM Smoking_Log WHERE user_id = ?",
					[userId],
				);
				if (logCount[0].count > 50) {
					console.log(
						`User ${userData.email} already has demo data. Skipping.`,
					);
					continue;
				}
			}

			// 2. Create Quit Plan
			await pool.query(
				"INSERT INTO Quit_Plan (target_nicotine_amount, starting_date, end_date, alert, current_status, user_id) VALUES (?, ?, ?, ?, ?, ?)",
				[
					400.0,
					DATE_SUB(new Date(), 180),
					DATE_ADD(new Date(), 30),
					1,
					"In Progress",
					userId,
				],
			);

			// 3. Generate 180 days of logs (approx 6 months)
			console.log(`Generating 180 days of logs for ${userData.name}...`);
			const smokingLogs = [];
			const vapeLogs = [];

			for (let i = 0; i <= 180; i++) {
				const date = new Date();
				date.setDate(date.getDate() - i);
				const dateString = date.toISOString().split("T")[0];

				// Smoking Logs
				if (userData.avgCigs > 0) {
					// Add some variance and slight downward trend if on a quit plan
					const trend = 1 - (180 - i) / 360; // range 0.5 to 1.0 (reversing i, so oldest i=180 gives 1.0, newest i=0 gives 0.5)
					// Wait, i=0 is today. i=180 is 6 months ago.
					// We want it to decrease as we approach today.
					const quitFactor = 1 - (180 - i) / 360; // if i=180 (oldest), factor=1. if i=0 (today), factor=0.5
					const count = Math.max(
						0,
						Math.floor(
							(userData.avgCigs +
								Math.floor(Math.random() * 5) -
								2) *
							quitFactor,
						),
					);
					if (count > 0) {
						smokingLogs.push([
							dateString,
							count,
							count * 15,
							userId,
							userData.brandId,
						]);
					}
				}

				// Vape Logs
				if (userData.avgPuffs > 0) {
					const puffs = Math.max(
						0,
						userData.avgPuffs + Math.floor(Math.random() * 20) - 10,
					);
					if (puffs > 0) {
						const liquid =
							(puffs / 100) * (0.8 + Math.random() * 0.4);
						vapeLogs.push([
							dateString,
							puffs,
							liquid,
							liquid * 20,
							userData.flavor,
							50,
							userId,
						]);
					}
				}
			}

			// Batch insert for performance
			if (smokingLogs.length > 0) {
				const [res] = await pool.query(
					"INSERT INTO Smoking_Log (log_date, cigarette_count, cost, user_id, brand_id) VALUES ?",
					[smokingLogs],
				);
				// Randomly associate moods for some logs
				const smokeInsertId = res.insertId;
				const moodAssoc = [];
				for (let j = 0; j < smokingLogs.length; j += 5) {
					// every 5th log
					const moodId =
						moodIds[Math.floor(Math.random() * moodIds.length)];
					moodAssoc.push([moodId, smokeInsertId + j]);
				}
				if (moodAssoc.length > 0) {
					await pool.query(
						"INSERT IGNORE INTO Mood_Log_Associated (mood_id, log_id) VALUES ?",
						[moodAssoc],
					);
				}
			}

			if (vapeLogs.length > 0) {
				const [res] = await pool.query(
					"INSERT INTO Vape_Log (log_date, puffs, liquid_amount, nicotine_amount, flavor, pg_percentage, user_id) VALUES ?",
					[vapeLogs],
				);
				// Randomly associate moods
				const vapeInsertId = res.insertId;
				const moodAssocV = [];
				for (let k = 0; k < vapeLogs.length; k += 5) {
					const moodId =
						moodIds[Math.floor(Math.random() * moodIds.length)];
					moodAssocV.push([moodId, vapeInsertId + k]);
				}
				if (moodAssocV.length > 0) {
					await pool.query(
						"INSERT IGNORE INTO Mood_Vape_Associated (mood_id, vape_log_id) VALUES ?",
						[moodAssocV],
					);
				}
			}
		}

		console.log("Demo data seeded for 10 users successfully (6 months)!");
	} catch (error) {
		console.error("Seeding demo data failed:", error);
		throw error;
	}
}

// If run directly
const isDirectRun =
	process.argv[1] &&
	(process.argv[1].endsWith("seed_demo.js") ||
		process.argv[1].endsWith("seed_demo.js"));
if (isDirectRun) {
	seedDemoData()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}

export default seedDemoData;
