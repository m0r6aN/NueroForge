// neuroforge/backend/src/config/db.js
// Purpose: Handles database connections
const mongoose = require('mongoose');
const sql = require('mssql');
const config = require('./index');
const logger = require('../utils/logger'); // Assume a basic logger exists

const connectDB = async () => {
    try {
        // Connect to MongoDB (Azure Cosmos DB)
        await mongoose.connect(config.mongoUri);
        logger.info('MongoDB Connected via Mongoose...');

        // Connect to Azure SQL Database
        const sqlConfig = {
            user: config.sql.user,
            password: config.sql.password,
            server: config.sql.server,
            database: config.sql.database,
            options: config.sql.options,
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            }
        };
        await sql.connect(sqlConfig);
        logger.info('Azure SQL Database Connected...');

    } catch (err) {
        logger.error('Database Connection Error:', err.message);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = { connectDB, sql }; // Export SQL pool for direct use if needed