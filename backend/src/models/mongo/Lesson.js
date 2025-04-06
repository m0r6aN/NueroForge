// neuroforge/backend/src/models/mongo/Lesson.js
// Purpose: Mongoose schema for individual learning modules/microlearnings
const mongoose = require("mongoose");

const focusTimerSchema = new mongoose.Schema({
  duration: {
    type: Number, // Duration in seconds
    required: true,
    default: 1500 // Default to 25 minutes (Pomodoro standard)
  },
  breakInterval: {
    type: Number, // Break interval in seconds
    default: 300 // Default to 5 minutes
  },
  cycles: {
    type: Number, // Number of focus/break cycles
    default: 1
  },
  task: {
    type: String, // Task or prompt for the focus session
    required: true
  },
  techniques: [{
    type: String, // Focus techniques to apply (e.g., "deep work", "pomodoro", "timeboxing")
    enum: ["deep_work", "pomodoro", "timeboxing", "flow_state"]
  }],
  recommendedAudioPreset: {
    type: String, // Recommended audio preset
    enum: ["focus", "deep_learning", "creative", "relaxation", null],
    default: "focus"
  },
  difficulty: {
    type: Number, // 1-5 scale
    default: 2
  }
});


const patternRecognitionSchema = new mongoose.Schema({
  patternType: {
    type: String,
    enum: ['sequence', 'visual', 'relationship', 'rule'],
    required: true
  },
  difficulty: {
    type: Number, // 1-5 scale
    default: 1
  },
  examples: [{
    input: [mongoose.Schema.Types.Mixed], // Could be numbers, strings, objects based on pattern type
    output: mongoose.Schema.Types.Mixed
  }],
  testCases: [{
    input: [mongoose.Schema.Types.Mixed],
    output: mongoose.Schema.Types.Mixed,
    explanation: String
  }],
  timeLimit: { // Optional time limit in seconds
    type: Number,
    default: 0 // 0 means no time limit
  },
  hints: [String] // Optional hints that can be shown to the user
});

const LessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please add a lesson title"],
    trim: true,
  },
  subject: {
    // Link to the parent subject
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
    index: true,
  },
  contentType: {
    type: String,
    enum: [
      "text",
      "video",
      "interactive",
      "quiz",
      "pattern_recognition",
      "focus_exercise",
      "memory_palace",
    ],
    required: true,
    default: "text",
  },
  lessonType: {
    type: String,
    enum: ['content', 'quiz', 'patternRecognition', 'focusTimer'],
    default: 'content'
  },
  patternRecognition: patternRecognitionSchema,
  focusTimer: focusTimerSchema,
  content: {
    // The actual learning material
    // Could be structured text, video URL, interactive component config, quiz questions etc.
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  estimatedDurationMinutes: {
    // Approx time for the microlearning chunk
    type: Number,
    min: 1,
    max: 15, // Encourage microlearning
    default: 5,
  },
  learningObjectives: {
    type: [String],
  },
  tags: {
    // Specific tags for this lesson
    type: [String],
    index: true,
  },
  keyTerms: {
    // Added for AI context
    type: [String],
    required: false,
  },
  cognitiveEnhancement: {
    recommendedAudioPreset: {
      type: String,
      enum: [
        "focus",
        "creative",
        "deep_learning",
        "relaxation",
        "custom",
        null,
      ],
      default: null, // Specific lessons might override subject default or have no recommendation
      required: false,
    },
    focusDemand: {
      // More specific demand for this particular lesson
      type: Number,
      min: 1,
      max: 10,
      required: false,
    },
    creativityDemand: {
      type: Number,
      min: 1,
      max: 10,
      required: false,
    },
    recommendationReason: {
      // Specific reason for this lesson's preset suggestion
      type: String,
      trim: true,
      maxlength: 200,
      required: false,
    },
  },
  // Fields relevant for SRS
  isReviewable: {
    // Can this specific lesson content be reviewed via SRS? (e.g., facts, concepts, not intro videos)
    type: Boolean,
    default: true,
  },
  // Versioning for content changes
  version: {
    type: Number,
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

LessonSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

LessonSchema.index({ subject: 1, orderIndex: 1 }); // If adding manual order within subject

module.exports = mongoose.model("Lesson", LessonSchema);
