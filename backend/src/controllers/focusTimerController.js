// controllers/focusTimerController.js
const Lesson = require('../models/mongo/Lesson');
const UserProgress = require('../models/mongo/UserProgress');
const User = require('../models/mongo/User');
const { GamificationServiceInstance } = require('../services/GamificationService');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

// @desc    Get focus timer lesson data
// @route   GET /api/v1/learning/focustimer/:lessonId
// @access  Private
exports.getFocusTimer = async (req, res, next) => {
  try {
    const lessonId = req.params.lessonId;
    const userId = req.user.id;
    
    // Find the lesson and ensure it's a focus timer type
    const lesson = await Lesson.findById(lessonId);
    
    if (!lesson) {
      return next(new ApiError(`Lesson not found with ID: ${lessonId}`, 404));
    }
    
    if (lesson.lessonType !== 'focusTimer' || !lesson.focusTimer) {
      return next(new ApiError('Requested lesson is not a focus timer', 400));
    }
    
    // Get user progress if it exists
    const userProgress = await UserProgress.findOne({ user: userId, lesson: lessonId });
    
    // Return focus timer data
    res.status(200).json({
      success: true,
      data: {
        lessonId: lesson._id,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.focusTimer.duration,
        breakInterval: lesson.focusTimer.breakInterval,
        cycles: lesson.focusTimer.cycles,
        task: lesson.focusTimer.task,
        techniques: lesson.focusTimer.techniques,
        recommendedAudioPreset: lesson.focusTimer.recommendedAudioPreset,
        difficulty: lesson.focusTimer.difficulty,
        progress: userProgress ? userProgress.progress : 0
      }
    });
    
  } catch (error) {
    logger.error(`Error fetching focus timer ${req.params.lessonId}:`, error);
    if (error.name === 'CastError') {
      return next(new ApiError(`Invalid Lesson ID: ${req.params.lessonId}`, 400));
    }
    next(new ApiError('Failed to retrieve focus timer', 500));
  }
};

// @desc    Submit focus timer session results
// @route   POST /api/v1/learning/focustimer/:lessonId/submit
// @access  Private
exports.submitFocusTimerResults = async (req, res, next) => {
  try {
    const lessonId = req.params.lessonId;
    const userId = req.user.id;
    const { completed, focusTime, pauseCount, cyclesCompleted } = req.body;
    
    // Basic validation
    if (completed === undefined || focusTime === undefined) {
      return next(new ApiError('Missing required focus timer data', 400));
    }
    
    // Find the lesson to ensure it exists
    const lesson = await Lesson.findById(lessonId);
    if (!lesson || lesson.lessonType !== 'focusTimer') {
      return next(new ApiError('Invalid focus timer lesson', 404));
    }
    
    // Calculate score based on completion, focus time, and pauses
    let finalScore = 0;
    
    if (completed) {
      // Base score for completing the full duration
      finalScore = 100;
      
      // Penalty for excessive pauses (if applicable)
      if (pauseCount > 0) {
        const pausePenalty = Math.min(20, pauseCount * 5); // Up to 20% penalty
        finalScore -= pausePenalty;
      }
      
      // Adjust based on cycles completed vs expected
      if (lesson.focusTimer.cycles > 1 && cyclesCompleted) {
        const cyclePercentage = (cyclesCompleted / lesson.focusTimer.cycles) * 100;
        if (cyclePercentage < 100) {
          finalScore = Math.floor(finalScore * (cyclePercentage / 100));
        }
      }
    } else {
      // Partially completed - score based on percentage of time completed
      const expectedTime = lesson.focusTimer.duration * (lesson.focusTimer.cycles || 1);
      const timePercentage = Math.min(100, (focusTime / expectedTime) * 100);
      finalScore = Math.floor(timePercentage);
    }
    
    // Find or create user progress
    let userProgress = await UserProgress.findOne({ user: userId, lesson: lessonId });
    
    if (userProgress) {
      // Update existing progress if the new score is better
      if (finalScore > userProgress.score) {
        userProgress.score = finalScore;
        userProgress.attempts += 1;
        userProgress.lastAttemptAt = new Date();
        
        if (finalScore >= 70) {
          userProgress.status = 'completed';
          userProgress.completedAt = new Date();
        }
        
        await userProgress.save();
      } else {
        // Just increment attempts if score isn't better
        userProgress.attempts += 1;
        userProgress.lastAttemptAt = new Date();
        await userProgress.save();
      }
    } else {
      // Create new progress
      userProgress = await UserProgress.create({
        user: userId,
        lesson: lessonId,
        score: finalScore,
        attempts: 1,
        lastAttemptAt: new Date(),
        status: finalScore >= 70 ? 'completed' : 'in-progress',
        completedAt: finalScore >= 70 ? new Date() : null
      });
    }
    
    // Gamification hooks
    let gamificationResult = { xpAwarded: 0, newAchievements: [], levelUpInfo: null };
    
    // Only award XP if they've improved or completed for the first time
    const isNewCompletion = finalScore >= 70 && (!userProgress.completedAt || userProgress.completedAt === userProgress.lastAttemptAt);
    
    if (isNewCompletion) {
      // Award XP based on difficulty and duration
      const difficultyMultiplier = lesson.focusTimer.difficulty || 1;
      const durationMultiplier = Math.floor(lesson.focusTimer.duration / 300); // 5 minutes = 1 unit
      const xpAward = Math.floor(20 * difficultyMultiplier * (finalScore / 100) * (durationMultiplier || 1));
      
      const levelUpInfo = await GamificationServiceInstance.awardXp(userId, xpAward);
      gamificationResult.xpAwarded = xpAward;
      gamificationResult.levelUpInfo = levelUpInfo;
      
      // Update focus timer related stats
      await User.findByIdAndUpdate(userId, 
        { 
          $inc: { 
            'stats.focusSessionsCompleted': 1,
            'stats.totalFocusMinutes': Math.floor(focusTime / 60)
          } 
        }, 
        { new: true }
      );
      
      // Check for focus timer achievements
      const user = await User.findById(userId).select('stats');
      
      // Focus session count achievement
      const focusCountAchievements = await GamificationServiceInstance.checkAndAwardAchievement(
        userId,
        'FOCUS_SESSION_COUNT',
        { count: user.stats.focusSessionsCompleted || 0 },
        user
      );
      
      // Focus minutes achievement
      const focusMinuteAchievements = await GamificationServiceInstance.checkAndAwardAchievement(
        userId,
        'FOCUS_MINUTES_TOTAL',
        { minutes: user.stats.totalFocusMinutes || 0 },
        user
      );
      
      gamificationResult.newAchievements = [
        ...focusCountAchievements,
        ...focusMinuteAchievements
      ];
    }
    
    res.status(200).json({
      success: true,
      data: {
        score: finalScore,
        isPassing: finalScore >= 70,
        previousBest: userProgress.score,
        attempts: userProgress.attempts,
        gamification: gamificationResult
      }
    });
    
  } catch (error) {
    logger.error(`Error submitting focus timer results for ${req.params.lessonId}:`, error);
    next(new ApiError('Failed to submit focus timer results', 500));
  }
};