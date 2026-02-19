import pool from "./config/db.js";
import { getSummary } from "./controllers/stats.controller.js";

async function verify() {
	try {
		console.log("Verifying getSummary output...");

		// Mock request and response
		const req = {
			user: { id: 11 }, // Example user ID from the error message
			query: {},
		};
		const res = {
			json: (data) => {
				console.log("API Response:", JSON.stringify(data, null, 2));
				if (
					data.totalPuffs !== undefined &&
					data.totalLiquid !== undefined
				) {
					console.log("✅ totalPuffs and totalLiquid are present.");
				} else {
					console.error("❌ totalPuffs or totalLiquid MISSING.");
				}
				if (parseFloat(data.totalTar) >= 0) {
					console.log(`✅ totalTar is ${data.totalTar}`);
				}
			},
			status: (code) => ({
				json: (err) => console.error(`Error ${code}:`, err),
			}),
		};

		await getSummary(req, res);
		process.exit(0);
	} catch (error) {
		console.error("Verification failed:", error);
		process.exit(1);
	}
}

verify();
