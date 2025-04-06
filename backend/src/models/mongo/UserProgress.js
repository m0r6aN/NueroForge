// neuroforge/backend/src/models/mongo/UserProgress.js
// Purpose: Tracks user progress on individual lessons, especially for SRS
const mongoose = require('mongoose');
const { SUPERMEMO2_INITIAL_INTERVAL } = require('../../services/SrsService'); // Import constants

const UserProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true,
    },
    subject: { // Denormalized for easier querying
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true,
    },
    // SRS Specific Fields (based on SuperMemo 2 algorithm or similar)
    easinessFactor: { // EF: How easy the item is (starts ~2.5)
        type: Number,
        default: 2.5,
        min: 1.3, // Minimum easiness factor
    },
    repetitions: { // n: Number of times reviewed correctly in a row
        type: Number,
        default: 0,
    },
    intervalDays: { // I(n): Current interval in days until next review
        type: Number,
        default: SUPERMEMO2_INITIAL_INTERVAL, // Start with initial interval (e.g., 1 day)
    },
    nextReviewDate: { // Date when this lesson should be reviewed next
        type: Date,
        required: true,
        index: true, // Crucial for querying items due for review
    },
    // General Progress
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed', 'mastered'], // Mastered might mean high EF/long interval
        default: 'not_started',
    },
    lastReviewedDate: {
        type: Date,
    },
    // Store performance history if needed (e.g., array of {date, performanceScore})
    reviewHistory: [{
        date: Date,
        performanceScore: Number, // e.g., 0-5 scale from user input
        intervalDays: Number,
        easinessFactor: Number,
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for efficient querying of user's due reviews
UserProgressSchema.index({ user: 1, nextReviewDate: 1 });
// Unique index to prevent duplicate progress entries for the same user/lesson
UserProgressSchema.index({ user: 1, lesson: 1 }, { unique: true });

UserProgressSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('UserProgress', UserProgressSchema);