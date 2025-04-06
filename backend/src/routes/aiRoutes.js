// neuroforge/backend/src/routes/aiRoutes.js
// Purpose: Defines routes for AI interactions
const express = require('express');
const { chatWithTutor } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All AI routes require authentication

router.post('/tutor/chat', chatWithTutor);
router.post('/generate/quiz', generateQuiz);
// Define other AI routes here...

module.exports = router;