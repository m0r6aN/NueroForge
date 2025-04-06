// neuroforge/backend/src/routes/userRoutes.js
// Purpose: Defines routes for user profile management
const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // Protect routes

const router = express.Router();

// All user routes should be protected after the '/me' endpoint handled in authRoutes
router.use(protect);

// Route for the logged-in user to update their own profile
router.route('/profile')
    .get(userController.getMyProfile) // Re-uses getMe logic perhaps, or specific profile view
    .put(userController.updateMyProfile); // Update preferences, etc.

// --- Admin Routes (Example) ---
// router.route('/')
//     .get(authorize('admin'), userController.getAllUsers); // Example admin route

// router.route('/:id')
//     .get(authorize('admin'), userController.getUserById)
//     .put(authorize('admin'), userController.updateUser) // Admin updates user role etc.
//     .delete(authorize('admin'), userController.deleteUser);

module.exports = router;