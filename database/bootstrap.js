import mysql from "mysql2/promise";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import seed from "./seed.js";
import seedDemoData from "./seed_demo.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function bootstrapDatabase() {
    try {
        const dbName = process.env.DB_NAME || "Smoking_Analysis_System";

        console.log("Starting database bootstrap...");

        // 1. Ensure database exists
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            multipleStatements: true,
        });

        console.log(`Ensuring database '${dbName}' exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        await connection.close();

        // 2. Apply schema (idempotent)
        const dbConnection = await mysql.createConnection({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            database: dbName,
            multipleStatements: true,
        });

        console.log("Applying schema...");
        const schemaPath = path.join(__dirname, "schema.sql");
        const schemaSql = await fs.readFile(schemaPath, "utf8");
        await dbConnection.query(schemaSql);
        await dbConnection.close();

        // 3. Run seeds (idempotent)
        await seed();

        // 4. Run demo seeds (idempotent check inside)
        await seedDemoData();

        console.log("Database bootstrap completed successfully.");
    } catch (error) {
        console.error("Database bootstrap failed:", error);
        // Don't exit process here if called from server.js
        throw error;
    }
}

// If run directly
if (process.argv[1] === __filename) {
    bootstrapDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
