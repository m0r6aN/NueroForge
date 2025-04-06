// neuroforge/frontend/app/(app)/learn/lesson/[lessonId]/page.tsx


import { useNeuroForgeWebSocket } from '@/components/providers/websocket-provider'; 
import FocusTimer from '@/components/learning/FocusTimer';
import { submitFocusTimerResults } from '@/lib/api';
import { useEffect } from 'react';
import { WebSocketStatus } from '@/hooks/useWebSocket';

export default function LessonPage() {
    // ... existing state and hooks (params, toast, useBinauralBeats, useState, useEffect for lesson fetch) ...
    const { sendMessage, status: wsStatus } = useNeuroForgeWebSocket(); // Use the hook
    const lessonId = params?.lessonId as string; // Already getting lessonId

    // Effect to send session_start and session_end
    useEffect(() => {
         if (lessonId && lessonData && wsStatus === WebSocketStatus.OPEN) { // Only send if connected and data loaded
            // Send session start when lesson data is loaded
            sendMessage({
                type: 'session_start',
                payload: {
                    context: {
                        type: 'lesson',
                        id: lessonId,
                        title: lessonData.title, // Include title if available
                    }
                }
            });

            const startTime = Date.now();

           // Render appropriate lesson type
return (
    <div className="container py-6 space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      
      {lesson.lessonType === 'patternRecognition' ? (
        <PatternRecognitionChallenge 
          lessonId={lessonId}
          patternType={lesson.patternRecognition.patternType}
          difficulty={lesson.patternRecognition.difficulty}
          examples={lesson.patternRecognition.examples}
          testCases={lesson.patternRecognition.testCases}
          timeLimit={lesson.patternRecognition.timeLimit}
          hints={lesson.patternRecognition.hints}
          onComplete={handlePatternChallengeComplete}
          onProgressUpdate={() => {}} // Optional progress update handler
        />
      ) : lesson.lessonType === 'focusTimer' ? (
        <FocusTimer
          lessonId={lessonId}
          title={lesson.title}
          description={lesson.description}
          task={lesson.focusTimer.task}
          duration={lesson.focusTimer.duration}
          breakInterval={lesson.focusTimer.breakInterval}
          cycles={lesson.focusTimer.cycles}
          techniques={lesson.focusTimer.techniques}
          recommendedAudioPreset={lesson.focusTimer.recommendedAudioPreset}
          difficulty={lesson.focusTimer.difficulty}
          onComplete={handleFocusTimerComplete}
        />
      ) : (
        <>
          <LessonContentView 
            lesson={lesson}
          />
          
          <div className="flex justify-end">
            <Button onClick={handleStandardLessonComplete}>
              Mark as Complete
            </Button>
          </div>
        </>
      )}
    </div>
  );


   // Add the handler for focus timer completion
const handleFocusTimerComplete = async (data) => {
    try {
      const result = await submitFocusTimerResults(lessonId, data);
      setCompletionState({
        gamification: result.data.gamification,
        message: 'Focus session completed!'
      });
      
      // Show XP toast if awarded
      if (result.data.gamification?.xpAwarded > 0) {
        toast({
          title: `+${result.data.gamification.xpAwarded} XP`,
          description: "Focus session completed successfully!",
          variant: "default",
        });
      }
      
      // Show achievement toasts
      if (result.data.gamification?.newAchievements?.length > 0) {
        result.data.gamification.newAchievements.forEach(achievement => {
          toast({
            title: "Achievement Unlocked!",
            description: achievement.title,
            variant: "default",
          });
        });
      }
      
    } catch (error) {
      console.error('Error submitting focus session:', error);
      toast({
        title: "Error",
        description: "Failed to submit focus session results",
        variant: "destructive",
      });
    }
  }
