// neuroforge/backend/src/controllers/learningController.js
// Purpose: Handles fetching learning content, submitting progress, reviews, etc.
// Merged version using singleton services and clean exports.

const Lesson = require('../models/mongo/Lesson');
const UserProgress = require('../models/mongo/UserProgress');
const User = require('../models/mongo/User');
const { SrsServiceInstance } = require('../services/SrsService');
const { GamificationServiceInstance } = require('../services/GamificationService');
const { SubjectOrderingServiceInstance } = require('../services/SubjectOrderingService'); // Use Singleton
const Subject = mongoose.model('Subject');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

const getSubjectLessons = async (req, res, next) => {
    try {
        const subjectId = req.params.subjectId;
        const lessons = await Lesson.find({ subject: subjectId }).sort({ orderIndex: 1 }); // TODO: Add orderIndex to Lesson model
        res.status(200).json({ success: true, count: lessons.length, data: lessons });
    } catch (error) {
        logger.error(`Error fetching lessons for subject ${req.params.subjectId}:`, error);
        next(new ApiError('Failed to retrieve lessons', 500));
    }
};

const getNextLesson = async (req, res, next) => {
    try {
        const userId = req.user.id;
        logger.debug(`Fetching next lesson for user ${userId}`);

        const subjectOrderingService = new SubjectOrderingService();
        const nextStep = await subjectOrderingService.getNextOptimalStep(userId);

        if (!nextStep) {
            throw new ApiError('No next lesson available', 404);
        }

        // Fetch subject and lesson details for enriched response
        const subject = await Subject.findById(nextStep.subjectId).lean();
        if (!subject) {
            throw new ApiError('Subject not found', 404);
        }
        const lesson = subject.lessons.find(l => l._id.toString() === nextStep.lessonId.toString());
        if (!lesson) {
            throw new ApiError('Lesson not found', 404);
        }

        // Map performance to audio preset (example logic)
        const state = await subjectOrderingService.cognitiveStateService.getUserCognitiveState(userId);
        const performance = state.recentPerformance;
        const recommendedAudioPreset = performance === null ? 'default' :
            performance < 50 ? 'focus' :
            performance > 80 ? 'deep_learning' : 'creative_thinking';

        res.status(200).json({
            success: true,
            data: {
                subjectId: nextStep.subjectId,
                subjectTitle: subject.title,
                lessonId: nextStep.lessonId,
                lessonTitle: lesson.title,
                rationale: nextStep.rationale,
                recommendedAudioPreset
            }
        });
    } catch (error) {
        logger.error(`Error fetching next lesson for user ${userId}:`, error.message);
        next(error instanceof ApiError ? error : new ApiError('Failed to fetch next lesson', 500));
    }
};

// backend/src/controllers/learningController.js
const subjectOrderingService = require('../services/SubjectOrderingService');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

// @desc    Get the next recommended learning path for the user
// @route   GET /api/v1/learning/path/next
// @access  Private
const getNextLearningPath = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const nextPath = await subjectOrderingService.getNextLearningPath(userId);
    res.status(200).json({
      success: true,
      data: nextPath,  // Includes subjectId, lessonId, rationale, subjectTitle, lessonTitle, recommendedAudioPreset
    });
  } catch (error) {
    logger.error(`Error getting next learning path for user ${req.user.id}:`, error);
    next(new ApiError('Failed to retrieve next learning path', 500));
  }
};

const getLessonById = async (req, res, next) => {
    try {
        const lessonId = req.params.lessonId;
        const lesson = await Lesson.findById(lessonId).lean(); // Use lean if not modifying
        if (!lesson) return next(new ApiError(`Lesson not found with ID: ${lessonId}`, 404));
        res.status(200).json({ success: true, data: lesson });
    } catch (error) {
        logger.error(`Error fetching lesson ${req.params.lessonId}:`, error);
        if (error.name === 'CastError') return next(new ApiError(`Invalid Lesson ID: ${req.params.lessonId}`, 400));
        next(new ApiError('Failed to retrieve lesson', 500));
    }
};

