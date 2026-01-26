import pool from "../config/db.js";

// Data derived from frontend/src/data/cigaretteBrands.ts
// I've copied the data array structure here.

const cigaretteBrandsData = [
	{
		brand: "Benson & Hedges",
		variant: "Special Filter",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
		company: "BATB",
		displayName: "Benson & Hedges - Special Filter - Full Flavor",
	},
	{
		brand: "Benson & Hedges",
		variant: "Blue Gold",
		category: "Light / Blue",
		nicotineMg: "0.5–0.8",
		tarMg: "6–10",
		company: "BATB",
		displayName: "Benson & Hedges - Blue Gold - Light / Blue",
	},
	{
		brand: "Benson & Hedges",
		variant: "Switch / Platinum",
		category: "Switch / Capsule",
		nicotineMg: "0.6–1.0",
		tarMg: "8–12",
		company: "BATB",
		displayName: "Benson & Hedges - Switch / Platinum - Switch / Capsule",
	},
	{
		brand: "Gold Leaf",
		variant: "JP Gold Leaf",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
		company: "BATB",
		displayName: "Gold Leaf - JP Gold Leaf - Full Flavor",
	},
	{
		brand: "John Player",
		variant: "Special",
		category: "Light / Blue",
		nicotineMg: "0.5–0.8",
		tarMg: "6–10",
		company: "BATB",
		displayName: "John Player - Special - Light / Blue",
	},
	{
		brand: "John Player",
		variant: "Switch",
		category: "Switch / Capsule",
		nicotineMg: "0.6–1.0",
		tarMg: "8–12",
		company: "BATB",
		displayName: "John Player - Switch - Switch / Capsule",
	},
	{
		brand: "Lucky Strike",
		variant: "Original / Red",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
		company: "BATB",
		displayName: "Lucky Strike - Original / Red - Full Flavor",
	},
	{
		brand: "Lucky Strike",
		variant: "Cool Crunch / Fresh Twist",
		category: "Switch / Capsule",
		nicotineMg: "0.6–1.0",
		tarMg: "8–12",
		company: "BATB",
		displayName:
			"Lucky Strike - Cool Crunch / Fresh Twist - Switch / Capsule",
	},
	{
		brand: "Marlboro",
		variant: "Red",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
		company: "JTI",
		displayName: "Marlboro - Red - Full Flavor",
	},
	{
		brand: "Marlboro",
		variant: "Gold / Advance",
		category: "Light / Blue",
		nicotineMg: "0.5–0.8",
		tarMg: "6–10",
		company: "JTI",
		displayName: "Marlboro - Gold / Advance - Light / Blue",
	},
	{
		brand: "Winston",
		variant: "Red",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
		company: "JTI",
		displayName: "Winston - Red - Full Flavor",
	},
	{
		brand: "Winston",
		variant: "Blue",
		category: "Light / Blue",
		nicotineMg: "0.5–0.8",
		tarMg: "6–10",
		company: "JTI",
		displayName: "Winston - Blue - Light / Blue",
	},
	{
		brand: "Camel",
		variant: "Filter",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
		company: "JTI",
		displayName: "Camel - Filter - Full Flavor",
	},
	{
		brand: "Camel",
		variant: "Blue",
		category: "Light / Blue",
		nicotineMg: "0.5–0.8",
		tarMg: "6–10",
		company: "JTI",
		displayName: "Camel - Blue - Light / Blue",
	},
	{
		brand: "Pall Mall",
		variant: "Full Flavor",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
		company: "BATB",
		displayName: "Pall Mall - Full Flavor - Full Flavor",
	},
	{
		brand: "Pall Mall",
		variant: "Smooth / Blue",
		category: "Light / Blue",
		nicotineMg: "0.5–0.8",
		tarMg: "6–10",
		company: "BATB",
		displayName: "Pall Mall - Smooth / Blue - Light / Blue",
	},
	{
		brand: "Star",
		variant: "Star Filter",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
		company: "BATB",
		displayName: "Star - Star Filter - Full Flavor",
	},
	{
		brand: "Derby",
		variant: "Full Flavor",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
		company: "BATB",
		displayName: "Derby - Full Flavor - Full Flavor",
	},
	{
		brand: "Derby",
		variant: "Style",
		category: "Light / Blue",
		nicotineMg: "0.5–0.8",
		tarMg: "6–10",
		company: "BATB",
		displayName: "Derby - Style - Light / Blue",
	},
	{
		brand: "Royals",
		variant: "Gold / Next",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
		company: "BATB",
		displayName: "Royals - Gold / Next - Full Flavor",
	},
	{
		brand: "Sheikh",
		variant: "Sheikh Filter",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
		company: "JTI",
		displayName: "Sheikh - Sheikh Filter - Full Flavor",
	},
	{
		brand: "Navy",
		variant: "Navy Regular",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
		company: "JTI",
		displayName: "Navy - Navy Regular - Full Flavor",
	},
	{
		brand: "Hollywood",
		variant: "Blue / Red",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
		company: "BATB",
		displayName: "Hollywood - Blue / Red - Full Flavor",
	},
	{
		brand: "Pilot",
		variant: "Pilot Filter",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
		company: "BATB",
		displayName: "Pilot - Pilot Filter - Full Flavor",
	},
	{
		brand: "Marise",
		variant: "Special Blend",
		category: "Full Flavor",
		nicotineMg: "0.8–1.2",
		tarMg: "10–14",
		company: "Abul Khair Tobacco",
		displayName: "Marise - Special Blend - Full Flavor",
	},
	{
		brand: "Other",
		variant: "Custom",
		category: "Unknown",
		nicotineMg: "0.5–1.2",
		tarMg: "6–14",
		company: "Various",
		displayName: "Other",
	},
];

async function seedBrands() {
	try {
		console.log("Seeding cigarette brands...");

		// Clear existing
		await pool.query("TRUNCATE TABLE Cigarette_Brand");

		const query = `
      INSERT INTO Cigarette_Brand 
      (brand_name, variant, category, nicotine_per_cigarette, tar_per_cigarette) 
      VALUES ?
    `;

		// Helper to parse "0.8-1.2" or "10" to average
		const parseRange = (val) => {
			if (!val) return 0;
			const parts = val.toString().split(/[–-]/); // split by en-dash or hyphen
			if (parts.length === 2) {
				return (parseFloat(parts[0]) + parseFloat(parts[1])) / 2;
			}
			return parseFloat(val);
		};

		const values = cigaretteBrandsData.map((item) => [
			item.brand,
			item.variant,
			item.category,
			parseRange(item.nicotineMg),
			parseRange(item.tarMg),
		]);

		await pool.query(query, [values]);

		console.log(`Seeded ${values.length} brands successfully.`);
		process.exit(0);
	} catch (error) {
		console.error("Error seeding data:", error);
		process.exit(1);
	}
}

seedBrands();
