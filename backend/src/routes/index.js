// neuroforge/backend/src/routes/index.js
// ... (add aiRoutes and learningRoutes)
const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const subjectRoutes = require('./subjectRoutes');
const learningRoutes = require('./learningRoutes'); 
const aiRoutes = require('./aiRoutes');
const gamificationRoutes = require('./gamificationRoutes'); 

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/subjects', subjectRoutes);
router.use('/learning', learningRoutes);
router.use('/ai', aiRoutes); 
router.use('/gamification', gamificationRoutes);
// ... use other routes

module.exports = router;