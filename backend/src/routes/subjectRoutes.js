// neuroforge/backend/src/routes/subjectRoutes.js
// Purpose: Defines routes for subject management
const express = require('express');
const subjectController = require('../controllers/subjectController');
const { protect } = require('../middleware/authMiddleware'); // Middleware to protect routes

const router = express.Router();

// Apply authentication middleware to all subject routes
router.use(protect);

router.route('/')
    .get(subjectController.getSubjects) // Get ordered list of subjects
    .post(subjectController.addSubject); // Add a new subject

router.route('/:id')
    .get(subjectController.getSubjectById)
    .put(subjectController.updateSubject) // For content updates
    .delete(subjectController.deleteSubject);

router.post('/reorder', subjectController.manualReorderSubjects); // Handle manual drag-drop reordering
router.post('/import', subjectController.importSubjects);
router.get('/export', subjectController.exportSubjects);

// Route to get the optimal learning path (could be part of getSubjects or separate)
router.get('/path/optimal', subjectController.getOptimalPath);

module.exports = router;