import pool from "../config/db.js";

const cigaretteBrandsData = [
	{
		brand: "Benson & Hedges",
		variant: "Special Filter",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
	},
	{
		brand: "Benson & Hedges",
		variant: "Blue Gold",
		category: "Light / Blue",
		nicotineMg: "0.5–0.8",
		tarMg: "6–10",
	},
	{
		brand: "Benson & Hedges",
		variant: "Switch / Platinum",
		category: "Switch / Capsule",
		nicotineMg: "0.6–1.0",
		tarMg: "8–12",
	},
	{
		brand: "Gold Leaf",
		variant: "JP Gold Leaf",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
	},
	{
		brand: "John Player",
		variant: "Special",
		category: "Light / Blue",
		nicotineMg: "0.5–0.8",
		tarMg: "6–10",
	},
	{
		brand: "John Player",
		variant: "Switch",
		category: "Switch / Capsule",
		nicotineMg: "0.6–1.0",
		tarMg: "8–12",
	},
	{
		brand: "Lucky Strike",
		variant: "Original / Red",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
	},
	{
		brand: "Lucky Strike",
		variant: "Cool Crunch / Fresh Twist",
		category: "Switch / Capsule",
		nicotineMg: "0.6–1.0",
		tarMg: "8–12",
	},
	{
		brand: "Marlboro",
		variant: "Red",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
	},
	{
		brand: "Marlboro",
		variant: "Gold / Advance",
		category: "Light / Blue",
		nicotineMg: "0.5–0.8",
		tarMg: "6–10",
	},
	{
		brand: "Winston",
		variant: "Red",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
	},
	{
		brand: "Winston",
		variant: "Blue",
		category: "Light / Blue",
		nicotineMg: "0.5–0.8",
		tarMg: "6–10",
	},
	{
		brand: "Camel",
		variant: "Filter",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
	},
	{
		brand: "Camel",
		variant: "Blue",
		category: "Light / Blue",
		nicotineMg: "0.5–0.8",
		tarMg: "6–10",
	},
	{
		brand: "Pall Mall",
		variant: "Full Flavor",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
	},
	{
		brand: "Pall Mall",
		variant: "Smooth / Blue",
		category: "Light / Blue",
		nicotineMg: "0.5–0.8",
		tarMg: "6–10",
	},
	{
		brand: "Star",
		variant: "Star Filter",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
	},
	{
		brand: "Derby",
		variant: "Full Flavor",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
	},
	{
		brand: "Derby",
		variant: "Style",
		category: "Light / Blue",
		nicotineMg: "0.5–0.8",
		tarMg: "6–10",
	},
	{
		brand: "Royals",
		variant: "Gold / Next",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
	},
	{
		brand: "Sheikh",
		variant: "Sheikh Filter",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
	},
	{
		brand: "Navy",
		variant: "Navy Regular",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
	},
	{
		brand: "Hollywood",
		variant: "Blue / Red",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
	},
	{
		brand: "Pilot",
		variant: "Pilot Filter",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
	},
	{
		brand: "Marise",
		variant: "Special Blend",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
	},
	{
		brand: "Other",
		variant: "Custom",
		category: "Unknown",
		nicotineMg: "0.5–1.2",
		tarMg: "6–14",
	},
];

