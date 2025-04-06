// neuroforge/backend/src/models/mongo/Subject.js
// Purpose: Mongoose schema for Subjects
const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a subject title'],
        trim: true,
        maxlength: [150, 'Title cannot be more than 150 characters']
    },
    description: {
        type: String,
        required: false,
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    // Dependencies: Array of Subject ObjectIds this subject depends on
    prerequisites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }],
    tags: {
        type: [String],
        required: false
    },
    // Add fields for curriculum versioning if needed
    version: {
        type: Number,
        default: 1
    },
    // Manual ordering hint (optional, could be used alongside graph)
    orderIndex: {
        type: Number,
        default: 0
    },
    // Store learning assets related to the subject (or link to Lesson model)
    // Example: Array of lesson IDs, or direct asset links
    contentStructure: {
        type: mongoose.Schema.Types.Mixed // Flexible structure for modules, lessons, etc.
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Or true if creation must be tracked
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    cognitiveEnhancement: {
        recommendedAudioPreset: {
            type: String,
            enum: ['focus', 'creative', 'deep_learning', 'relaxation', 'custom', null], // Match keys from useBinauralBeats hook + null
            default: null,
            required: false,
        },
        // Optional: General cognitive demands for the subject overall
        focusDemand: { // Scale 1-10: How much sustained focus is generally needed?
            type: Number,
            min: 1,
            max: 10,
            required: false,
        },
        creativityDemand: { // Scale 1-10: How much creative/lateral thinking is involved?
            type: Number,
            min: 1,
            max: 10,
            required: false,
        },
        recommendationReason: { // Optional text explaining the preset suggestion
            type: String,
            trim: true,
            maxlength: 200,
            required: false,
        }
    },

});

// Middleware to update `updatedAt` field on save
SubjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add indexes for frequent queries
SubjectSchema.index({ tags: 1 });
SubjectSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Subject', SubjectSchema);