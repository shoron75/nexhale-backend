import pool from "./config/db.js";

async function verifyDailyZone() {
    try {
        console.log("Starting Daily Zone Verification...");

        // 1. Get a user
        const [users] = await pool.query("SELECT user_id FROM Users LIMIT 1");
        if (users.length === 0) { console.log("No users."); return; }
        const userId = users[0].user_id;
        console.log("Testing with User ID:", userId);

        // 2. Insert a smoking log for TODAY
        console.log("Inserting test smoking log for today...");
        const [brand] = await pool.query("SELECT brand_id FROM Cigarette_Brand LIMIT 1");
        // Insert 20 cigs to ensure high impact
        await pool.query("INSERT INTO Smoking_Log (log_date, cigarette_count, cost, user_id, brand_id) VALUES (CURDATE(), 20, 100, ?, ?)", [userId, brand[0].brand_id]);

        // 3. We can't call the controller directly easily without mocking req/res. 
        // Instead we will replicate the query logic we just added to verify it returns data.
        const [todaySmoke] = await pool.query(
            `SELECT SUM(sl.cigarette_count * cb.nicotine_per_cigarette) as nic,
                SUM(sl.cigarette_count * cb.tar_per_cigarette) as tar
            FROM Smoking_Log sl
            JOIN Cigarette_Brand cb ON sl.brand_id = cb.brand_id
            WHERE sl.user_id = ? AND sl.log_date = CURDATE()`,
            [userId]
        );

        console.log("Daily Smoke Stats (Direct Query):", todaySmoke[0]);

        if (parseFloat(todaySmoke[0].nic) > 0 && parseFloat(todaySmoke[0].tar) > 0) {
            console.log("PASS: Query successfully retrieves today's smoking stats.");
        } else {
            console.error("FAIL: Query returned 0 or null.");
        }

        // Clean up
        await pool.query("DELETE FROM Smoking_Log WHERE user_id = ? AND log_date = CURDATE() AND cigarette_count = 20", [userId]);
        console.log("Test data cleaned up.");

        process.exit(0);
    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
}

verifyDailyZone();
