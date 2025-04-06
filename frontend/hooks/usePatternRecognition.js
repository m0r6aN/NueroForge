// hooks/usePatternRecognition.js

import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to manage pattern recognition challenge state and logic
 * 
 * @param {Object} options - Hook configuration options
 * @param {Array} options.testCases - Array of test cases for the challenge
 * @param {number} options.timeLimit - Time limit in seconds (0 for no limit)
 * @param {Array} options.hints - Array of available hints
 * @param {function} options.onComplete - Callback when challenge is completed
 * @param {function} options.onProgressUpdate - Optional callback for progress updates
 */
export function usePatternRecognition({
  testCases,
  timeLimit = 0,
  hints = [],
  onComplete,
  onProgressUpdate
}) {
  // State
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState(Array(testCases.length).fill(0));
  const [results, setResults] = useState(Array(testCases.length).fill(false));
  const [showExplanation, setShowExplanation] = useState(false);
  const [remainingTime, setRemainingTime] = useState(timeLimit);
  const [currentHintIndex, setCurrentHintIndex] = useState(-1);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [challengeComplete, setChallengeComplete] = useState(false);
  const timerRef = useRef(null);
  
  // Calculate completion percentage
  const completionPercentage = results.filter(Boolean).length / testCases.length * 100;
  
  // Report progress to parent
  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(completionPercentage);
    }
  }, [completionPercentage, onProgressUpdate]);
  
  // Handle timer if timeLimit is set
  useEffect(() => {
    if (timeLimit <= 0 || challengeComplete) return;
    
    if (remainingTime > 0) {
      timerRef.current = setTimeout(() => {
        setRemainingTime(prev => prev - 1);
      }, 1000);
    } else {
      // Time's up - complete the challenge with current progress
      finishChallenge();
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [remainingTime, timeLimit, challengeComplete]);
  
  // Check if user answer matches the correct solution
  const checkAnswer = () => {
    const currentTest = testCases[currentTestIndex];
    // Convert to string for comparison to accommodate various types
    const normalizedAnswer = String(userAnswer).trim().toLowerCase();
    const normalizedCorrect = String(currentTest.output).trim().toLowerCase();
    
    return normalizedAnswer === normalizedCorrect;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    // Increment attempt counter for current test
    const newAttempts = [...attempts];
    newAttempts[currentTestIndex]++;
    setAttempts(newAttempts);
    
    const isCorrect = checkAnswer();
    
    // Update results
    const newResults = [...results];
    newResults[currentTestIndex] = isCorrect;
    setResults(newResults);
    
    // Show explanation if incorrect
    if (!isCorrect) {
      setShowExplanation(true);
    } else {
      // If correct, move to next test after a brief pause
      setTimeout(() => {
        if (currentTestIndex < testCases.length - 1) {
          setCurrentTestIndex(currentTestIndex + 1);
          setUserAnswer('');
          setShowExplanation(false);
          setCurrentHintIndex(-1);
        } else {
          // All tests complete
          finishChallenge();
        }
      }, 1500);
    }
  };
  
  // Show next hint
  const showNextHint = () => {
    if (currentHintIndex < hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
      setHintsUsed(hintsUsed + 1);
    }
  };
  
  // Skip current test case after multiple attempts
  const skipTestCase = () => {
    if (currentTestIndex < testCases.length - 1) {
      setCurrentTestIndex(currentTestIndex + 1);
      setUserAnswer('');
      setShowExplanation(false);
      setCurrentHintIndex(-1);
    } else {
      // All tests complete
      finishChallenge();
    }
  };
  
  // Finish challenge and report results
  const finishChallenge = () => {
    setChallengeComplete(true);
    
    const correctCount = results.filter(Boolean).length;
    const totalAttempts = attempts.reduce((sum, count) => sum + count, 0);
    const timeTaken = timeLimit > 0 ? (timeLimit - remainingTime) : 0;
    
    // Call completion handler
    onComplete(
      correctCount === testCases.length, 
      totalAttempts,
      timeTaken,
      hintsUsed
    );
  };
  
  // Retry challenge
  const resetChallenge = () => {
    setCurrentTestIndex(0);
    setUserAnswer('');
    setAttempts(Array(testCases.length).fill(0));
    setResults(Array(testCases.length).fill(false));
    setShowExplanation(false);
    setRemainingTime(timeLimit);
    setCurrentHintIndex(-1);
    setHintsUsed(0);
    setChallengeComplete(false);
  };
  
  // Show answer directly (for multiple failed attempts)
  const showAnswer = () => {
    const currentTest = testCases[currentTestIndex];
    setUserAnswer(String(currentTest.output));
  };
  
  return {
    // State
    currentTestIndex,
    userAnswer,
    attempts,
    results,
    showExplanation,
    remainingTime,
    currentHintIndex,
    hintsUsed,
    challengeComplete,
    completionPercentage,
    
    // Methods
    setUserAnswer,
    handleSubmit,
    showNextHint,
    skipTestCase,
    resetChallenge,
    showAnswer,
    
    // Current test case
    currentTest: testCases[currentTestIndex]
  };
}

// Helper functions
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}