async function seed() {
	try {
		console.log("Starting seeding process...");

		// 1. Seed Leaderboard
		const [leaderboardCount] = await pool.query(
			"SELECT COUNT(*) as count FROM Leaderboard",
		);
		if (leaderboardCount[0].count === 0) {
			console.log("Seeding Leaderboard...");
			await pool.query(
				"INSERT INTO Leaderboard (period_type, `rank`, badge_type) VALUES ?",
				[
					[
						["Daily", 1, "Gold"],
						["Daily", 2, "Silver"],
						["Daily", 3, "Bronze"],
						["Monthly", 1, "Platinum"],
						["Monthly", 2, "Gold"],
					],
				],
			);
		}

		// 2. Seed Moods
		const [moodCount] = await pool.query("SELECT COUNT(*) as count FROM Mood");
		if (moodCount[0].count === 0) {
			console.log("Seeding Moods...");
			const moods = [
				"Happy",
				"Stressed",
				"Anxious",
				"Relaxed",
				"Depressed",
				"Angry",
				"Tired",
				"Focused",
				"Lonely",
			];
			await pool.query("INSERT INTO Mood (mood_type) VALUES ?", [
				moods.map((m) => [m]),
			]);
		}

		// 3. Seed Health Impact
		const [impactCount] = await pool.query(
			"SELECT COUNT(*) as count FROM Health_Impact",
		);
		if (impactCount[0].count === 0) {
			console.log("Seeding Health Impact...");
			const healthImpacts = [
				[1, 0, 1500, 0, 120, 10, "Safe / Monitoring"],
				[2, 1501, 3000, 121, 250, 25, "Monitoring"],
				[3, 3001, 4500, 251, 380, 40, "Elevated"],
				[4, 4501, 6000, 381, 500, 60, "High"],
				[5, 6001, 8000, 501, 650, 80, "Critical"],
				[6, 8001, 999999, 651, 999999, 95, "Emergency"],
			];
			await pool.query(
				"INSERT INTO Health_Impact (impact_id, tar_min, tar_max, nicotine_min, nicotine_max, risk_percentage, risk_tier) VALUES ?",
				[healthImpacts],
			);

			console.log("Seeding Health Impact Details...");
			const details = [
				[
					1,
					"Behavioral",
					"Statistical likelihood of airway irritation is minimal; lung recovery remains highly active.",
				],
				[
					1,
					"Addiction",
					"Low impact on brain chemistry; usage is likely situational rather than a physical requirement.",
				],
				[
					2,
					"Behavioral",
					"Possible early probability of throat dryness or statistical decrease in peak athletic stamina.",
				],
				[
					2,
					"Addiction",
					"Moderate behavioral impact; daily routines begin to statistically align with specific vaping times.",
				],
				[
					3,
					"Behavioral",
					"Increased statistical probability of cardiovascular strain; heart rate may remain elevated longer.",
				],
				[
					3,
					"Addiction",
					"High addiction potential; statistical likelihood of cravings or restlessness if vaping is delayed.",
				],
				[
					4,
					"Behavioral",
					"Significant statistical probability of persistent airway stress; body’s self-cleaning efficiency may be hampered.",
				],
				[
					4,
					"Addiction",
					"Very high addiction impact; behavioral patterns frequently dictated by the brain’s chemical requirement.",
				],
				[
					5,
					"Behavioral",
					"High statistical likelihood of chronic respiratory strain and consistent stress on the heart and blood vessels.",
				],
				[
					5,
					"Addiction",
					"Extreme addiction impact; statistical data suggests vaping occurs frequently throughout the day; high dependency.",
				],
				[
					6,
					"Behavioral",
					"Severe statistical probability of long-term lung fatigue; physical capacity is likely consistently compromised.",
				],
				[
					6,
					"Addiction",
					"Maximum addiction impact; daily behavior is almost entirely focused on maintaining nicotine levels.",
				],
			];
			await pool.query(
				"INSERT INTO Health_Impact_Detail (impact_id, impact_type, impact_description) VALUES ?",
				[details],
			);
		}

		// 4. Seed Cigarette Brands
		const [brandCount] = await pool.query(
			"SELECT COUNT(*) as count FROM Cigarette_Brand",
		);
		if (brandCount[0].count === 0) {
			console.log("Seeding Cigarette Brands...");
			const parseRange = (val) => {
				if (!val) return 0;
				const parts = val.toString().split(/[–-]/);
				if (parts.length === 2) {
					return (parseFloat(parts[0]) + parseFloat(parts[1])) / 2;
				}
				return parseFloat(val);
			};

			const brandValues = cigaretteBrandsData.map((item) => [
				item.brand,
				item.variant,
				item.category,
				parseRange(item.nicotineMg),
				parseRange(item.tarMg),
			]);

			await pool.query(
				"INSERT INTO Cigarette_Brand (brand_name, variant, category, nicotine_per_cigarette, tar_per_cigarette) VALUES ?",
				[brandValues],
			);
		}

		console.log("Seeding completed successfully.");
	} catch (error) {
		console.error("Error during seeding:", error);
		throw error;
	}
}

export default seed;
