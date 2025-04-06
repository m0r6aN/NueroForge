// neuroforge/backend/src/utils/logger.js
// Purpose: Basic console logger with levels
const config = require('../config');

// Simple console logger - replace with Winston or Pino for production
const logger = {
    info: (message, ...args) => {
        console.log(`[INFO] ${new Date().toISOString()}: ${message}`, ...args);
    },
    warn: (message, ...args) => {
        console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, ...args);
    },
    error: (message, ...args) => {
        // Log stack trace for Error objects
        if (args.length > 0 && args[0] instanceof Error) {
             console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, args[0]);
        } else if (message instanceof Error) {
             console.error(`[ERROR] ${new Date().toISOString()}:`, message);
        }
         else {
            console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, ...args);
        }
    },
    debug: (message, ...args) => {
        if (config.nodeEnv === 'development') {
            console.debug(`[DEBUG] ${new Date().toISOString()}: ${message}`, ...args);
        }
    },
};

module.exports = logger;