const completeLesson = async (req, res, next) => {
    try {
        const lessonId = req.params.lessonId;
        const userId = req.user.id;
        const existingProgress = await UserProgress.findOne({ user: userId, lesson: lessonId }).select('status');
        let wasAlreadyCompleted = existingProgress && existingProgress.status === 'completed';

        const lesson = await Lesson.findById(lessonId).select('subject isReviewable');
        if (!lesson) return next(new ApiError(`Lesson not found: ${lessonId}`, 404));

        // Initialize/Update progress
        if (lesson.isReviewable) {
            await SrsServiceInstance.initializeProgress(userId, lessonId, lesson.subject);
        } else {
             await UserProgress.findOneAndUpdate(
                 { user: userId, lesson: lessonId },
                 { $set: { status: 'completed', subject: lesson.subject, nextReviewDate: new Date('9999-12-31') }, $setOnInsert: { user: userId, lesson: lessonId } }, // Ensure user/lesson on insert
                 { upsert: true, new: true, setDefaultsOnInsert: true }
             );
        }

        let gamificationResult = { xpAwarded: 0, newAchievements: [], levelUpInfo: null };
        if (!wasAlreadyCompleted) {
            const xpForLesson = 50;
            const levelUpInfo = await GamificationServiceInstance.awardXp(userId, xpForLesson);
            gamificationResult.xpAwarded += xpForLesson;
            gamificationResult.levelUpInfo = levelUpInfo;
            const updatedUser = await User.findByIdAndUpdate(userId, { $inc: { 'stats.lessonsCompleted': 1 } }, { new: true }).select('stats');
            const lessonAchievements = await GamificationServiceInstance.checkAndAwardAchievement(userId, 'LESSON_COMPLETE_COUNT', { count: updatedUser.stats.lessonsCompleted }, updatedUser);
            gamificationResult.newAchievements.push(...lessonAchievements);
            logger.info(`[Gamify Hook] Awarded ${xpForLesson} XP to user ${userId} for completing lesson ${lessonId}`);
            // Streak update logic remains here if desired...
             // await GamificationServiceInstance.updateStreak(userId, 'daily');
        } else {
            logger.info(`[Gamify Hook] Lesson ${lessonId} already completed by user ${userId}. No XP awarded.`);
        }

        res.status(200).json({ success: true, message: 'Lesson marked as complete.', gamification: gamificationResult });
    } catch (error) {
        logger.error(`Error completing lesson ${req.params.lessonId} for user ${req.user.id}:`, error);
        next(new ApiError('Failed to mark lesson as complete', 500));
    }
};

