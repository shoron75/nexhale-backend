import mysql from "mysql2/promise";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
	try {
		const dbName = process.env.DB_NAME || "Smoking_Analysis_System";

		// 1. Connect without database to create it if needed
		const connection = await mysql.createConnection({
			host: process.env.DB_HOST || "localhost",
			user: process.env.DB_USER || "root",
			password: process.env.DB_PASSWORD || "",
			multipleStatements: true,
		});

		console.log(`Ensuring database exists: ${dbName}...`);
		await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
		await connection.query(`USE \`${dbName}\`;`);

		console.log(`Applying schema to ${dbName}...`);
		const schemaPath = path.join(__dirname, "schema.sql");
		const schemaSql = await fs.readFile(schemaPath, "utf8");

		// Execute the entire schema
		await connection.query(schemaSql);

		console.log("Database and tables created successfully.");
		await connection.end();
	} catch (error) {
		console.error("Error setting up database:", error);
		process.exit(1);
	}
}

setupDatabase();
