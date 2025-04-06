// neuroforge/backend/src/routes/learningRoutes.js
// Purpose: Defines routes related to learning content and progress

const express = require('express');
const {
    getSubjectLessons,
    getLessonById,
    completeLesson,
    getDueReviews,
    submitReview,
    getNextLesson,
    completeSubject
} = require('../controllers/learningController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All learning routes require authentication
router.use(protect);

// Lesson content routes
router.get('/subject/:subjectId/lessons', getSubjectLessons); // Get lessons for a specific subject
router.get('/lesson/:lessonId', getLessonById); // Get lesson content by ID
router.post('/lesson/:lessonId/complete', completeLesson); // Mark lesson completed

// Subject completion route
router.post('/subject/:subjectId/complete', completeSubject);

// Dynamic Learning Path Suggestion
router.get('/path/next', getNextLesson); // Get next recommended lesson

// SRS Review routes
router.get('/reviews/due', getDueReviews); // Get items for review session
router.post('/reviews/:progressId/submit', submitReview); // Submit review result (using UserProgress ID)

// Focus Timer routes
router.get('/focustimer/:lessonId', getFocusTimer);
router.post('/focustimer/:lessonId/submit', submitFocusTimerResults);

module.exports = router;