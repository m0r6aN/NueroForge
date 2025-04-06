// neuroforge/backend/src/routes/authRoutes.js
// Purpose: Defines authentication-related routes
const express = require('express');
const { handleProviderCallback, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware

const router = express.Router();

// This endpoint is called by the NextAuth backend after successful OAuth
// It needs appropriate security (e.g., shared secret, IP restriction) if exposed publicly
// Or preferably, called server-to-server within Azure VNet.
router.post('/provider-callback', handleProviderCallback);

// Route to get the currently logged-in user's details based on the API token
router.get('/me', protect, getMe); // Protect this route

module.exports = router;