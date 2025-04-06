// neuroforge/backend/src/routes/gamificationRoutes.js
const express = require('express');
const {
    getGamificationStatus,
    getAllAchievements,
    getUnlockedAchievements
} = require('../controllers/gamificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All gamification routes require authentication
router.use(protect);

router.get('/status', getGamificationStatus);
router.get('/achievements', getAllAchievements);
router.get('/achievements/unlocked', getUnlockedAchievements);

module.exports = router;