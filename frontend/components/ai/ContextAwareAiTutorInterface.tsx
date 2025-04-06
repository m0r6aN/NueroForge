// neuroforge/frontend/components/ai/ContextAwareAiTutorInterface.tsx
// Purpose: Enhanced AI tutor component with contextual awareness

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useContextAwareAiTutor, ContextAwareAiTutorOptions } from 'hooks/useContextAwareAiTutor';
import { TeachingStyle } from 'lib/ai/aiService';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from 'components/ui/card';
import { 
  Send, 
  RefreshCw, 
  Trash2, 
  Brain, 
  BookOpen, 
  Lightbulb, 
  Compass, 
  Dumbbell,
  Volume2,
  VolumeX 
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip';
import { Skeleton } from 'components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useBinauralBeats, PresetKey } from 'hooks/useBinauralBeats';

interface ContextAwareAiTutorInterfaceProps extends ContextAwareAiTutorOptions {
  className?: string;
  height?: string; // CSS height value (e.g. "500px", "100%")
  minHeight?: string;
  maxHeight?: string;
  showControls?: boolean; // Whether to show teaching style controls
  showTitle?: boolean; // Whether to show the title
  showAudioControls?: boolean; // Whether to show audio enhancement controls
  placeholder?: string;
  startExpanded?: boolean;
}

export function ContextAwareAiTutorInterface({
  className = '',
  height = 'auto',
  minHeight = '400px',
  maxHeight = '600px',
  showControls = true,
  showTitle = true,
  showAudioControls = true,
  placeholder = 'Ask your AI tutor a question...',
  startExpanded = false,
  ...contextAwareTutorOptions
}: ContextAwareAiTutorInterfaceProps) {
  const {
    initialized,
    loading,
    error,
    messages,
    teachingStyle,
    context,
    usageStats,
    sendMessage,
    changeTeachingStyle,
    clearConversation,
    refreshContext
  } = useContextAwareAiTutor(contextAwareTutorOptions);
  
  const { isPlaying, currentPreset, play, stop } = useBinauralBeats();
  
  const [userInput, setUserInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(startExpanded);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Focus input when initialized
  useEffect(() => {
    if (initialized && inputRef.current && messages.length <= 1) {
      inputRef.current.focus();
    }
  }, [initialized, messages.length]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || loading) return;
    
    await sendMessage(userInput);
    setUserInput('');
  };
  
  const getTeachingStyleIcon = (style: TeachingStyle) => {
    switch (style) {
      case 'socratic': return <Compass className="h-4 w-4" />;
      case 'explanatory': return <BookOpen className="h-4 w-4" />;
      case 'coaching': return <Dumbbell className="h-4 w-4" />;
      case 'storytelling': return <Lightbulb className="h-4 w-4" />;
      case 'challenging': return <Brain className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };
  
  // Handle audio preset activation from AI suggestions
  const activateAudioPreset = (preset: PresetKey) => {
    if (isPlaying && currentPreset === preset) return;
    play(preset);
  };
  
  // Get recommended audio preset based on context
  const getRecommendedAudioPreset = (): PresetKey | null => {
    // If lesson context suggests high focus
    if (context.currentLesson?.requiredFocusLevel >= 7) {
      return 'focus';
    }
    
    // If lesson context suggests high creativity
    if (context.currentLesson?.suggestedCreativityLevel >= 7) {
      return 'creative';
    }
    
    // Use subject recommendation if available
    if (context.currentSubject?.recommendedAudioPreset) {
      return context.currentSubject.recommendedAudioPreset as PresetKey;
    }
    
    return null;
  };
  
  // Audio preset badge/button
  const AudioPresetBadge = () => {
    const recommendedPreset = getRecommendedAudioPreset();
    
    if (!recommendedPreset || !showAudioControls) return null;
    
    const isActive = isPlaying && currentPreset === recommendedPreset;
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={isActive ? "default" : "outline"} 
            className={`cursor-pointer flex items-center gap-1 ${isActive ? 'bg-primary' : 'hover:bg-primary/10'}`}
            onClick={() => isActive ? stop() : activateAudioPreset(recommendedPreset)}
          >
            {isActive ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
            {recommendedPreset.charAt(0).toUpperCase() + recommendedPreset.slice(1)} Audio
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {isActive 
            ? `${recommendedPreset} audio enhancement active` 
            : `Activate ${recommendedPreset} audio enhancement for this ${context.currentLesson ? 'lesson' : 'subject'}`}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <Card 
      className={`flex flex-col border rounded-lg shadow-md bg-background/95 backdrop-blur-sm overflow-hidden ${className}`}
      style={{ 
        height: isExpanded ? height : 'auto', 
        minHeight: isExpanded ? minHeight : 'auto', 
        maxHeight: isExpanded ? maxHeight : 'auto',
        transition: 'all 0.3s ease-in-out'
      }}
    >
      {showTitle && (
        <CardHeader className="p-3 flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-md flex items-center gap-2">
              Neural AI Tutor
              {context.currentSubject && (
                <Badge variant="outline" className="text-xs font-normal">
                  {context.currentSubject.name}
                </Badge>
              )}
              {context.currentLesson && (
                <Badge variant="outline" className="text-xs font-normal">
                  {context.currentLesson.title}
                </Badge>
              )}
              <AudioPresetBadge />
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {error && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="destructive" className="text-xs">Error</Badge>
                </TooltipTrigger>
                <TooltipContent>{error}</TooltipContent>
              </Tooltip>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 w-7"
            >
              {isExpanded ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </Button>
          </div>
        </CardHeader>
      )}
      
      {isExpanded && (
        <>
          <ScrollArea className="flex-1 px-3 py-2">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <Brain className="h-12 w-12 mb-2 opacity-20" />
                  <p className="text-sm">Your AI tutor is ready. Ask a question to begin.</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              
              {loading && (
                <div className="flex items-start">
                  <div className="max-w-[85%] rounded-lg px-3 py-2 bg-muted">
                    <Skeleton className="h-4 w-[200px] mb-2" />
                    <Skeleton className="h-4 w-[150px] mb-2" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {showControls && (
            <div className="px-3 pt-1 pb-2 border-t border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearConversation}
                      disabled={loading || messages.length === 0}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear conversation</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={refreshContext}
                      disabled={loading}
                      className="h-8 w-8"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh learning context</TooltipContent>
                </Tooltip>
              </div>
              
              <div className="flex items-center">
                <Select
                  value={teachingStyle}
                  onValueChange={(value: TeachingStyle) => changeTeachingStyle(value)}
                  disabled={loading}
                >
                  <SelectTrigger className="h-8 w-[180px] text-xs">
                    <SelectValue placeholder="Teaching Style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="explanatory" className="text-xs">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Explanatory
                      </div>
                    </SelectItem>
                    <SelectItem value="socratic" className="text-xs">
                      <div className="flex items-center gap-2">
                        <Compass className="h-4 w-4" />
                        Socratic
                      </div>
                    </SelectItem>
                    <SelectItem value="coaching" className="text-xs">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="h-4 w-4" />
                        Coaching
                      </div>
                    </SelectItem>
                    <SelectItem value="storytelling" className="text-xs">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Storytelling
                      </div>
                    </SelectItem>
                    <SelectItem value="challenging" className="text-xs">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Challenging
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <CardFooter className="p-3 pt-2">
            <form onSubmit={handleSubmit} className="flex w-full gap-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={loading || !initialized}
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!userInput.trim() || loading || !initialized}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardFooter>
        </>
      )}
    </Card>
  );
}