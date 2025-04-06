// components/learning/PatternRecognitionChallenge.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { 
  BrainCircuit, 
  Clock, 
  Lightbulb, 
  Check, 
  X, 
  HelpCircle,
  RotateCcw, 
  ArrowRight,
  Send,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatternExample {
  input: any[];
  output: any;
}

interface PatternTestCase {
  input: any[];
  output: any;
  explanation: string;
}

interface PatternRecognitionProps {
  lessonId: string;
  patternType: 'sequence' | 'visual' | 'relationship' | 'rule';
  difficulty: number;
  examples: PatternExample[];
  testCases: PatternTestCase[];
  timeLimit?: number;
  hints?: string[];
  onComplete: (correct: boolean, attempts: number, timeTaken: number) => void;
  onProgressUpdate?: (progress: number) => void;
}

export default function PatternRecognitionChallenge({
  lessonId,
  patternType,
  difficulty,
  examples,
  testCases,
  timeLimit = 0,
  hints = [],
  onComplete,
  onProgressUpdate
}: PatternRecognitionProps) {
  // State
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState<number[]>(Array(testCases.length).fill(0));
  const [results, setResults] = useState<boolean[]>(Array(testCases.length).fill(false));
  const [showExplanation, setShowExplanation] = useState(false);
  const [remainingTime, setRemainingTime] = useState(timeLimit);
  const [currentHintIndex, setCurrentHintIndex] = useState(-1);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [challengeComplete, setChallengeComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Check if user answer matches the correct solution
  const checkAnswer = (): boolean => {
    const currentTest = testCases[currentTestIndex];
    // Convert to string for comparison to accommodate various types
    const normalizedAnswer = String(userAnswer).trim().toLowerCase();
    const normalizedCorrect = String(currentTest.output).trim().toLowerCase();
    
    return normalizedAnswer === normalizedCorrect;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
      timeTaken
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
  
  // Render pattern examples
  const renderPatternExamples = () => {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Pattern Examples:</h3>
        <div className="space-y-2">
          {examples.map((example, index) => (
            <div key={index} className="p-2 border border-zinc-800 rounded-md bg-zinc-900/50">
              <div className="flex flex-wrap gap-2 mb-1">
                {example.input.map((item, i) => (
                  <Badge key={i} variant="outline" className="bg-zinc-800">
                    {String(item)}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center">
                <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                <Badge variant="default" className="bg-emerald-800/80 hover:bg-emerald-800">
                  {String(example.output)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render current test case
  const renderCurrentTest = () => {
    if (challengeComplete) return null;
    
    const currentTest = testCases[currentTestIndex];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <span>Test Case {currentTestIndex + 1}/{testCases.length}</span>
            {results[currentTestIndex] && <Check className="h-4 w-4 text-green-500" />}
          </h3>
          
          {attempts[currentTestIndex] >= 2 && !results[currentTestIndex] && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={skipTestCase}
              className="text-xs"
            >
              Skip
            </Button>
          )}
        </div>
        
        <div className="p-3 border border-zinc-800 rounded-md bg-zinc-900/50">
          <div className="flex flex-wrap gap-2 mb-3">
            {currentTest.input.map((item, i) => (
              <Badge key={i} variant="outline" className="bg-zinc-800 text-base py-1 px-3">
                {String(item)}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Enter the next item in the pattern"
                  className="flex-1"
                  disabled={results[currentTestIndex]}
                  autoFocus
                />
                <Button 
                  type="submit" 
                  disabled={results[currentTestIndex] || userAnswer.trim() === ''}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {results[currentTestIndex] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert className="bg-emerald-950/30 text-emerald-200 border-emerald-800">
                <Check className="h-4 w-4" />
                <AlertTitle>Correct!</AlertTitle>
                <AlertDescription>
                  {currentTestIndex < testCases.length - 1 
                    ? "Great job! Moving to the next pattern..." 
                    : "Congratulations! You've completed all patterns."}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
          
          {showExplanation && !results[currentTestIndex] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert className="bg-red-950/30 text-red-200 border-red-900">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Incorrect</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>The correct answer is: <strong>{currentTest.output}</strong></p>
                  <p>{currentTest.explanation}</p>
                  <p className="text-sm">Try another pattern or use a hint to continue.</p>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
  
  // Render the challenge completion summary
  const renderCompletionSummary = () => {
    if (!challengeComplete) return null;
    
    const correctCount = results.filter(Boolean).length;
    const totalAttempts = attempts.reduce((sum, count) => sum + count, 0);
    const accuracy = Math.round((correctCount / testCases.length) * 100);
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-center py-4">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{accuracy}%</span>
            </div>
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle 
                className="text-zinc-800" 
                strokeWidth="10"
                stroke="currentColor" 
                fill="transparent" 
                r="40" 
                cx="50" 
                cy="50" 
              />
              <circle 
                className="text-primary" 
                strokeWidth="10"
                stroke="currentColor" 
                fill="transparent" 
                r="40" 
                cx="50" 
                cy="50" 
                strokeDasharray={`${2 * Math.PI * 40 * accuracy / 100} ${2 * Math.PI * 40 * (100 - accuracy) / 100}`}
                strokeDashoffset={`${Math.PI * 40 / 2}`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Patterns Solved:</span>
            <span>{correctCount}/{testCases.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Attempts:</span>
            <span>{totalAttempts}</span>
          </div>
          {timeLimit > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time Taken:</span>
              <span>{formatTime(timeLimit - remainingTime)}</span>
            </div>
          )}
          {hintsUsed > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Hints Used:</span>
              <span>{hintsUsed}</span>
            </div>
          )}
        </div>
        
        <div className="pt-2">
          <Button onClick={resetChallenge} variant="outline" className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" />
            Retry Challenge
            // components/learning/PatternRecognitionChallenge.tsx (continued)
          </Button>
          
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              {accuracy >= 80 
                ? "Excellent pattern recognition skills! Your neural pathways are strengthening rapidly."
                : accuracy >= 50
                  ? "Good progress on your pattern recognition abilities. Keep practicing to improve further."
                  : "Your pattern recognition skills need more training. Don't worry - that's why we're here!"}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };
  
  // Render hints panel
  const renderHints = () => {
    if (challengeComplete || !hints.length) return null;
    
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <span>Neural Assistance</span>
          </h3>
          <Badge variant="outline" className="text-xs">
            {currentHintIndex + 1}/{hints.length} Hints
          </Badge>
        </div>
        
        {currentHintIndex >= 0 ? (
          <div className="p-3 border border-amber-900/30 bg-amber-950/20 rounded-md">
            <p className="text-sm">{hints[currentHintIndex]}</p>
            {currentHintIndex < hints.length - 1 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={showNextHint} 
                className="mt-2 text-xs text-amber-400"
              >
                Reveal Next Hint
              </Button>
            )}
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={showNextHint}
            className="w-full border border-dashed border-amber-900/30 text-amber-400"
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            Reveal a Hint
          </Button>
        )}
      </div>
    );
  };
  
  // Main render
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <span>Pattern Recognition Training</span>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {timeLimit > 0 && (
              <Badge 
                variant="outline" 
                className={cn(
                  "flex items-center gap-1",
                  remainingTime < Math.min(30, timeLimit * 0.2) ? "text-red-400 animate-pulse" : ""
                )}
              >
                <Clock className="h-3 w-3" />
                <span>{formatTime(remainingTime)}</span>
              </Badge>
            )}
            
            <Badge 
              variant={difficulty > 3 ? "destructive" : "secondary"} 
              className="text-xs"
            >
              Level {difficulty}
            </Badge>
          </div>
        </div>
        <CardDescription>
          Identify the patterns and determine the next element in each sequence.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>Progress</span>
            <span>{Math.round(completionPercentage)}%</span>
          </div>
          <Progress value={completionPercentage} className="h-1" />
        </div>
        
        {renderPatternExamples()}
        {renderCurrentTest()}
        {renderCompletionSummary()}
        {renderHints()}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {!challengeComplete && attempts[currentTestIndex] >= 3 && !results[currentTestIndex] && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setUserAnswer(String(testCases[currentTestIndex].output));
                  }}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Show Answer
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Reveal the correct answer for this pattern
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardFooter>
    </Card>
  );
}