// neuroforge/backend/src/controllers/aiController.js
// Purpose: Handles interactions with external AI services (Tutoring, Content Gen, etc.)

const AiApiService = require('../services/AiApiService');
const Lesson = require('../models/mongo/Lesson');
const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');

// @desc    Interact with the AI Tutor (e.g., Azure Bot Service or LLM)
// @route   POST /api/v1/ai/tutor/chat
// @access  Private
const chatWithTutor = async (req, res, next) => {
    const { message, context, teachingStyle, personality } = req.body; // Context could be current lessonId, subjectId etc.
    const userId = req.user.id; // Identify the user for personalized responses

    if (!message) {
        return next(new ApiError('Message content is required.', 400));
    }

    try {
        // Delegate to the AI API service
        // This service would handle:
        // - Selecting the right AI model/service (Azure Bot, OpenAI, Anthropic)
        // - Formatting the prompt with context, user history, style preferences
        // - Managing API keys securely
        // - Handling rate limits and errors from the AI service
        const response = await AiApiService.getTutorResponse({
            userId,
            message,
            context, // e.g., { lessonId: '...', topic: 'Quantum Physics Basics'}
            preferredStyle: teachingStyle || req.user.preferences?.aiTutorStyle, // User preference or default
            preferredPersonality: personality || req.user.preferences?.aiTutorPersonality,
        });

        res.status(200).json({
            success: true,
            data: {
                reply: response.text, // The AI's response text
                // Include any other relevant data from the AI service (e.g., session state, suggested follow-ups)
            }
        });
    } catch (error) {
        logger.error(`AI Tutor chat error for user ${userId}:`, error);
        // Pass specific errors from AiApiService if available
        next(new ApiError(error.message || 'Failed to get response from AI tutor.', error.statusCode || 500));
    }
};

const generateQuiz = async (req, res, next) => {
    try {
        const { lessonId } = req.body;
        const userId = req.user.id;

        if (!lessonId) {
            throw new ApiError('Lesson ID is required', 400);
        }

        logger.debug(`Generating quiz for lesson ${lessonId} for user ${userId}`);

        // Fetch lesson content
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            throw new ApiError('Lesson not found', 404);
        }

        // Generate quiz via AI service
        const quiz = await aiApiService.generateQuiz({
            userId,
            lessonContent: lesson.content, // Assuming content field exists
        });

        res.status(200).json({
            success: true,
            data: quiz
        });
    } catch (error) {
        logger.error(`Error generating quiz for user ${userId}:`, error.message);
        next(error instanceof ApiError ? error : new ApiError('Failed to generate quiz', 500));
    }
};

module.exports = { chatWithTutor, generateQuiz };