// neuroforge/backend/src/config/index.js
// Purpose: Loads and exports environment variables
require('dotenv').config(); // Load .env file

keyVault: {
    url: process.env.KEY_VAULT_URL || 'https://neuroforge-vault.vault.azure.net'
}

const config = {
    port: process.env.PORT || 5001,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGO_URI,
    sql: {
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        options: {
            encrypt: true, // Required for Azure SQL
            trustServerCertificate: false // Change to true for local dev without certs
        }
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    },
    apiKeys: { // Consider more secure loading mechanisms like Azure Key Vault
        openai: process.env.OPENAI_API_KEY,
        anthropic: process.env.ANTHROPIC_API_KEY,
        // ... other keys
    },
    azureStorage: {
        connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
        containerName: process.env.AZURE_STORAGE_BLOB_CONTAINER_NAME || 'learning-assets',
    },
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    corsOptions: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Allow frontend origin
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    },
    // Add rate limit config if needed
};

// Validate essential config variables
if (!config.jwt.secret) {
    console.error("FATAL ERROR: JWT_SECRET is not defined.");
    process.exit(1);
}
if (!config.mongoUri) {
    console.error("FATAL ERROR: MONGO_URI is not defined.");
    // Optionally exit or run in a limited mode
}

module.exports = config;