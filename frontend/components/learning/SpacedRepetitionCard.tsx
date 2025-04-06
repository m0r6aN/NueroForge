// neuroforge/frontend/components/learning/SpacedRepetitionCard.tsx
// Purpose: UI component for displaying and interacting with an SRS item
"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import { Button } from "components/ui/button";
import { submitReview } from "lib/api"; // API function
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; // Shadcn toast
import { useNeuroForgeWebSocket } from "@/components/providers/websocket-provider"; // Import WS hook
import { useSession } from "next-auth/react"; // To get session context if needed
import { WebSocketStatus } from "@/hooks/useWebSocket";

interface LessonData {
  _id: string;
  title: string;
  contentType: string;
  content: any; // e.g., { question: string, answer: string } or just a fact
}

interface SpacedRepetitionCardProps {
  progressId: string; // UserProgress ID
  lesson: LessonData;
  onSubmit: (progressId: string, performanceScore: number) => void; // Callback when review is done
}

export function SpacedRepetitionCard({
  progressId,
  lesson,
  onSubmit,
}: SpacedRepetitionCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerShownTimestamp, setAnswerShownTimestamp] = useState<
    number | null
  >(null); // Track when answer was shown
  const { toast } = useToast();
  const { sendMessage, status: wsStatus } = useNeuroForgeWebSocket(); // Get WS send function
  const { data: session } = useSession(); // Get session for context if needed

  const handleShowAnswer = () => {
    setShowAnswer(true);
    setAnswerShownTimestamp(Date.now()); // Record time when answer is revealed
  };

  const handlePerformanceSubmit = async (performanceScore: number) => {
    setIsSubmitting(true);
    let showAnswerDurationMs: number | undefined = undefined;
    if (answerShownTimestamp) {
      showAnswerDurationMs = Date.now() - answerShownTimestamp;
    }

    // --- Send WebSocket Interaction ---
    if (wsStatus === WebSocketStatus.OPEN) {
      sendMessage({
        type: "interaction",
        payload: {
          // Assuming we are in a 'review_session' context - need to manage this context state higher up or pass it down
          context: {
            type: "review_session",
            id: session?.user?.id || "unknown_session",
          }, // Use userId or a real session ID
          interactionType: "srs_review_submit",
          details: {
            progressId: progressId,
            lessonId: lesson._id,
            performanceScore: performanceScore,
            ...(showAnswerDurationMs !== undefined && { showAnswerDurationMs }), // Conditionally add duration
          },
        },
      });
    }
    // --- End WebSocket Interaction ---

    try {
      const response = await submitReview(progressId, performanceScore);
      // ... existing success/error handling for submitReview API call ...
      if (response.success) {
        toast({
          /* ... */
        });
        onSubmit(progressId, performanceScore);
      } else {
        throw new Error(response.message || "Failed to submit review.");
      }
    } catch (error: any) {
      // ... existing catch block ...
      toast({
        /* ... */
      });
      setIsSubmitting(false);
    }
    // Removed finally block setting isSubmitting to false here if onSubmit navigates away
  };

  return (
    <Card className="w-full max-w-xl mx-auto bg-card shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">{lesson.title}</CardTitle>
        {/* Optional: Add context like subject name */}
        {/* <CardDescription>Subject: Quantum Physics</CardDescription> */}
      </CardHeader>
      <CardContent className="min-h-[100px] flex items-center justify-center text-center">
        <div>
          {/* Display Question/Prompt */}
          <p className="text-lg font-medium">{question}</p>

          {/* Display Answer */}
          {showAnswer && (
            <div className="mt-4 p-4 bg-muted rounded-md border">
              <p className="text-base">
                {typeof answer === "string" ? answer : JSON.stringify(answer)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        {!showAnswer && (
          <Button
            onClick={handleShowAnswer}
            className="w-full"
            disabled={isSubmitting}
          >
            Show Answer
          </Button>
        )}

        {showAnswer && (
          <div className="w-full space-y-2">
            <p className="text-center text-sm font-medium mb-2">
              How well did you recall this?
            </p>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
              {/* Performance Buttons (0-5 scale mapping) */}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handlePerformanceSubmit(0)}
                disabled={isSubmitting}
              >
                Incorrect (0)
              </Button>
              <Button
                variant="destructive"
                className="opacity-80"
                size="sm"
                onClick={() => handlePerformanceSubmit(1)}
                disabled={isSubmitting}
              >
                Barely (1)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePerformanceSubmit(2)}
                disabled={isSubmitting}
              >
                Difficult (2)
              </Button>
              <Button
                variant="outline"
                className="opacity-80"
                size="sm"
                onClick={() => handlePerformanceSubmit(3)}
                disabled={isSubmitting}
              >
                Hesitated (3)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePerformanceSubmit(4)}
                disabled={isSubmitting}
              >
                Good (4)
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handlePerformanceSubmit(5)}
                disabled={isSubmitting}
              >
                Easy (5)
              </Button>
            </div>
            {isSubmitting && (
              <Loader2 className="h-4 w-4 animate-spin mx-auto mt-2" />
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
