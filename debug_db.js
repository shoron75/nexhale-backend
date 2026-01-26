import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

async function check() {
    try {
        const con = await mysql.createConnection({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
        });
        const [rows] = await con.query("SHOW DATABASES");
        console.log("Databases:", rows.map(r => r.Database));
        await con.end();
    } catch (e) {
        console.error(e);
    }
}
check();
