// neuroforge/backend/src/controllers/subjectController.js
// Purpose: Handles business logic for subject routes
const Subject = require('../models/mongo/Subject'); // Assuming MongoDB model
const SubjectOrderingService = require('../services/SubjectOrderingService'); // Import the service
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

// Get all subjects, potentially ordered
exports.getSubjects = async (req, res, next) => {
    try {
        // Use the service to get the ordered list
        // This service would handle topological sort, user data integration, caching etc.
        const orderedSubjects = await SubjectOrderingService.getOrderedSubjects(req.user.id); // Pass userId if needed for personalization

        res.status(200).json({
            success: true,
            count: orderedSubjects.length,
            data: orderedSubjects
        });
    } catch (error) {
        logger.error('Error getting subjects:', error);
        next(new ApiError('Server error while retrieving subjects', 500));
    }
};

// Add a new subject
exports.addSubject = async (req, res, next) => {
    try {
        const { title, description, tags, prerequisites } = req.body;

        // Basic validation
        if (!title) {
            return next(new ApiError('Subject title is required', 400));
        }

        const newSubject = await Subject.create({
            title,
            description,
            tags,
            prerequisites: prerequisites || [], // Array of Subject ObjectIds
            createdBy: req.user.id // Assuming user info is attached by auth middleware
        });

        // Trigger cache invalidation or reordering calculation asynchronously
        SubjectOrderingService.handleSubjectChange(newSubject._id, 'add').catch(err => {
            logger.error('Error triggering subject change handler:', err)
        });

        res.status(201).json({
            success: true,
            data: newSubject
        });
    } catch (error) {
        logger.error('Error adding subject:', error);
        if (error.name === 'ValidationError') {
             return next(new ApiError(error.message, 400));
        }
        next(new ApiError('Server error while adding subject', 500));
    }
};

// --- Placeholder functions for other operations ---

exports.getSubjectById = async (req, res, next) => {
    // ... implementation ... findById
     res.status(200).json({ success: true, message: `Get subject ${req.params.id}` });
};

exports.updateSubject = async (req, res, next) => {
    // ... implementation ... findByIdAndUpdate
    // Trigger SubjectOrderingService.handleSubjectChange(id, 'update')
     res.status(200).json({ success: true, message: `Update subject ${req.params.id}` });
};

exports.deleteSubject = async (req, res, next) => {
    // ... implementation ... findByIdAndDelete
    // Trigger SubjectOrderingService.handleSubjectChange(id, 'delete')
     res.status(200).json({ success: true, message: `Delete subject ${req.params.id}` });
};

exports.manualReorderSubjects = async (req, res, next) => {
    // ... implementation ... Update order field based on drag-drop data
    // This might bypass the graph algorithm temporarily or adjust weights
     res.status(200).json({ success: true, message: `Subjects reordered manually` });
};

exports.importSubjects = async (req, res, next) => {
     res.status(200).json({ success: true, message: `Subjects imported` });
};

exports.exportSubjects = async (req, res, next) => {
     res.status(200).json({ success: true, message: `Subjects exported` });
};

exports.getOptimalPath = async (req, res, next) => {
    // Delegate to the SubjectOrderingService
     res.status(200).json({ success: true, message: `Optimal path generated` });
};