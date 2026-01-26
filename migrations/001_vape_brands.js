import pool from "../config/db.js";

const vapeBrandsData = [
    {
        name: "Disposable (Standard)",
        type: "Disposable",
        nicotine_per_ml: 50.0, // 5%
        avg_puffs_per_ml: 300,
    },
    {
        name: "Disposable (Low Nic)",
        type: "Disposable",
        nicotine_per_ml: 20.0, // 2%
        avg_puffs_per_ml: 300,
    },
    {
        name: "Pod System (High Str)",
        type: "Pod",
        nicotine_per_ml: 50.0, // 50mg/5%
        avg_puffs_per_ml: 200,
    },
    {
        name: "Pod System (Med Str)",
        type: "Pod",
        nicotine_per_ml: 25.0, // 25mg/2.5%
        avg_puffs_per_ml: 200,
    },
    {
        name: "Mod / Tank (Freebase High)",
        type: "Mod",
        nicotine_per_ml: 12.0, // 12mg
        avg_puffs_per_ml: 100, // Higher consumption
    },
    {
        name: "Mod / Tank (Freebase Med)",
        type: "Mod",
        nicotine_per_ml: 6.0, // 6mg
        avg_puffs_per_ml: 100,
    },
    {
        name: "Mod / Tank (Freebase Low)",
        type: "Mod",
        nicotine_per_ml: 3.0, // 3mg
        avg_puffs_per_ml: 100,
    },
    {
        name: "Zero Nicotine",
        type: "Any",
        nicotine_per_ml: 0.0,
        avg_puffs_per_ml: 200,
    }
];

async function migrate() {
    try {
        console.log("Starting migration: 001_vape_brands...");

        // 1. Create Vape_Brand TABLE
        await pool.query(`
      CREATE TABLE IF NOT EXISTS Vape_Brand (
        brand_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        type VARCHAR(50),
        nicotine_per_ml DECIMAL(5,2),
        avg_puffs_per_ml INT
      )
    `);
        console.log("Vape_Brand table created/verified.");

        // 2. Add brand_id to Vape_Log if not exists
        // We check columns first to avoid error
        const [columns] = await pool.query(`SHOW COLUMNS FROM Vape_Log LIKE 'brand_id'`);
        if (columns.length === 0) {
            await pool.query(`ALTER TABLE Vape_Log ADD COLUMN brand_id INT`);
            await pool.query(`ALTER TABLE Vape_Log ADD FOREIGN KEY (brand_id) REFERENCES Vape_Brand(brand_id)`);
            console.log("Added brand_id column to Vape_Log.");
        } else {
            console.log("brand_id column already exists in Vape_Log.");
        }

        // 3. Seed Vape Brands
        const [count] = await pool.query("SELECT COUNT(*) as count FROM Vape_Brand");
        if (count[0].count === 0) {
            console.log("Seeding Vape Brands...");
            const values = vapeBrandsData.map(b => [b.name, b.type, b.nicotine_per_ml, b.avg_puffs_per_ml]);
            await pool.query(
                "INSERT INTO Vape_Brand (name, type, nicotine_per_ml, avg_puffs_per_ml) VALUES ?",
                [values]
            );
            console.log("Vape Brands seeded.");
        } else {
            console.log("Vape Brands already seeded.");
        }

        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
