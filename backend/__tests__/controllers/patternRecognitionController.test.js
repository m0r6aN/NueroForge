// __tests__/controllers/patternRecognitionController.test.js

const mongoose = require('mongoose');
const httpMocks = require('node-mocks-http');
const {
  getPatternChallenge,
  submitPatternChallengeResults
} = require('@/controllers/patternRecognitionController');
const Lesson = require('@/models/mongo/Lesson');
const UserProgress = require('@/models/mongo/UserProgress');
const User = require('@/models/mongo/User');
const { GamificationServiceInstance } = require('@/services/GamificationService');

// Mock the required models and services
jest.mock('@/models/mongo/Lesson');
jest.mock('@/models/mongo/UserProgress');
jest.mock('@/models/mongo/User');
jest.mock('@/services/GamificationService');
jest.mock('@/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn()
}));

describe('Pattern Recognition Controller', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = httpMocks.createRequest({
      user: { id: 'testUserId' },
      params: { lessonId: 'testLessonId' }
    });
    res = httpMocks.createResponse();
    next = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  describe('getPatternChallenge', () => {
    it('returns pattern challenge data successfully', async () => {
      // Mock a valid pattern recognition lesson
      const mockLesson = {
        _id: 'testLessonId',
        title: 'Test Pattern Lesson',
        lessonType: 'patternRecognition',
        patternRecognition: {
          patternType: 'sequence',
          difficulty: 3,
          examples: [{ input: [1, 2, 3], output: 4 }],
          testCases: [{ input: [5, 6, 7], output: 8, explanation: 'Test' }],
          timeLimit: 120,
          hints: ['Hint 1', 'Hint 2']
        }
      };
      
      // Mock user progress
      const mockProgress = { progress: 50 };
      
      // Setup mocks
      Lesson.findById.mockResolvedValue(mockLesson);
      UserProgress.findOne.mockResolvedValue(mockProgress);
      
      // Call the controller
      await getPatternChallenge(req, res, next);
      
      // Assertions
      expect(Lesson.findById).toHaveBeenCalledWith('testLessonId');
      expect(UserProgress.findOne).toHaveBeenCalledWith({ 
        user: 'testUserId', 
        lesson: 'testLessonId' 
      });
      
      // Check response
      const responseData = res._getJSONData();
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        lessonId: 'testLessonId',
        title: 'Test Pattern Lesson',
        patternType: 'sequence',
        difficulty: 3,
        progress: 50
      });
    });
    
    it('returns 404 when lesson not found', async () => {
      // Mock lesson not found
      Lesson.findById.mockResolvedValue(null);
      
      // Call the controller
      await getPatternChallenge(req, res, next);
      
      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
    
    it('returns 400 when lesson is not a pattern challenge', async () => {
      // Mock an invalid lesson type
      const mockLesson = {
        _id: 'testLessonId',
        title: 'Test Content Lesson',
        lessonType: 'content'
      };
      
      Lesson.findById.mockResolvedValue(mockLesson);
      
      // Call the controller
      await getPatternChallenge(req, res, next);
      
      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
  });
  
  describe('submitPatternChallengeResults', () => {
    beforeEach(() => {
      // Setup request with valid submission data
      req.body = {
        correct: true,
        attempts: 2,
        timeTaken: 45,
        hintsUsed: 1
      };
      
      // Mock lesson
      const mockLesson = {
        _id: 'testLessonId',
        lessonType: 'patternRecognition',
        patternRecognition: {
          difficulty: 3,
          timeLimit: 120
        }
      };
      
      Lesson.findById.mockResolvedValue(mockLesson);
      
      // Mock GamificationServiceInstance
      GamificationServiceInstance.awardXp.mockResolvedValue({
        leveledUp: false,
        newLevel: 5,
        newXp: 500
      });
      
      GamificationServiceInstance.checkAndAwardAchievement.mockResolvedValue([]);
      
      // Mock User
      User.findByIdAndUpdate.mockResolvedValue({
        stats: { patternChallengesCompleted: 5 }
      });
      
      User.findById.mockResolvedValue({
        stats: { patternChallengesCompleted: 5 }
      });
    });
    
    it('creates new progress when user has none', async () => {
      // Mock no existing progress
      UserProgress.findOne.mockResolvedValue(null);
      UserProgress.create.mockResolvedValue({
        _id: 'newProgressId',
        user: 'testUserId',
        lesson: 'testLessonId',
        score: 90,
        status: 'completed'
      });
      
      // Call the controller
      await submitPatternChallengeResults(req, res, next);
      
      // Assertions
      expect(UserProgress.create).toHaveBeenCalled();
      expect(UserProgress.create.mock.calls[0][0]).toMatchObject({
        user: 'testUserId',
        lesson: 'testLessonId',
        status: 'completed'
      });
      
      // Check response
      const responseData = res._getJSONData();
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.isPassing).toBe(true);
    });
    
    it('updates existing progress when score improves', async () => {
      // Mock existing progress with lower score
      const mockExistingProgress = {
        _id: 'existingProgressId',
        user: 'testUserId',
        lesson: 'testLessonId',
        score: 70,
        attempts: 1,
        save: jest.fn()
      };
      
      UserProgress.findOne.mockResolvedValue(mockExistingProgress);
      
      // Call the controller
      await submitPatternChallengeResults(req, res, next);
      
      // Assertions
      expect(mockExistingProgress.save).toHaveBeenCalled();
      expect(mockExistingProgress.score).toBeGreaterThan(70); // Score should improve
      expect(mockExistingProgress.attempts).toBe(2); // Attempts incremented
      
      // Check response
      const responseData = res._getJSONData();
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.success).toBe(true);
    });
    
    it('awards XP based on difficulty and score', async () => {
      // Mock first completion (new progress)
      UserProgress.findOne.mockResolvedValue(null);
      UserProgress.create.mockResolvedValue({
        _id: 'newProgressId',
        status: 'completed',
        completedAt: new Date()
      });
      
      // Call the controller
      await submitPatternChallengeResults(req, res, next);
      
      // Assertions
      expect(GamificationServiceInstance.awardXp).toHaveBeenCalled();
      // XP should be based on difficulty (3) and score (100% for correct=true)
      // Formula: 30 * difficulty * (score/100) = 30 * 3 * 1 = 90
      expect(GamificationServiceInstance.awardXp.mock.calls[0][1]).toBe(90);
      
      // Check user stats update
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'testUserId',
        { $inc: { 'stats.patternChallengesCompleted': 1 } },
        { new: true }
      );
      
      // Check achievement check
      expect(GamificationServiceInstance.checkAndAwardAchievement).toHaveBeenCalledWith(
        'testUserId',
        'PATTERN_CHALLENGE_COUNT',
        { count: 5 },
        expect.anything()
      );
    });
    
    it('does not award XP for repeat completions with no score improvement', async () => {
      // Mock existing completion with higher score
      const mockExistingProgress = {
        _id: 'existingProgressId',
        user: 'testUserId',
        lesson: 'testLessonId',
        score: 100, // Higher than what would be calculated
        status: 'completed',
        completedAt: new Date(Date.now() - 86400000), // Completed yesterday
        attempts: 1,
        save: jest.fn()
      };
      
      UserProgress.findOne.mockResolvedValue(mockExistingProgress);
      
      // Call the controller
      await submitPatternChallengeResults(req, res, next);
      
      // Assertions
      expect(GamificationServiceInstance.awardXp).not.toHaveBeenCalled();
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(GamificationServiceInstance.checkAndAwardAchievement).not.toHaveBeenCalled();
      
      // Attempts should still increment
      expect(mockExistingProgress.attempts).toBe(2);
      expect(mockExistingProgress.save).toHaveBeenCalled();
    });
    
    it('returns 400 if required data is missing', async () => {
      // Missing required fields
      req.body = { attempts: 2 }; // missing 'correct'
      
      // Call the controller
      await submitPatternChallengeResults(req, res, next);
      
      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
    
    it('returns 404 if lesson is not found or not a pattern challenge', async () => {
      // Mock lesson not found
      Lesson.findById.mockResolvedValue(null);
      
      // Call the controller
      await submitPatternChallengeResults(req, res, next);
      
      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
  });
});