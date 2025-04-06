// neuroforge/backend/src/app.js
// Purpose: Configures the Express application
const express = require('express');
const cors = require('cors');
const config = require('./config');
const apiRoutes = require('./routes'); // Main router
const errorMiddleware = require('./middleware/errorMiddleware');
const WebSocketService = require('./services/WebSocketService'); // Import WebSocket service

const app = express();

// Middleware
app.use(cors(config.corsOptions)); // Enable CORS
app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded data

// API Routes
app.use('/api/v1', apiRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => res.status(200).send('NeuroForge Backend Operational'));

// Global Error Handler (Must be last)
app.use(errorMiddleware);

// Initialize WebSocket Server (pass the HTTP server instance in server.js)
const initializeWebSocket = (server) => {
    WebSocketService.init(server);
};

module.exports = { app, initializeWebSocket };