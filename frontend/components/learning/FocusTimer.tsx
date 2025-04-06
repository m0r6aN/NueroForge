// components/learning/FocusTimer.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFocusTimer, FocusTimerCompletionData } from '@/hooks/useFocusTimer';
import {
  Play,
  Pause,
  Brain,
  X,
  Zap,
  Volume2,
  VolumeX,
  Info
} from 'lucide-react';
import { BinauralPlayer } from '@/components/audio/BinauralPlayer';

interface FocusTimerProps {
  lessonId: string;
  title: string;
  description?: string;
  task: string;
  duration: number;
  breakInterval?: number;
  cycles?: number;
  techniques?: string[];
  recommendedAudioPreset?: string;
  difficulty?: number;
  onComplete: (data: FocusTimerCompletionData) => void;
}

export default function FocusTimer({
  lessonId,
  //title,
  description,
  task,
  duration,
  breakInterval = 0,
  cycles = 1,
  techniques = [],
  recommendedAudioPreset = 'focus',
  difficulty = 2,
  onComplete
}: FocusTimerProps) {
  // Audio state
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioPreset, setAudioPreset] = useState(recommendedAudioPreset);

  const [showAudioControls, setShowAudioControls] = useState(false);
  
  // Focus timer hook
  const timer = useFocusTimer({
    duration,
    breakInterval,
    cycles,
    lessonId,
    onComplete
  });
  
  // Get technique names
  const getTechniqueName = (technique: string) => {
    switch (technique) {
      case 'deep_work': return 'Deep Work';
      case 'pomodoro': return 'Pomodoro';
      case 'timeboxing': return 'Timeboxing';
      case 'flow_state': return 'Flow State';
      default: return technique;
    }
  };
  
  // Get technique description
  const getTechniqueDescription = (technique: string) => {
    switch (technique) {
      case 'deep_work':
        return 'Eliminate distractions and focus deeply on a cognitively demanding task';
      case 'pomodoro':
        return 'Work in focused intervals with short breaks to maintain productivity';
      case 'timeboxing':
        return 'Allocate a fixed time period to a planned activity';
      case 'flow_state':
        return 'Enter a state of complete immersion and engagement in the activity';
      default:
        return '';
    }
  };
  
  // Get audio preset name
  const getAudioPresetName = (preset: string) => {
    switch (preset) {
      case 'focus': return 'Focus (Beta Waves)';
      case 'deep_learning': return 'Deep Learning (Theta Waves)';
      case 'creative': return 'Creative (Alpha Waves)';
      case 'relaxation': return 'Relaxation (Alpha/Theta Mix)';
      default: return preset;
    }
  };
  
  // Get audio preset color
  const getAudioPresetColor = (preset: string) => {
    switch (preset) {
      case 'focus': return 'bg-blue-600 hover:bg-blue-700';
      case 'creative': return 'bg-purple-600 hover:bg-purple-700';
      case 'deep_learning': return 'bg-emerald-600 hover:bg-emerald-700';
      case 'relaxation': return 'bg-amber-600 hover:bg-amber-700';
      default: return 'bg-gray-600 hover:bg-gray-700';
    }
  };
  
  // Render technique badges
  const renderTechniqueBadges = () => {
    if (!techniques || techniques.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {techniques.map(technique => (
          <TooltipProvider key={technique}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="cursor-help">
                  {getTechniqueName(technique)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{getTechniqueDescription(technique)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  };
  
  // Render timer controls
  const renderTimerControls = () => {
    if (!timer.isRunning && !timer.isPaused) {
      return (
        <Button 
          onClick={timer.startTimer} 
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          size="lg"
        >
          <Play className="h-5 w-5" />
          <span>Begin Focus Session</span>
        </Button>
      );
    }
    
    if (timer.isPaused) {
      return (
        <div className="flex gap-2">
          <Button onClick={timer.resumeTimer} className="gap-2 bg-amber-600 hover:bg-amber-700">
            <Play className="h-4 w-4" />
            <span>Resume</span>
          </Button>
          <Button onClick={timer.stopTimer} variant="outline" className="gap-2">
            <X className="h-4 w-4" />
            <span>End Session</span>
          </Button>
        </div>
      );
    }
    
    return (
      <div className="flex gap-2">
        <Button onClick={timer.pauseTimer} variant="outline" className="gap-2">
          <Pause className="h-4 w-4" />
          <span>Pause</span>
        </Button>
        <Button onClick={timer.stopTimer} variant="outline" className="gap-2 border-red-800 text-red-500 hover:bg-red-950/20">
          <X className="h-4 w-4" />
          <span>End Session</span>
        </Button>
      </div>
    );
  };
  
  // Render timer
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span>Neural Focus Training</span>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Difficulty */}
            <Badge 
              variant="secondary" 
              className="text-xs"
            >
              Level {difficulty}
            </Badge>
            
            {/* Audio toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="rounded-full"
              title={audioEnabled ? "Disable audio enhancement" : "Enable audio enhancement"}
            >
              {audioEnabled ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
        
        <CardDescription>
          {description || "Enhance your focus and concentration with timed neural training."}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Technique badges */}
        {renderTechniqueBadges()}
        
        {/* Task description */}
        <div className="p-4 border border-zinc-800 rounded-md bg-zinc-950 mt-2">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <span>Focus Task</span>
          </h3>
          <p className="text-muted-foreground">{task}</p>
        </div>
        
        {/* Timer display */}
        <div className="pt-4 pb-2">
          <div className="flex justify-center mb-8">
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Timer circle */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle 
                 className="text-zinc-800" 
                 strokeWidth="8"
                 stroke="currentColor" 
                 fill="transparent" 
                 r="40" 
                 cx="50" 
                 cy="50" 
               />
               {/* Progress circle */}
               <circle 
                 className={timer.isBreak ? "text-amber-500" : "text-primary"} 
                 strokeWidth="8"
                 stroke="currentColor" 
                 fill="transparent" 
                 r="40" 
                 cx="50" 
                 cy="50" 
                 strokeDasharray={`${2 * Math.PI * 40}`}
                 strokeDashoffset={`${2 * Math.PI * 40 * (1 - timer.progressPercentage / 100)}`}
                 strokeLinecap="round"
               />
             </svg>
             
             {/* Timer text */}
             <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className="text-3xl font-bold font-mono">
                 {timer.formattedTimeRemaining}
               </span>
               <span className="text-xs text-muted-foreground mt-1">
                 {timer.isBreak ? 'Break Time' : 'Focus Time'}
               </span>
             </div>
           </div>
         </div>
         
         {/* Session info */}
         <div className="grid grid-cols-3 gap-4 text-center">
           <div>
             <div className="text-sm text-muted-foreground">Current Cycle</div>
             <div className="text-xl font-medium">{timer.currentCycle}/{cycles}</div>
           </div>
           <div>
             <div className="text-sm text-muted-foreground">Total Focus</div>
             <div className="text-xl font-medium">{timer.formattedTotalFocusTime}</div>
           </div>
           <div>
             <div className="text-sm text-muted-foreground">Pauses</div>
             <div className="text-xl font-medium">{timer.pauseCount}</div>
           </div>
         </div>
         
         {/* Cycle progress */}
         {cycles > 1 && (
           <div className="mt-4">
             <div className="flex justify-between text-xs mb-1">
               <span>Cycle Progress</span>
               <span>{Math.round(timer.cycleProgressPercentage)}%</span>
             </div>
             <Progress value={timer.cycleProgressPercentage} className="h-1" />
           </div>
         )}
       </div>
       
       {/* Audio preset recommendation */}
       {recommendedAudioPreset && (
        <div className="p-3 rounded-md border border-blue-800/30 bg-blue-900/10">
            <div className="flex items-start gap-2 mb-3">
            <Zap className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
                <p className="text-sm">
                <span className="font-medium text-blue-400">Recommended Neural Audio:</span>{' '}
                {getAudioPresetName(recommendedAudioPreset)} is optimal for this focus session.
                </p>
            </div>
            </div>
            
            {showAudioControls ? (
            <BinauralPlayer />
            ) : (
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAudioControls(true)}
                className="text-xs border-blue-700/50 text-blue-400 hover:bg-blue-950/30"
            >
                <Volume2 className="h-3 w-3 mr-1" />
                Configure Neural Audio
            </Button>
            )}
        </div>
        )}      
     </CardContent>
     
     <CardFooter className="flex justify-center pt-2 pb-6">
       {renderTimerControls()}
     </CardFooter>
   </Card>
 );
}