completeSubject = async (req, res, next) => {
  try {
    const subjectId = req.params.subjectId;
    const userId = req.user.id;
    
    // First, check if the subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return next(new ApiError(`Subject not found with ID: ${subjectId}`, 404));
    }
    
    // Check if all lessons in the subject are completed
    const lessons = await Lesson.find({ subject: subjectId });
    const completedLessons = await UserProgress.find({
      user: userId,
      lesson: { $in: lessons.map(l => l._id) },
      status: 'completed'
    });
    
    // If not all lessons are completed, return error
    if (completedLessons.length < lessons.length) {
      return next(new ApiError('Not all lessons in this subject are completed', 400));
    }
    
    // Check if subject was already completed
    const userSubjectProgress = await UserSubjectProgress.findOne({
      user: userId,
      subject: subjectId
    });
    
    const wasAlreadyCompleted = userSubjectProgress && userSubjectProgress.status === 'completed';
    
    // Update or create subject progress
    if (userSubjectProgress) {
      userSubjectProgress.status = 'completed';
      userSubjectProgress.completedAt = new Date();
      await userSubjectProgress.save();
    } else {
      await UserSubjectProgress.create({
        user: userId,
        subject: subjectId,
        status: 'completed',
        completedAt: new Date()
      });
    }
    
    let gamificationResult = { xpAwarded: 0, newAchievements: [], levelUpInfo: null };
    
    // --- Gamification Hook ---
    if (!wasAlreadyCompleted) { // Only award XP/check achievements on FIRST completion
      // Award XP for subject completion - more XP than a lesson
      const xpForSubject = 200; // Base XP for completing a subject
      const levelUpInfo = await GamificationServiceInstance.awardXp(userId, xpForSubject);
      gamificationResult.xpAwarded += xpForSubject;
      gamificationResult.levelUpInfo = levelUpInfo;
      
      // Update user stats (do this before checking achievements)
      const updatedUserStats = await User.findByIdAndUpdate(
        userId, 
        { $inc: { 'stats.subjectsCompleted': 1 } }, 
        { new: true }
      ).select('stats');
      
      // Check for subject completion achievements
      const subjectAchievements = await GamificationServiceInstance.checkAndAwardAchievement(
        userId,
        'SUBJECT_COMPLETE_COUNT',
        { count: updatedUserStats.stats.subjectsCompleted },
        updatedUserStats // Pass user with updated stats
      );
      
      gamificationResult.newAchievements.push(...subjectAchievements);
      
      logger.info(`[Gamify Hook] Awarded ${xpForSubject} XP to user ${userId} for completing subject ${subjectId}`);
    } else {
      logger.info(`[Gamify Hook] Subject ${subjectId} already completed by user ${userId}. No XP awarded.`);
    }
    
    res.status(200).json({
      success: true,
      message: 'Subject marked as complete.',
      gamification: gamificationResult
    });
    
  } catch (error) {
    logger.error(`Error completing subject ${req.params.subjectId}:`, error);
    if (error.name === 'CastError') {
      return next(new ApiError(`Invalid Subject ID: ${req.params.subjectId}`, 400));
    }
    next(new ApiError('Failed to complete subject', 500));
  }
};

const getDueReviews = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit || '20', 10);
        const dueItems = await SrsServiceInstance.getDueReviewItems(userId, limit);
        res.status(200).json({ success: true, count: dueItems.length, data: dueItems });
    } catch (error) {
        logger.error(`Error fetching due reviews for user ${req.user.id}:`, error);
        next(new ApiError('Failed to retrieve review items', 500));
    }
};

const submitReview = async (req, res, next) => {
    try {
        const progressId = req.params.progressId;
        const userId = req.user.id;
        const { performanceScore } = req.body;

        if (performanceScore === undefined || performanceScore < 0 || performanceScore > 5) {
            return next(new ApiError('Invalid performance score provided (must be 0-5).', 400));
        }
        const progressItem = await UserProgress.findOne({ _id: progressId, user: userId });
        if (!progressItem) return next(new ApiError('Review item not found or access denied.', 404));

        const updatedProgress = await SrsServiceInstance.updateReviewProgress(userId, progressItem.lesson, performanceScore);

        let gamificationResult = { xpAwarded: 0, newAchievements: [], levelUpInfo: null, streakUpdated: false };
        const xpForReview = performanceScore >= 3 ? 15 : 5; // Use consistent XP value
        const levelUpInfo = await GamificationServiceInstance.awardXp(userId, xpForReview);
        gamificationResult.xpAwarded += xpForReview;
        gamificationResult.levelUpInfo = levelUpInfo;
        logger.info(`[Gamify Hook] Awarded ${xpForReview} XP to user ${userId} for reviewing item ${progressId}`);

        const streakResult = await GamificationServiceInstance.updateStreak(userId, 'daily');
        gamificationResult.streakUpdated = streakResult.updated;
        if (streakResult.updated) {
             const streakAchievements = await GamificationServiceInstance.checkAndAwardAchievement(userId, 'STREAK_DAILY', { count: streakResult.newCount });
              gamificationResult.newAchievements.push(...streakAchievements);
        }
        // Session count achievement check logic would go here...

        res.status(200).json({ success: true, message: 'Review submitted successfully.', data: updatedProgress, gamification: gamificationResult });

    } catch (error) {
        logger.error(`Error submitting review ${req.params.progressId} for user ${req.user.id}:`, error);
        if (error.message.includes('Progress not found')) return next(new ApiError(error.message, 404));
        next(new ApiError('Failed to submit review', 500));
    }
};

