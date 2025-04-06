// neuroforge/frontend/components/ai/AiTutorInterface.tsx
// Purpose: UI component for interacting with the AI tutor

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAiTutor, AiTutorOptions } from 'hooks/useAiTutor';
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
  Dumbbell 
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip';
import { Skeleton } from 'components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface AiTutorInterfaceProps extends AiTutorOptions {
  className?: string;
  height?: string; // CSS height value (e.g. "500px", "100%")
  minHeight?: string;
  maxHeight?: string;
  showControls?: boolean; // Whether to show teaching style controls
  showTitle?: boolean; // Whether to show the title
  placeholder?: string;
  startExpanded?: boolean;
}

export function AiTutorInterface({
  className = '',
  height = 'auto',
  minHeight = '400px',
  maxHeight = '600px',
  showControls = true,
  showTitle = true,
  placeholder = 'Ask your AI tutor a question...',
  startExpanded = false,
  ...aiTutorOptions
}: AiTutorInterfaceProps) {
  const {
    initialized,
    loading,
    error,
    messages,
    teachingStyle,
    usageStats,
    sendMessage,
    changeTeachingStyle,
    clearConversation
  } = useAiTutor(aiTutorOptions);
  
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
            <CardTitle className="text-md">
              NeuroForge AI Tutor
              {aiTutorOptions.subjectContext && (
                <Badge variant="outline" className="ml-2 text-xs font-normal">
                  {aiTutorOptions.subjectContext}
                </Badge>
              )}
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