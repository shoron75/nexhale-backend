import fetch from "node-fetch";

const BASE_URL = "http://localhost:5000/api";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function verify() {
    console.log("Starting verification...");

    try {
        // 1. Register a test user
        const email = "verify" + Date.now() + "@test.com";
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "VerifyUser",
                email,
                password: "password123",
                preferredBrand: "Marlboro",
                preferredVapeFlavor: "Mango",
                preferredVapeLiquidAmount: 10
            }),
        });

        if (regRes.status !== 201) throw new Error("Registration failed: " + await regRes.text());
        const userData = await regRes.json();
        const { token, id } = userData;
        console.log("[PASS] User registered.");

        // 2. Check Profile Preference Persistence
        const profileRes = await fetch(`${BASE_URL}/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const profile = await profileRes.json();
        if (profile.preferredBrand === "Marlboro") {
            console.log("[PASS] Preference Brand persisted correctly.");
        } else {
            console.error("[FAIL] Preference Brand mismatch:", profile);
        }

        // 3. Log Vape Puffs (Check timestamp storage implicitly via logic)
        // We send a request WITHOUT date, expecting server to add it.
        const vapeRes = await fetch(`${BASE_URL}/quit-plan/log-vape`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                puffs: 50,
                liquidAmount: 2,
                flavor: "Mango",
                pgPercentage: 50,
                nicotineAmount: 5
            })
        });
        if (vapeRes.status === 200) console.log("[PASS] Vape log submitted.");
        else console.error("[FAIL] Vape log submission failed:", await vapeRes.text());

        // 4. Check Daily Stats (Immediate Update)
        // We fetch summary to see if the 50 puffs are there
        const summaryRes = await fetch(`${BASE_URL}/stats/summary`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const summary = await summaryRes.json();

        // Calculate expected logic: 50 puffs. 
        // CEI = puffs * (1 + pg + flavor). Flavor "Mango" (Fruit) = 0.3. PG (50) = 0.5 * liq(2).
        // Actually just checking if we verify ANY data is better than nothing, 
        // but let's check if 'dailyZone' or 'totalVapeCEI' is non-zero.
        // Also, checking if database actually has time would be good but we don't have direct DB access here easy.
        // relying on the fact that getSummary uses DATE(log_date) = CURDATE().

        if (parseFloat(summary.totalVapeCEI) > 0) {
            console.log(`[PASS] Daily stats updated immediately. CEI: ${summary.totalVapeCEI}`);
        } else {
            console.error("[FAIL] Daily stats did not update. CEI is 0.");
        }

        // 5. Check Leaderboard (Anonymized Names)
        // Add a smoking log to get on leaderboard
        await fetch(`${BASE_URL}/quit-plan/log`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                cigaretteCount: 10,
                brandId: 1,
                cost: 50
            })
        });

        const lbRes = await fetch(`${BASE_URL}/leaderboard?type=tar&period=daily`);
        const lb = await lbRes.json();
        const myEntry = lb.find(u => u.id === id);
        if (myEntry) {
            if (myEntry.name === `user-${id}`) {
                console.log(`[PASS] Leaderboard name anonymized: ${myEntry.name}`);
            } else {
                console.error(`[FAIL] Leaderboard name raw: ${myEntry.name}`);
            }
        } else {
            console.log("[WARN] User not found on leaderboard (might need more data/rank).");
            if (lb.length > 0 && lb[0].name.startsWith('user-')) {
                console.log(`[PASS] Leaderboard names look anonymized: ${lb[0].name}`);
            }
        }

    } catch (err) {
        console.error("Verification failed:", err);
        process.exit(1);
    }
}

verify();
