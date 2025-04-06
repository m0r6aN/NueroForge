// components/learning/NextLearningPathDisplay.tsx
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Brain, BookOpen, Zap, ArrowRight, BrainCircuit, Play, Lightbulb } from 'lucide-react';

import { fetchNextPath } from '@/lib/api/learningPath';

interface NextPathData {
  subjectId: string;
  subjectTitle?: string;
  lessonId: string;
  lessonTitle?: string;
  rationale: string;
  recommendedAudioPreset?: string;
}

/**
 * NextLearningPathDisplay - Shows the recommended next lesson based on cognitive state and learning path
 * 
 * This component:
 * 1. Fetches data from /api/learning/path/next
 * 2. Displays the recommended next lesson with a rationale
 * 3. Suggests an optimal audio preset based on content type
 * 4. Provides a "Continue Learning" button
 */
export default function NextLearningPathDisplay() {
  const router = useRouter();
  
  // Fetch next learning path data
  const { data, error, isLoading, mutate } = useSWR<{success: boolean; data: NextPathData}>('/api/learning/path/next', fetchNextPath);

  // Helper function to get a color for the audio preset badge
  const getPresetColor = (preset?: string) => {
    if (!preset) return 'bg-neutral-800 hover:bg-neutral-800';
    
    switch(preset.toLowerCase()) {
      case 'focus': return 'bg-blue-600 hover:bg-blue-700';
      case 'creative': return 'bg-purple-600 hover:bg-purple-700';
      case 'deep_learning': return 'bg-emerald-600 hover:bg-emerald-700';
      case 'relaxation': return 'bg-amber-600 hover:bg-amber-700';
      default: return 'bg-neutral-800 hover:bg-neutral-800';
    }
  };
  
  // Helper to get the icon for the audio preset
  const getPresetIcon = (preset?: string) => {
    if (!preset) return <BrainCircuit className="h-4 w-4" />;
    
    switch(preset.toLowerCase()) {
      case 'focus': return <Zap className="h-4 w-4" />;
      case 'creative': return <Lightbulb className="h-4 w-4" />;
      case 'deep_learning': return <Brain className="h-4 w-4" />;
      case 'relaxation': return <BrainCircuit className="h-4 w-4" />;
      default: return <BrainCircuit className="h-4 w-4" />;
    }
  };
  
  // Handle continue button click
  const handleContinue = () => {
    if (data?.data?.lessonId) {
      router.push(`/learn/lesson/${data.data.lessonId}`);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-60" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-40" />
        </CardFooter>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to determine optimal learning path</AlertTitle>
        <AlertDescription>
          We could not calculate your next learning step. Please try refreshing or choose a subject from the curriculum.
        </AlertDescription>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => mutate()}>
          Retry
        </Button>
      </Alert>
    );
  }
  
  // No path available state
  if (!data?.data) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Start Your Neural Journey</CardTitle>
          <CardDescription>
            Choose your first subject from the curriculum to begin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            NeuroForge builds a personalized learning path based on your progress and cognitive patterns.
            Complete lessons to unlock more advanced recommendations.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => router.push('/subjects')}>
            Browse Subjects
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Main component with data
  const { subjectTitle, lessonTitle, rationale, recommendedAudioPreset } = data.data;
  
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span>Next Neural Enhancement</span>
          </CardTitle>
          
          {/* Audio preset recommendation badge */}
          {recommendedAudioPreset && (
            <Badge className={`flex items-center gap-1 ${getPresetColor(recommendedAudioPreset)}`}>
              {getPresetIcon(recommendedAudioPreset)}
              <span>
                {recommendedAudioPreset.charAt(0).toUpperCase() + recommendedAudioPreset.slice(1)} Recommended
              </span>
            </Badge>
          )}
        </div>
        <CardDescription>
          Cognitive state analysis recommends the following learning path
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Subject + Lesson */}
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <div>
              <span className="text-sm text-muted-foreground">Subject: </span>
              <span className="font-medium">{subjectTitle || 'Unknown Subject'}</span>
              <span className="text-muted-foreground mx-2">→</span>
              <span className="text-sm text-muted-foreground">Lesson: </span>
              <span className="font-medium">{lessonTitle || 'Next Lesson'}</span>
            </div>
          </div>
          
          {/* Rationale */}
          <div className="flex gap-2">
            <Lightbulb className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{rationale}</p>
          </div>
          
          {/* Optimization hint */}
          {recommendedAudioPreset && (
            <div className="mt-2 p-3 rounded-md border border-blue-800/30 bg-blue-900/10">
              <p className="text-sm flex items-start gap-2">
                <Zap className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>
                  <span className="font-medium text-blue-400">Optimization tip:</span>{' '}
                  Activate the {recommendedAudioPreset} audio preset for optimal neural enhancement with this content.
                </span>
              </p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleContinue} 
          className="gap-1"
          size="lg"
        >
          <Play className="h-4 w-4" />
          <span>Continue Learning</span>
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}