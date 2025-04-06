// neuroforge/backend/src/server.js
// Purpose: Entry point - Creates HTTP server and starts listening
const http = require('http');
const { app, initializeWebSocket } = require('./app');
const config = require('./config');
const { connectDB } = require('./config/db');
const logger = require('./utils/logger');

// Connect to Databases
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket Server
initializeWebSocket(server);

// Start Listening
const PORT = config.port;
server.listen(PORT, () => {
    logger.info(`NeuroForge Backend Server running in ${config.nodeEnv} mode on port ${PORT}`);
    logger.info(`Awaiting commands... Ready to forge some neural pathways!`);
});

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err, promise) => {
    logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
    // Close server & exit process (optional but recommended)
    // server.close(() => process.exit(1));
});

// Handle SIGTERM for graceful shutdown (important for deployment environments)
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        // Close database connections here if necessary
        process.exit(0);
    });
});