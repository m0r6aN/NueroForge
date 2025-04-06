// neuroforge/backend/src/models/mongo/CognitiveState.js
// Purpose: Stores persistent cognitive state metrics derived from user interactions.

const mongoose = require('mongoose');

// Define structure for individual session summaries within history
const SessionSummarySchema = new mongoose.Schema({
    sessionId: { type: String, required: true }, // Could be a UUID generated on start, or context ID
    contextType: { type: String, required: true }, // e.g., 'lesson', 'review_session'
    contextId: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationSeconds: { type: Number, required: true },
    interactionCount: { type: Number, default: 0 },
    // Add derived metrics from the session later, e.g.:
    // calculatedFocus: Number,
    // engagementScore: Number,
    // performanceMetrics: mongoose.Schema.Types.Mixed // e.g., quiz scores during session
}, { _id: false }); // No separate ID for subdocuments unless needed

const CognitiveStateSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // One state document per user
        index: true,
    },
    // Core derived metric(s) - calculated based on interactions/history
    // Start simple: overall focus score (needs calculation logic)
    // Let's use a placeholder structure that UserCognitiveStateService will update
    derivedMetrics: {
        // Example: A simple rolling average or score based on recent activity
        currentFocusScore: { // Scale TBD (e.g., 0-100, or category low/medium/high)
            type: Number,
            default: 50, // Neutral starting point
            min: 0,
            max: 100,
        },
        lastUpdatedMetric: { type: Date } // When was the score last calculated?
        // Add other metrics: fatigue estimate, engagement level etc. later
    },
    // Store recent session history for context and potential recalculations
    sessionHistory: {
        type: [SessionSummarySchema],
        // Optional: Limit the size of the history array for performance
        validate: [arrayLimit, '{PATH} exceeds the limit of 50 recent sessions']
    },
    lastUpdatedAt: { // When the overall document was last touched
        type: Date,
        default: Date.now,
    },
}, { timestamps: { createdAt: true, updatedAt: 'lastUpdatedAt' } }); // Use timestamps option

// Helper function for array limit validation
function arrayLimit(val) {
    return val.length <= 50; // Keep max 50 recent sessions
}

// Ensure efficient querying by user ID
CognitiveStateSchema.index({ user: 1 });

module.exports = mongoose.model('CognitiveState', CognitiveStateSchema);