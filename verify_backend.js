import fetch from "node-fetch";

const BASE_URL = "http://localhost:5000/api";

async function verify() {
	console.log("Starting verification with new schema...");

	try {
		// 1. Health check
		const rootRes = await fetch("http://localhost:5000/");
		console.log("Health check:", await rootRes.text());

		// 2. Fetch brands (Check mapping)
		const brandsRes = await fetch(`${BASE_URL}/brands`);
		const brands = await brandsRes.json();
		console.log(`Fetched ${brands.length} brands.`);
		if (brands.length > 0) {
			console.log("Sample brand:", brands[0]);
		}

		// 3. Register a test user
		const regRes = await fetch(`${BASE_URL}/auth/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				username: "newuser",
				email: "test" + Date.now() + "@example.com",
				password: "password123",
			}),
		});
		const userData = await regRes.json();
		console.log("Register status:", regRes.status);

		if (regRes.status !== 201) {
			console.error(
				"Registration failed:",
				userData.message,
				userData.detail || "",
			);
			return;
		}

		const { token, id: userId } = userData;
		console.log("User registered, ID:", userId);

		// 4. Update quit plan
		const planRes = await fetch(`${BASE_URL}/quit-plan`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ nicotineLimit: 750 }),
		});
		console.log("Update plan status:", planRes.status);

		// 5. Log progress (New structure)
		const logRes = await fetch(`${BASE_URL}/quit-plan/log`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				date: new Date().toISOString().split("T")[0],
				cigaretteCount: 5,
				brandId: 1, // Benson & Hedges Special Filter
				cost: 60,
			}),
		});
		console.log("Log progress status:", logRes.status);

		// 6. Get progress (Calculated with join)
		const progRes = await fetch(`${BASE_URL}/quit-plan`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		const progData = await progRes.json();
		console.log("Current plan & progress:", progData);
	} catch (error) {
		console.error("Verification failed:", error.message);
		console.log(
			"\nMake sure the server is running (npm run dev) and the database is configured in .env",
		);
	}
}

verify();
