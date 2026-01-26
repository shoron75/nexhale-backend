import pool from "../config/db.js";
import bcrypt from "bcrypt";

async function seedDemoData() {
	try {
		console.log(
			"Starting expanded demo data seeding (Multiple Users - Localized)...",
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
					"INSERT INTO Users (user_name, email, pass, registration_date) VALUES (?, ?, ?, DATE_SUB(CURDATE(), INTERVAL 65 DAY))",
					[userData.name, userData.email, hashedPassword],
				);
				userId = result.insertId;
			} else {
				userId = existing[0].user_id;
			}

			// 2. Clear existing logs for this user
			await pool.query(
				"DELETE FROM Mood_Log_Associated WHERE log_id IN (SELECT log_id FROM Smoking_Log WHERE user_id = ?)",
				[userId],
			);
			await pool.query(
				"DELETE FROM Mood_Vape_Associated WHERE vape_log_id IN (SELECT vape_log_id FROM Vape_Log WHERE user_id = ?)",
				[userId],
			);
			await pool.query("DELETE FROM Smoking_Log WHERE user_id = ?", [
				userId,
			]);
			await pool.query("DELETE FROM Vape_Log WHERE user_id = ?", [
				userId,
			]);
			await pool.query("DELETE FROM Quit_Plan WHERE user_id = ?", [
				userId,
			]);

			// 3. Create Quit Plan
			await pool.query(
				"INSERT INTO Quit_Plan (target_nicotine_amount, starting_date, end_date, alert, current_status, user_id) VALUES (?, ?, ?, ?, ?, ?)",
				[
					400.0,
					DATE_SUB(new Date(), 60),
					DATE_ADD(new Date(), 30),
					1,
					"In Progress",
					userId,
				],
			);

			// 4. Generate 60 days of logs
			for (let i = 0; i <= 60; i++) {
				const date = new Date();
				date.setDate(date.getDate() - i);
				const dateString = date.toISOString().split("T")[0];

				// Smoking Logs
				if (userData.avgCigs > 0) {
					const count = Math.max(
						0,
						userData.avgCigs + Math.floor(Math.random() * 5) - 2,
					);
					if (count > 0) {
						const [smokeResult] = await pool.query(
							"INSERT INTO Smoking_Log (log_date, cigarette_count, cost, user_id, brand_id) VALUES (?, ?, ?, ?, ?)",
							[
								dateString,
								count,
								count * 15,
								userId,
								userData.brandId,
							],
						);
						if (Math.random() > 0.5) {
							const moodId =
								moodIds[
									Math.floor(Math.random() * moodIds.length)
								];
							await pool.query(
								"INSERT INTO Mood_Log_Associated (mood_id, log_id) VALUES (?, ?)",
								[moodId, smokeResult.insertId],
							);
						}
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
						const [vapeResult] = await pool.query(
							"INSERT INTO Vape_Log (log_date, puffs, liquid_amount, nicotine_amount, flavor, pg_percentage, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
							[
								dateString,
								puffs,
								liquid,
								liquid * 20,
								userData.flavor,
								50,
								userId,
							],
						);
						if (Math.random() > 0.5) {
							const moodId =
								moodIds[
									Math.floor(Math.random() * moodIds.length)
								];
							await pool.query(
								"INSERT INTO Mood_Vape_Associated (mood_id, vape_log_id) VALUES (?, ?)",
								[moodId, vapeResult.insertId],
							);
						}
					}
				}
			}
		}

		console.log("Demo data seeded for 10 localized users successfully!");
		process.exit(0);
	} catch (error) {
		console.error("Seeding failed:", error);
		process.exit(1);
	}
}

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

seedDemoData();
