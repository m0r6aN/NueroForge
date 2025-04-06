// neuroforge/backend/src/services/SrsService.js
// Purpose: Implements the Spaced Repetition System logic (SuperMemo 2 variant)
const UserProgress = require('../models/mongo/UserProgress');
const logger = require('../utils/logger');

// Constants for SM-2 Algorithm
const MIN_EASINESS_FACTOR = 1.3;
const INITIAL_INTERVAL = 1; // First interval in days
const SECOND_INTERVAL = 6; // Second interval after first successful review

// Export constants for use in models or elsewhere
module.exports.SUPERMEMO2_INITIAL_INTERVAL = INITIAL_INTERVAL;

class SrsService {

    /**
     * Calculates the next review interval and easiness factor based on user performance.
     * Based on the SuperMemo 2 (SM-2) algorithm.
     * @param {object} progress - The UserProgress document for the item.
     * @param {number} performanceScore - User's recall quality (e.g., 0-5 scale, where >= 3 is correct).
     * @returns {object} Updated { easinessFactor, intervalDays, repetitions, nextReviewDate }
     */
    calculateNextReview(progress, performanceScore) {
        if (performanceScore < 0 || performanceScore > 5) {
            throw new Error("Performance score must be between 0 and 5.");
        }

        let { easinessFactor, repetitions, intervalDays } = progress;

        // 1. Adjust Easiness Factor (EF)
        // EF' = EF + [0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)]
        // Simplified: Adjust EF based on how easy/hard it was.
        easinessFactor = easinessFactor + (0.1 - (5 - performanceScore) * (0.08 + (5 - performanceScore) * 0.02));
        if (easinessFactor < MIN_EASINESS_FACTOR) {
            easinessFactor = MIN_EASINESS_FACTOR; // Clamp EF at minimum
        }

        // 2. Update Repetitions Count
        if (performanceScore < 3) {
            // Incorrect recall: Reset repetitions count, keep interval short (re-learn)
            repetitions = 0;
            intervalDays = INITIAL_INTERVAL; // Reset interval to 1 day
        } else {
            // Correct recall: Increment repetitions count
            repetitions += 1;

            // 3. Calculate Next Interval I(n)
            if (repetitions === 1) {
                intervalDays = INITIAL_INTERVAL;
            } else if (repetitions === 2) {
                intervalDays = SECOND_INTERVAL;
            } else {
                // I(n) = I(n-1) * EF
                intervalDays = Math.ceil(intervalDays * easinessFactor);
            }
        }

        // 4. Calculate Next Review Date
        const now = new Date();
        const nextReviewDate = new Date(now.setDate(now.getDate() + intervalDays));
         // Optional: Add jitter/randomness to avoid clumping reviews on the same day
         // const jitterHours = Math.floor(Math.random() * 12); // Add 0-11 hours jitter
         // nextReviewDate.setHours(nextReviewDate.getHours() + jitterHours);

        return {
            easinessFactor,
            intervalDays,
            repetitions,
            nextReviewDate,
        };
    }

    /**
     * Updates the user's progress for a specific lesson after a review.
     * @param {string} userId - The user's ID.
     * @param {string} lessonId - The lesson's ID.
     * @param {number} performanceScore - User's recall quality (0-5).
     * @returns {Promise<object>} The updated UserProgress document.
     */
    async updateReviewProgress(userId, lessonId, performanceScore) {
        const progress = await UserProgress.findOne({ user: userId, lesson: lessonId });

        if (!progress) {
            throw new Error(`Progress not found for user ${userId} and lesson ${lessonId}`);
        }

        const updateData = this.calculateNextReview(progress, performanceScore);

        // Add current review to history
        const reviewEntry = {
            date: new Date(),
            performanceScore,
            intervalDays: updateData.intervalDays,
            easinessFactor: updateData.easinessFactor,
        };

        progress.easinessFactor = updateData.easinessFactor;
        progress.repetitions = updateData.repetitions;
        progress.intervalDays = updateData.intervalDays;
        progress.nextReviewDate = updateData.nextReviewDate;
        progress.lastReviewedDate = reviewEntry.date;
        progress.status = progress.status === 'completed' || progress.status === 'mastered' ? progress.status : 'completed'; // Mark as completed if reviewed
         if (progress.easinessFactor > 4 && progress.intervalDays > 90) { // Example threshold for 'mastered'
             progress.status = 'mastered';
         }
        progress.reviewHistory.push(reviewEntry);
        // Optional: Limit history size
        // if (progress.reviewHistory.length > 20) { progress.reviewHistory.shift(); }

        await progress.save();
        logger.info(`SRS progress updated for user ${userId}, lesson ${lessonId}. Next review: ${updateData.nextReviewDate.toISOString().split('T')[0]}`);
        return progress;
    }

    /**
     * Creates the initial progress entry when a user first encounters/completes a lesson.
     * @param {string} userId
     * @param {string} lessonId
     * @param {string} subjectId
     * @returns {Promise<object>} The new UserProgress document.
     */
    async initializeProgress(userId, lessonId, subjectId) {
        const existingProgress = await UserProgress.findOne({ user: userId, lesson: lessonId });
        if (existingProgress) {
            logger.warn(`Progress already exists for user ${userId}, lesson ${lessonId}. Skipping initialization.`);
            return existingProgress; // Don't overwrite existing progress
        }

        const now = new Date();
        const initialNextReview = new Date(now.setDate(now.getDate() + INITIAL_INTERVAL));

        const newProgress = await UserProgress.create({
            user: userId,
            lesson: lessonId,
            subject: subjectId,
            easinessFactor: 2.5, // Default EF
            repetitions: 0,
            intervalDays: INITIAL_INTERVAL,
            nextReviewDate: initialNextReview,
            status: 'completed', // Assume completed when initialized for review
            lastReviewedDate: new Date(), // Mark as 'reviewed' initially
        });
        logger.info(`Initial SRS progress created for user ${userId}, lesson ${lessonId}.`);
        return newProgress;
    }

    /**
     * Gets lessons due for review for a specific user.
     * @param {string} userId
     * @param {number} [limit=20] - Max number of items to return.
     * @returns {Promise<Array<object>>} Array of UserProgress documents populated with Lesson details.
     */
    async getDueReviewItems(userId, limit = 20) {
        const now = new Date();
        const dueItems = await UserProgress.find({
            user: userId,
            nextReviewDate: { $lte: now } // Find items where review date is past or present
        })
        .sort({ nextReviewDate: 1 }) // Prioritize oldest due items
        .limit(limit)
        .populate({ // Populate the linked lesson details
             path: 'lesson',
             select: 'title contentType content subject' // Select fields needed for the review card
        })
        .lean(); // Use lean for performance if modifications aren't needed

        logger.info(`Found ${dueItems.length} SRS items due for user ${userId}.`);
        return dueItems;
    }
}

// Export a singleton instance
module.exports.SrsServiceInstance = new SrsService();