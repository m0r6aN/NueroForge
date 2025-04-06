// Enhanced transition logic for LessonCompletionPanel to NextLesson flow
// This will be integrated into our existing LessonCompletionPanel.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // We'll use framer-motion for smooth animations
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Brain, Zap, Award } from 'lucide-react';
import { fetchNextPath } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

// This component will show after a lesson is completed and handle the transition to the next lesson
export default function LessonCompletionPanel({ 
  lessonId, 
  lessonTitle, 
  subjectId,
  subjectTitle,
  xpAwarded,
  newAchievements = [],
  onContinue
}) {
  const router = useRouter();
  const [transitionState, setTransitionState] = useState('initial'); // 'initial', 'celebrating', 'loading-next', 'ready-next'
  const [nextLessonData, setNextLessonData] = useState(null);
  
  // Fetch the next recommended lesson as soon as component mounts
  useEffect(() => {
    async function loadNextLesson() {
      try {
        // First show the celebration for 2 seconds
        setTransitionState('celebrating');
        
        // Fetch next lesson while celebration is happening
        const response = await fetchNextPath();
        if (response.success && response.data) {
          setNextLessonData(response.data);
          
          // After celebration, show the next lesson recommendation
          setTimeout(() => {
            setTransitionState('ready-next');
          }, 2000);
        } else {
          // If no next lesson, still move to ready state but without next data
          setTimeout(() => {
            setTransitionState('ready-next');
          }, 2000);
        }
      } catch (error) {
        console.error('Error fetching next lesson:', error);
        setTransitionState('ready-next'); // Move to ready state even on error
        toast({
          title: "Couldn't load next lesson",
          description: "You can continue from your dashboard",
          variant: "destructive",
        });
      }
    }
    
    loadNextLesson();
  }, []);
  
  // Handle continue button click
  const handleContinue = () => {
    if (nextLessonData?.lessonId) {
      setTransitionState('loading-next');
      // Add slight delay for animation to complete
      setTimeout(() => {
        router.push(`/learn/lesson/${nextLessonData.lessonId}`);
      }, 500);
    } else {
      // If no next lesson, go to dashboard
      router.push('/dashboard');
    }
    
    if (onContinue) onContinue();
  };
  
  // Handle return to subject button click
  const handleReturnToSubject = () => {
    router.push(`/subjects/${subjectId}`);
  };
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionState}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-zinc-900 border-zinc-800 max-w-2xl mx-auto">
          {transitionState === 'celebrating' && (
            <>
              <CardHeader className="text-center pb-2">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                </motion.div>
                <CardTitle className="text-2xl">Lesson Complete!</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  You've completed <span className="text-primary font-medium">{lessonTitle}</span>
                </p>
                {xpAwarded > 0 && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mb-4 inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 text-blue-400"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    <span>+{xpAwarded} XP</span>
                  </motion.div>
                )}
                {newAchievements.length > 0 && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="mb-4"
                  >
                    <p className="text-sm mb-2">New achievements unlocked:</p>
                    <div className="flex justify-center gap-2">
                      {newAchievements.map((achievement) => (
                        <div key={achievement.id} className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">
                          <Award className="h-4 w-4" />
                          <span>{achievement.title}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </>
          )}
          
          {transitionState === 'ready-next' && nextLessonData && (
            <>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span>Next Recommended Lesson</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="font-medium text-lg">
                    {nextLessonData.lessonTitle || 'Continue your learning path'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {nextLessonData.rationale || 'Continue to your next recommended lesson.'}
                  </p>
                  
                  {nextLessonData.recommendedAudioPreset && (
                    <div className="mt-2 p-3 rounded-md border border-blue-800/30 bg-blue-900/10">
                      <p className="text-sm flex items-start gap-2">
                        <Zap className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>
                          <span className="font-medium text-blue-400">Optimization tip:</span>{' '}
                          Activate the {nextLessonData.recommendedAudioPreset} audio preset for optimal neural enhancement with this content.
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 justify-between">
                <Button variant="outline" onClick={handleReturnToSubject}>
                  Return to Subject
                </Button>
                <Button onClick={handleContinue} className="gap-1">
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </>
          )}
          
          {transitionState === 'ready-next' && !nextLessonData && (
            <>
              <CardHeader className="pb-2">
                <CardTitle>Continue Your Neural Journey</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You've completed this lesson. Return to the subject or explore your dashboard for more learning opportunities.
                </p>
              </CardContent>
              <CardFooter className="flex gap-2 justify-between">
                <Button variant="outline" onClick={handleReturnToSubject}>
                  Return to Subject
                </Button>
                <Button onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                </Button>
              </CardFooter>
            </>
          )}
          
          {transitionState === 'loading-next' && (
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-2">Loading your next neural enhancement...</p>
              <div className="flex justify-center">
                <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}