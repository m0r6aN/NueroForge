// neuroforge/frontend/app/(app)/learn/page.tsx
// Purpose: Central hub for learning activities (SRS reviews, starting new lessons)
"use client";

import React, { useState, useEffect } from 'react';
import { getDueReviewItems } from 'lib/api';
import { SpacedRepetitionCard } from 'components/learning/SpacedRepetitionCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, BrainCircuit } from 'lucide-react';
import { Progress } from "@/components/ui/progress"; // Shadcn progress bar

// Define type for review items (UserProgress populated with Lesson)
interface ReviewItem {
    _id: string; // This is the UserProgress ID
    lesson: {
        _id: string;
        title: string;
        contentType: string; // e.g., 'quiz', 'text' (determines review format)
        content: any; // The actual question/prompt/fact for review
        subject: string; // Subject ID
    };
    // Add other UserProgress fields if needed (like lastReviewedDate)
}

export default function LearningHubPage() {
    const [dueItems, setDueItems] = useState<ReviewItem[]>([]);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });

    useEffect(() => {
        const fetchReviews = async () => {
            setIsLoading(true);
            setError(null);
            setSessionComplete(false);
             setCurrentItemIndex(0);
             setSessionStats({ correct: 0, incorrect: 0 });
            try {
                const response = await getDueReviewItems(20); // Fetch up to 20 items
                if (response.success && response.data) {
                    setDueItems(response.data);
                } else {
                    setError(response.message || 'Failed to fetch review items.');
                }
            } catch (err: any) {
                setError(err.message || 'An error occurred.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchReviews();
    }, []);

    const handleReviewSubmit = (progressId: string, performanceScore: number) => {
        // Update stats
        setSessionStats(prev => ({
            ...prev,
            correct: performanceScore >= 3 ? prev.correct + 1 : prev.correct,
            incorrect: performanceScore < 3 ? prev.incorrect + 1 : prev.incorrect,
        }));

        // Move to the next item or finish session
        if (currentItemIndex < dueItems.length - 1) {
            setCurrentItemIndex(currentItemIndex + 1);
        } else {
            setSessionComplete(true);
        }
    };

    const currentItem = dueItems[currentItemIndex];
    const progressPercentage = dueItems.length > 0 ? ((currentItemIndex + 1) / dueItems.length) * 100 : 0;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Learning Hub</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Spaced Repetition Review</CardTitle>
                    <CardDescription>Strengthen your neural pathways. Review items due today.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-2">Loading review session...</p>
                        </div>
                    )}

                    {!isLoading && error && (
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {!isLoading && !error && dueItems.length === 0 && !sessionComplete && (
                         <Alert>
                             <CheckCircle className="h-4 w-4" />
                             <AlertTitle>All Caught Up!</AlertTitle>
                             <AlertDescription>No items due for review right now. Excellent work, Operative!</AlertDescription>
                              <Button className="mt-4" onClick={() => {/* TODO: Navigate to explore subjects */} }>Explore New Subjects</Button>
                         </Alert>
                    )}

                    {!isLoading && !error && sessionComplete && (
                        <div className="text-center space-y-4 p-6">
                             <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                            <h2 className="text-2xl font-semibold">Review Session Complete!</h2>
                            <p>You reviewed {sessionStats.correct + sessionStats.incorrect} items.</p>
                            <p>Correct: <span className="text-green-500 font-medium">{sessionStats.correct}</span> | Incorrect: <span className="text-red-500 font-medium">{sessionStats.incorrect}</span></p>
                             <Button onClick={() => {/* TODO: Fetch new session or go elsewhere */} }>Start Another Session</Button>
                        </div>
                    )}


                    {!isLoading && !error && dueItems.length > 0 && !sessionComplete && currentItem && (
                        <div className="space-y-4">
                            {/* Progress Bar */}
                             <div className="flex items-center gap-2 mb-4">
                                 <span>Progress:</span>
                                 <Progress value={progressPercentage} className="w-full" />
                                 <span>{currentItemIndex + 1} / {dueItems.length}</span>
                             </div>

                            {/* SRS Card */}
                            <SpacedRepetitionCard
                                key={currentItem._id} // Ensure component remounts for new item
                                progressId={currentItem._id}
                                lesson={currentItem.lesson}
                                onSubmit={handleReviewSubmit} // Pass the callback
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

             {/* Placeholder for other learning activities */}
              <Card>
                 <CardHeader>
                    <CardTitle>AI Tutor</CardTitle>
                     <CardDescription>Engage with your personalized AI mentor.</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <AiTutorInterface initialContext={{ type: 'general_hub' }} />
                 </CardContent>
              </Card>

              {/* Placeholder for starting new lessons */}
              <Card>
                 <CardHeader>
                    <CardTitle>Explore & Learn</CardTitle>
                     <CardDescription>Dive into new subjects or continue your missions.</CardDescription>
                 </CardHeader>
                 <CardContent>
                     <Button>Browse Subjects</Button>
                     {/* Add links to current mission or recommended lessons */}
                 </CardContent>
              </Card>

        </div>
    );
}