const completeSubject = async (req, res, next) => {
    try {
      const subjectId = req.params.subjectId;
      const userId = req.user.id;
      
      logger.info(`Attempting to mark subject ${subjectId} as completed for user ${userId}`);
      
      // 1. Verify the subject exists
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return next(new ApiError(`Subject not found with ID: ${subjectId}`, 404));
      }
      
      // 2. Get all lessons for this subject
      const lessons = await Lesson.find({ subject: subjectId }).select('_id');
      if (!lessons || lessons.length === 0) {
        return next(new ApiError(`No lessons found for subject ${subjectId}`, 404));
      }
      
      // 3. Check if all lessons are completed by the user
      const lessonIds = lessons.map(lesson => lesson._id);
      const completedLessons = await UserProgress.countDocuments({
        user: userId,
        lesson: { $in: lessonIds },
        status: 'completed'
      });
      
      // If not all lessons are completed, return an error
      if (completedLessons < lessons.length) {
        return next(new ApiError(
          `Cannot mark subject as completed: ${lessons.length - completedLessons} lessons still incomplete`, 
          400
        ));
      }
      
      // 4. Update user's completed subjects list if not already marked
      const userUpdate = await User.findOneAndUpdate(
        { 
          _id: userId, 
          completedSubjects: { $ne: subjectId } // Only if not already in the array
        },
        { 
          $addToSet: { completedSubjects: subjectId },
          $inc: { 'stats.subjectsCompleted': 1 }
        },
        { new: true }
      );
      
      // 5. Check if subject was already completed
      const wasAlreadyCompleted = !userUpdate || userUpdate.completedSubjects.length === userUpdate.stats.subjectsCompleted;
      
      // 6. Handle gamification only if newly completed
      let gamificationResult = { xpAwarded: 0, newAchievements: [], levelUpInfo: null };
      
      if (!wasAlreadyCompleted) {
        logger.info(`Subject ${subjectId} newly completed by user ${userId}. Processing gamification...`);
        
        // Award XP for subject completion
        const xpForSubject = 150; // Base XP for completing a subject (adjust as needed)
        const levelUpInfo = await GamificationServiceInstance.awardXp(userId, xpForSubject);
        gamificationResult.xpAwarded += xpForSubject;
        gamificationResult.levelUpInfo = levelUpInfo;
        
        // Check for subject completion count achievements
        const subjectAchievements = await GamificationServiceInstance.checkAndAwardAchievement(
          userId,
          'SUBJECT_COMPLETE_COUNT',
          { count: userUpdate.stats.subjectsCompleted },
          userUpdate // Pass user with updated stats
        );
        gamificationResult.newAchievements.push(...subjectAchievements);
        
        logger.info(`[Gamify Hook] Awarded ${xpForSubject} XP to user ${userId} for completing subject ${subjectId}`);
      } else {
        logger.info(`Subject ${subjectId} was already completed by user ${userId}. No gamification processed.`);
      }
      
      // 7. Return the completion status and any gamification results
      res.status(200).json({
        success: true,
        message: wasAlreadyCompleted ? 'Subject was already completed.' : 'Subject marked as complete.',
        data: {
          subjectId,
          completedLessons,
          totalLessons: lessons.length,
          wasAlreadyCompleted
        },
        gamification: gamificationResult
      });
      
    } catch (error) {
      logger.error(`Error completing subject ${req.params.subjectId} for user ${req.user.id}:`, error);
      if (error.name === 'CastError') {
        return next(new ApiError(`Invalid Subject ID: ${req.params.subjectId}`, 400));
      }
      next(new ApiError('Failed to complete subject', 500));
    }
  };

// Export all controller methods
module.exports = {
    getSubjectLessons,
    getNextLesson,
    getLessonById,
    completeLesson,
    getDueReviews,
    submitReview,
    getNextLearningPath,
    completeLearningPath,
    completeSubject
};