// neuroforge/frontend/hooks/useContextAwareAiTutor.ts
// Purpose: Enhanced AI tutor hook with contextual awareness

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AiMessage, TeachingStyle } from 'lib/ai/aiService';
import { contextAwareAi, CognitiveContext } from 'lib/ai/contextAwareAi';
import { useBinauralBeats } from 'hooks/useBinauralBeats';
import { useToast } from '@/components/ui/use-toast';

export interface ContextAwareAiTutorOptions {
  lessonId?: string;
  subjectId?: string;
  initialTeachingStyle?: TeachingStyle;
  autoInitialize?: boolean;
}

export function useContextAwareAiTutor(options: ContextAwareAiTutorOptions = {}) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [teachingStyle, setTeachingStyle] = useState<TeachingStyle>(
    options.initialTeachingStyle || 'explanatory'
  );
  const [context, setContext] = useState<CognitiveContext>({});
  
  // Get current audio state from our binaural beats hook
  const { isPlaying, currentPreset, elapsedTime } = useBinauralBeats();
  
  // Usage stats
  const [usageStats, setUsageStats] = useState({
    tokensUsed: 0,
    messagesExchanged: 0,
    estimatedCost: 0
  });
  
  // Initialize AI context when component mounts
  useEffect(() => {
    if (!initialized && (options.autoInitialize !== false) && session?.user?.id) {
      initializeAi();
    }
  }, [initialized, session?.user?.id]);
  
  // Update audio state whenever it changes
  useEffect(() => {
    if (initialized && (isPlaying || currentPreset)) {
      const audioState: CognitiveContext['audioState'] = {
        activePreset: isPlaying ? currentPreset : null,
        duration: Math.floor(elapsedTime / 60), // Convert to minutes
        previousPresets: [] // Would be tracked in a more complete implementation
      };
      
      contextAwareAi.updateAudioState(audioState);
      setContext(prevContext => ({
        ...prevContext,
        audioState
      }));
    }
  }, [initialized, isPlaying, currentPreset, elapsedTime]);
  
  // Initialize the context-aware AI
  const initializeAi = useCallback(async () => {
    if (!session?.user?.id) {
      setError('User not authenticated');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Initialize context with available data
      const audioState = isPlaying ? {
        activePreset: currentPreset,
        duration: Math.floor(elapsedTime / 60), // Convert to minutes
        previousPresets: []
      } : undefined;
      
      const initialContext = await contextAwareAi.initializeContext(
        session.user.id,
        options.lessonId,
        options.subjectId,
        audioState
      );
      
      setContext(initialContext);
      
      // Add initial message based on context
      if (messages.length === 0) {
        let welcomeMessage = 'How can I help you with your learning today?';
        
        // Personalize based on context
        if (initialContext.currentLesson) {
          welcomeMessage = `I'm your NeuroForge AI Tutor for "${initialContext.currentLesson.title}". How can I help you understand this material?`;
          
          // Add audio suggestion if applicable
          if (initialContext.currentLesson.requiredFocusLevel >= 7 && (!isPlaying || currentPreset !== 'focus')) {
            welcomeMessage += ' This lesson requires high focus - would you like to activate the Focus audio enhancement?';
          } else if (initialContext.currentLesson.suggestedCreativityLevel >= 7 && (!isPlaying || currentPreset !== 'creative')) {
            welcomeMessage += ' This lesson benefits from creative thinking - would you like to activate the Creative audio enhancement?';
          }
        } else if (initialContext.currentSubject) {
          welcomeMessage = `I'm your NeuroForge AI Tutor for ${initialContext.currentSubject.name}. What would you like to learn about?`;
        }
        
        // Add personal context if available
        if (initialContext.userProgress?.challengeAreas && initialContext.userProgress.challengeAreas.length > 0) {
          welcomeMessage += ` Based on your past work, we might want to focus on ${initialContext.userProgress.challengeAreas[0]}.`;
        }
        
        const initialAssistantMessage: AiMessage = {
          role: 'assistant',
          content: welcomeMessage
        };
        
        setMessages([initialAssistantMessage]);
      }
      
      setInitialized(true);
    } catch (err) {
      console.error('Error initializing context-aware AI tutor:', err);
      setError('Failed to initialize AI tutor: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, options.lessonId, options.subjectId, isPlaying, currentPreset, elapsedTime, messages.length]);
  
  // Send a message with context
  const sendMessage = useCallback(async (content: string) => {
    if (!initialized) {
      toast({
        title: 'AI Tutor Not Ready',
        description: 'Please wait for the AI tutor to initialize.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Add user message to the list
      const userMessage: AiMessage = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);
      
      // Get user learning mode
      const learningMode = (session?.user as any)?.preferences?.learningMode || 'elite_operative';
      
      // Get all previous messages except system prompts
      const messageHistory = messages.filter(m => m.role !== 'system');
      
      // Send to context-aware AI
      const result = await contextAwareAi.sendContextAwareMessage(
        [...messageHistory, userMessage], 
        { teachingStyle }
      );
      
      // Add AI response to messages
      const assistantMessage: AiMessage = { role: 'assistant', content: result.response };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update usage stats if available
      if (result.usage) {
        const newTokens = (result.usage.total_tokens || result.usage.totalTokens || 0);
        setUsageStats(prev => ({
          tokensUsed: prev.tokensUsed + newTokens,
          messagesExchanged: prev.messagesExchanged + 1,
          estimatedCost: prev.estimatedCost + (newTokens / 1000) * 0.002 // Rough estimate
        }));
      }
      
      return assistantMessage;
    } catch (err) {
      console.error('Error sending message to context-aware AI tutor:', err);
      setError('Failed to get AI response: ' + (err instanceof Error ? err.message : String(err)));
      toast({
        title: 'AI Tutor Error',
        description: 'Failed to get a response. Please try again.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [initialized, messages, teachingStyle, session?.user, toast]);
  
  // Change the teaching style
  const changeTeachingStyle = useCallback((newStyle: TeachingStyle) => {
    setTeachingStyle(newStyle);
    // Optionally notify the user
    toast({
      title: 'Teaching Style Changed',
      description: `AI tutor is now using ${newStyle} teaching style.`,
      duration: 3000
    });
  }, [toast]);
  
  // Clear the conversation
  const clearConversation = useCallback(() => {
    // Generate a new welcome message based on context
    let welcomeMessage = 'How can I help you with your learning today?';
    
    if (context.currentLesson) {
      welcomeMessage = `I'm your NeuroForge AI Tutor for "${context.currentLesson.title}". How can I help you understand this material?`;
    } else if (context.currentSubject) {
      welcomeMessage = `I'm your NeuroForge AI Tutor for ${context.currentSubject.name}. What would you like to learn about?`;
    }
    
    const initialAssistantMessage: AiMessage = {
      role: 'assistant',
      content: welcomeMessage
    };
    
    setMessages([initialAssistantMessage]);
    
    toast({
      title: 'Conversation Cleared',
      description: 'Started a new conversation with your AI tutor.',
      duration: 3000
    });
  }, [context, toast]);
  
  // Refresh the context (e.g., after completing a lesson)
  const refreshContext = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      setLoading(true);
      
      const refreshedContext = await contextAwareAi.initializeContext(
        session.user.id,
        options.lessonId,
        options.subjectId,
        context.audioState
      );
      
      setContext(refreshedContext);
      
      // Optionally add a message about the updated context
      // This would depend on what specifically changed
      
    } catch (err) {
      console.error('Error refreshing AI context:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, options.lessonId, options.subjectId, context.audioState]);
  
  return {
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
    refreshContext,
    initializeAi
  };
}
