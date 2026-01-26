import pool from './config/db.js';

const migrate = async () => {
    try {
        console.log('Starting migration...');

        // Alter Smoking_Log
        try {
            await pool.query("ALTER TABLE Smoking_Log MODIFY COLUMN log_date DATETIME");
            console.log('Successfully altered Smoking_Log table.');
        } catch (err) {
            console.error('Error altering Smoking_Log:', err.message);
        }

        // Alter Vape_Log
        try {
            await pool.query("ALTER TABLE Vape_Log MODIFY COLUMN log_date DATETIME");
            console.log('Successfully altered Vape_Log table.');
        } catch (err) {
            console.error('Error altering Vape_Log:', err.message);
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
