// neuroforge/backend/src/controllers/gamificationController.js
const User = require('../models/mongo/User');
const Achievement = require('../models/mongo/Achievement');
const { XPConfig } = require('../services/GamificationService'); // Import XP config helpers
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

// @desc    Get current user's gamification status (XP, level, streaks)
// @route   GET /api/v1/gamification/status
// @access  Private
exports.getGamificationStatus = async (req, res, next) => {
    try {
        const userId = req.user.id;
        // Select only the necessary fields for status
        const user = await User.findById(userId).select('xp level streaks');

        if (!user) {
            return next(new ApiError('User not found', 404));
        }

        // Calculate XP needed for next level
        const currentLevelXP = XPConfig.getTotalXPForLevel(user.level);
        const nextLevelXP = XPConfig.getTotalXPForLevel(user.level + 1);
        const xpProgressInLevel = user.xp - currentLevelXP;
        const xpToNextLevel = nextLevelXP - currentLevelXP;

        res.status(200).json({
            success: true,
            data: {
                xp: user.xp,
                level: user.level,
                xpCurrentLevelBase: currentLevelXP, // Total XP needed to *reach* current level
                xpNextLevelTarget: nextLevelXP,    // Total XP needed to *reach* next level
                xpInLevelProgress: xpProgressInLevel, // How much XP gained *within* current level bar
                xpForLevelUp: xpToNextLevel > 0 ? xpToNextLevel : 0, // Total XP needed *for* the current level bar
                dailyStreak: user.streaks?.daily?.count || 0,
                weeklyStreak: user.streaks?.weekly?.count || 0,
                lastDailyCompletion: user.streaks?.daily?.lastCompletedDate,
                lastWeeklyCompletion: user.streaks?.weekly?.lastCompletedWeek,
            },
        });
    } catch (error) {
        logger.error(`Error fetching gamification status for user ${req.user.id}:`, error);
        next(new ApiError('Failed to retrieve gamification status', 500));
    }
};

// @desc    Get all available achievements (for discovery/display)
// @route   GET /api/v1/gamification/achievements
// @access  Private
exports.getAllAchievements = async (req, res, next) => {
    try {
        // Exclude secret achievements' details unless needed otherwise
        const achievements = await Achievement.find({ isSecret: false }).select('-__v'); // Basic query, adjust selection as needed
        const secretAchievements = await Achievement.find({ isSecret: true }).select('name icon isSecret'); // Only show basic info for secrets

        // Combine, maybe mark secrets clearly
        const allAchievements = [...achievements, ...secretAchievements];


        res.status(200).json({
            success: true,
            count: allAchievements.length,
            data: allAchievements,
        });
    } catch (error) {
        logger.error('Error fetching all achievements:', error);
        next(new ApiError('Failed to retrieve achievements', 500));
    }
};

// @desc    Get achievements unlocked by the current user
// @route   GET /api/v1/gamification/achievements/unlocked
// @access  Private
exports.getUnlockedAchievements = async (req, res, next) => {
    try {
        const userId = req.user.id;
        // Populate the achievements array with actual achievement data
        const user = await User.findById(userId).select('achievements').populate({
             path: 'achievements',
             select: '-__v' // Exclude version key from populated achievements
        });

        if (!user) {
            return next(new ApiError('User not found', 404));
        }

        res.status(200).json({
            success: true,
            count: user.achievements.length,
            data: user.achievements, // Array of full achievement objects unlocked by user
        });
    } catch (error) {
        logger.error(`Error fetching unlocked achievements for user ${req.user.id}:`, error);
        next(new ApiError('Failed to retrieve unlocked achievements', 500));
    }
};