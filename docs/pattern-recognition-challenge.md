# Pattern Recognition Challenge

## Overview
The Pattern Recognition Challenge is an interactive lesson type that presents users with pattern-based problems to enhance cognitive abilities. It supports different pattern types (sequence, visual, relationship, rule), difficulty levels, and adaptive learning.

## Schema
Pattern Recognition Challenge data is stored as part of the Lesson schema:

```javascript
// Lesson Schema Extension
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
    input: [mongoose.Schema.Types.Mixed], // Array of items in pattern
    output: mongoose.Schema.Types.Mixed   // Result of the pattern
  }],
  testCases: [{
    input: [mongoose.Schema.Types.Mixed], // Test case input
    output: mongoose.Schema.Types.Mixed,  // Expected answer
    explanation: String                   // Explanation of pattern
  }],
  timeLimit: {
    type: Number,
    default: 0 // 0 means no time limit
  },
  hints: [String] // Optional hints
});
```

## Components & Files

### Frontend
- `PatternRecognitionChallenge.tsx` - Main component to display and interact with challenges
- `usePatternRecognition.js` - Custom hook for challenge logic and state management

### Backend
- `patternRecognitionController.js` - API endpoints for challenge data and submissions
- Added to `learningRoutes.js` for routing

## API Endpoints

### GET /api/learning/challenge/:lessonId
Retrieves challenge data for a specific lesson

**Response:**
```json
{
  "success": true,
  "data": {
    "lessonId": "...",
    "title": "Pattern Recognition Level 1",
    "patternType": "sequence",
    "difficulty": 2,
    "examples": [...],
    "testCases": [...],
    "timeLimit": 120,
    "hints": [...],
    "progress": 0
  }
}
```

### POST /api/learning/challenge/:lessonId/submit
Submits completed challenge results

**Request Body:**
```json
{
  "correct": true,      // Whether all test cases were solved correctly
  "attempts": 5,        // Total number of attempts
  "timeTaken": 65,      // Time taken in seconds
  "hintsUsed": 2        // Number of hints used
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "score": 85,
    "isPassing": true,
    "previousBest": 70,
    "attempts": 3,
    "gamification": {
      "xpAwarded": 60,
      "newAchievements": [...],
      "levelUpInfo": {...}
    }
  }
}
```

## Scoring System

The challenge uses a sophisticated scoring system that considers:

1. **Correctness** - Base score of 100 for correct answers, scaled based on attempts
2. **Time** - Bonus for completing under time limit
3. **Hints** - Slight penalty for using hints
4. **Difficulty** - Higher difficulty lessons award more XP

## Integration with Gamification

Pattern Recognition Challenges integrate with the NeuroForge gamification system:

1. **XP Awards** - Based on challenge difficulty, score, and performance
2. **Achievements** - Tracks pattern challenges completed for achievement unlocks
3. **Streaks** - Counts towards daily activity streaks

## User Experience Flow

1. User is presented with pattern examples to understand the pattern logic
2. Multiple test cases challenge the user to apply the pattern
3. Hints are available if the user struggles
4. Immediate feedback is provided after each attempt
5. Comprehensive summary is shown upon completion
6. XP and achievements are awarded based on performance

## Accessibility Considerations

- All interactions are keyboard accessible
- Progress is clearly indicated visually
- Color is not the only means of conveying information
- Animations can be disabled for users with vestibular disorders

## Performance Optimization

The component has been optimized for performance:

1. **State Management** - Custom hook extracts and optimizes state logic
2. **Memoization** - React.memo and useMemo for expensive calculations
3. **Animation Efficiency** - CSS animations where possible, JS animations with requestAnimationFrame
4. **Lazy Loading** - Test cases loaded progressively

## Best Practices for Implementation

When creating new Pattern Recognition Challenges:

1. **Start Simple** - Begin with clear, unambiguous patterns
2. **Provide Examples** - Always include 2-3 clear examples of the pattern
3. **Progressive Difficulty** - Arrange test cases from easiest to hardest
4. **Clear Explanations** - Write concise explanations for incorrect attempts
5. **Thoughtful Hints** - Design hints that guide without giving away answers
6. **Reasonable Time Limits** - Set time limits appropriate to difficulty

## Edge Cases Handled

The implementation handles various edge cases:

1. **Network Errors** - Graceful fallback for API failures
2. **Input Validation** - Normalized input handling for various data types
3. **Mobile Responsiveness** - Adapts to all screen sizes
4. **Timeouts** - Handles browser tab inactive during timed challenges
5. **Accessibility** - Keyboard navigation and screen reader support

## Potential Future Enhancements

1. **Pattern Types** - Expand to include matrix patterns, logical puzzles
2. **Multi-step Patterns** - Patterns requiring multiple transformations
3. **Visual Patterns** - Image-based pattern recognition
4. **Collaborative Challenges** - Team-based pattern solving with leaderboards
5. **AI Difficulty Adaptation** - Dynamic difficulty based on user performance history

## Example Pattern Types

### Sequence Patterns
- Arithmetic sequences (add/subtract constant)
- Geometric sequences (multiply/divide)
- Fibonacci-style sequences
- Prime number sequences

### Relationship Patterns
- Anagrams
- Word relationships (synonym, antonym)
- Category relationships

### Visual Patterns
- Shape transformations
- Color patterns
- Spatial arrangements

### Rule Patterns
- Logic puzzles
- If-then rules
- Multi-variable rules