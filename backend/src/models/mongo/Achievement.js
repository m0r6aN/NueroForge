// neuroforge/backend/src/models/mongo/Achievement.js
const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    icon: { type: String, required: true }, // e.g., "BrainCircuit", "Rocket", "Target" or URL
    triggerType: {
        type: String,
        enum: [
            'LESSON_COMPLETE_COUNT', // e.g., complete 1, 10, 50 lessons
            'SUBJECT_COMPLETE_COUNT', // e.g., complete 1, 5, 10 subjects
            'STREAK_DAILY',           // e.g., achieve 3, 7, 30 day streak
            'STREAK_WEEKLY',          // e.g., achieve 2, 4, 10 week streak
            'XP_THRESHOLD',           // e.g., reach 1000, 5000, 10000 XP
            'REVIEW_SESSION_COUNT',   // e.g., complete 5, 20, 100 review sessions
            'AUDIO_PRESET_DURATION',  // e.g., use 'Focus' preset for 60 minutes total
            'AI_INTERACTION_COUNT',   // e.g., 50 messages with AI Tutor
            'MANUAL',                 // Awarded by admin/system event
            // Add more specific triggers as needed
        ],
        required: true,
    },
    // Condition value based on triggerType
    // Examples:
    //   LESSON_COMPLETE_COUNT: 10 (meaning 10 lessons)
    //   STREAK_DAILY: 7 (meaning 7 days)
    //   XP_THRESHOLD: 5000
    //   AUDIO_PRESET_DURATION: { preset: 'focus', minutes: 60 }
    triggerConditionValue: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    xpReward: { type: Number, default: 50 },
    isSecret: { type: Boolean, default: false }, // Hide description until unlocked
    createdAt: { type: Date, default: Date.now }
});

AchievementSchema.index({ triggerType: 1 });

module.exports = mongoose.model('Achievement', AchievementSchema);