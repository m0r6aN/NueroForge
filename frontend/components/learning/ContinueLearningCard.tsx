"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, PlayCircle, ArrowRight, Clock, Lightbulb } from 'lucide-react';

import { fetchNextPath } from '@/lib/api/learningPath';

/**
 * Dashboard card that shows the next recommended learning step
 * and provides a quick "Continue Learning" action
 */
export default function ContinueLearningCard() {
  const router = useRouter();
  
  // Fetch next learning path data
  const { data, error, isLoading } = useSWR('/api/learning/path/next', fetchNextPath);
  
  // Handle continue button click
  const handleContinue = () => {
    if (data?.data?.lessonId) {
      router.push(`/learn/lesson/${data.data.lessonId}`);
    } else {
      router.push('/subjects');
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }
  
  // Error or no path available state
  if (error || !data?.data) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span>Begin Your Journey</span>
          </CardTitle>
          <CardDescription>Start exploring neural enhancement subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            NeuroForge builds a personalized learning path based on your progress and cognitive patterns.
            Choose your first subject to begin.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => router.push('/subjects')}
            className="w-full"
          >
            Browse Subjects
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Main component with data
  const { subjectTitle, lessonTitle, rationale } = data.data;
  
  // Calculate time since last session (mock implementation)
  const getTimeSinceLastSession = () => {
    return '3 hours ago';
  };
  
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span>Continue Learning</span>
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Last session {getTimeSinceLastSession()}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Recommended Next Step:</div>
          <div>
            <div className="font-medium text-lg">{lessonTitle || 'Next Lesson'}</div>
            <div className="text-sm text-muted-foreground">
              {subjectTitle ? `In: ${subjectTitle}` : 'Continue your progress'}
            </div>
          </div>
        </div>
        
        {rationale && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Lightbulb className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>{rationale}</div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleContinue}
          className="w-full gap-1"
        >
          <PlayCircle className="h-4 w-4" />
          <span>Continue Now</span>
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}