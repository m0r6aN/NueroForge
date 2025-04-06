// neuroforge/frontend/hooks/useAiTutor.ts
// Purpose: React hook for interacting with the AI tutor

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { aiService, AiMessage, TeachingStyle, AiRequestOptions } from 'lib/ai/aiService';
import { useToast } from '@/components/ui/use-toast';

// Hook to access the audio state from our audio enhancement system
// This lets the AI adapt to user's current neural state
import { useBinauralBeats } from 'hooks/useBinauralBeats';

export interface AiTutorOptions {
  initialSystemPrompt?: string;
  initialTeachingStyle?: TeachingStyle;
  subjectContext?: string;
  lessonContext?: string;
  sessionName?: string; // For saving/loading conversations
  autoInitialize?: boolean;
}

export function useAiTutor(options: AiTutorOptions = {}) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [teachingStyle, setTeachingStyle] = useState<TeachingStyle>(
    options.initialTeachingStyle || 'explanatory'
  );
  
  // Audio state is now pulled from useBinauralBeats hook above
  
  // Get current audio state
  const { isPlaying, currentPreset } = useBinauralBeats();
  
  // Track usage for rate limiting UI feedback
  const [usageStats, setUsageStats] = useState({
    tokensUsed: 0,
    messagesExchanged: 0,
    estimatedCost: 0
  });
  
  // Initialize the AI service
  useEffect(() => {
    if (!initialized && (options.autoInitialize !== false)) {
      initializeAi();
    }
  }, [initialized]);
  
  const initializeAi = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user preferences for AI
      const userPreferences = (session?.user as any)?.preferences?.ai || {};
      
      // Initialize the AI service
      const success = await aiService.init({
        preferredProvider: userPreferences.preferredProvider,
        clientSideApiKey: userPreferences.useOwnApiKey ? userPreferences.apiKey : undefined,
        clientSideProvider: userPreferences.useOwnApiKey ? userPreferences.apiKeyProvider : undefined
      });
      
      if (!success) {
        setError('Failed to initialize AI tutor. Check your connection or AI settings.');
        toast({
          title: 'AI Tutor Error',
          description: 'Could not initialize AI tutor. Please check your settings.',
          variant: 'destructive'
        });
        return;
      }
      
      // If we have a subject context, add an initial assistant message
      if (options.subjectContext && messages.length === 0) {
        const contextMessage: AiMessage = {
          role: 'assistant',
          content: `I'm your NeuroForge AI Tutor for ${options.subjectContext}${options.lessonContext ? ` - ${options.lessonContext}` : ''}. How can I help you learn today?`
        };
        setMessages([contextMessage]);
      }
      
      setInitialized(true);
    } catch (err) {
      console.error('Error initializing AI tutor:', err);
      setError('Failed to initialize AI tutor: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, [session, options.subjectContext, options.lessonContext, messages.length, toast]);
  
  // Send a message to the AI tutor
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
      
      // Calculate neural state info if audio is playing
      const neuralState = isPlaying ? {
        // This would ideally come from more advanced metrics
        // For now, just use audio preset as a proxy
        focusLevel: currentPreset === 'focus' ? 80 : 
                   currentPreset === 'creative' ? 60 : 
                   currentPreset === 'deep_learning' ? 70 : 50,
        currentAudioPreset: currentPreset
      } : undefined;
      
      // Get user learning mode
      const learningMode = (session?.user as any)?.preferences?.learningMode || 'elite_operative';
      
      // Prepare AI request options
      const aiOptions: AiRequestOptions = {
        teachingStyle,
        systemPrompt: options.initialSystemPrompt,
        userContext: {
          learningMode,
          subjectContext: options.subjectContext,
          lessonContext: options.lessonContext,
          neuralState
        }
      };
      
      // Get all previous messages except system prompts
      const messageHistory = messages.filter(m => m.role !== 'system');
      
      // Send to AI service
      const result = await aiService.sendMessage([...messageHistory, userMessage], aiOptions);
      
      // Add AI response to messages
      const assistantMessage: AiMessage = { role: 'assistant', content: result.response };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update usage stats if available
      if (result.usage) {
        // Update usage stats based on provider's format
        // This is a simplified example
        const newTokens = (result.usage.total_tokens || result.usage.totalTokens || 0);
        setUsageStats(prev => ({
          tokensUsed: prev.tokensUsed + newTokens,
          messagesExchanged: prev.messagesExchanged + 1,
          estimatedCost: prev.estimatedCost + (newTokens / 1000) * 0.002 // Rough estimate
        }));
      }
      
      return assistantMessage;
    } catch (err) {
      console.error('Error sending message to AI tutor:', err);
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
  }, [initialized, messages, teachingStyle, options.initialSystemPrompt, options.subjectContext, options.lessonContext, isPlaying, currentPreset, session, toast]);
  
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
    // Keep initial context message if we have subject context
    if (options.subjectContext) {
      const contextMessage: AiMessage = {
        role: 'assistant',
        content: `I'm your NeuroForge AI Tutor for ${options.subjectContext}${options.lessonContext ? ` - ${options.lessonContext}` : ''}. How can I help you learn today?`
      };
      setMessages([contextMessage]);
    } else {
      setMessages([]);
    }
    
    toast({
      title: 'Conversation Cleared',
      description: 'Started a new conversation with your AI tutor.',
      duration: 3000
    });
  }, [options.subjectContext, options.lessonContext, toast]);
  
  return {
    initialized,
    loading,
    error,
    messages,
    teachingStyle,
    usageStats,
    sendMessage,
    changeTeachingStyle,
    clearConversation,
    initializeAi
  };
}