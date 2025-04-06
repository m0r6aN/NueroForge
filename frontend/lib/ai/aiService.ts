// neuroforge/frontend/lib/ai/aiService.ts
// Purpose: Core AI service for Neural AI interactions

import { ApiResponse, AIServiceUsage } from 'types/api-usage';

/**
 * Message types for AI interactions
 */
export type AiMessageRole = 'user' | 'assistant' | 'system';

/**
 * Represents a message in a conversation with the AI
 */
export interface AiMessage {
  role: AiMessageRole;
  content: string;
}

/**
 * Context that can be provided to the AI for personalized responses
 */
export interface AiUserContext {
  learningMode?: string; // e.g., 'socratic', 'explanatory', 'quiz'
  subjectContext?: string;
  lessonContext?: string;
  progressData?: {
    overallMastery: number; // 0-100%
    subjectMastery: number; // 0-100% for current subject
    lessonAttempts: number;
    challengeAreas: string[];
    strengths: string[];
    recentPerformance: number; // 0-100%
    timeSpentLearning: number; // minutes today
    attentionMetrics: {
      focusScore: number; // 0-100
      consistencyScore: number; // 0-100
      distractionEvents: number;
    };
  };
  neuralState?: {
    focusLevel?: number; // 0-100
    currentAudioPreset?: string;
  };
}

/**
 * Options for AI requests
 */
export interface AiRequestOptions {
  model?: string; // AI model to use
  systemPrompt?: string; // System instructions
  temperature?: number; // 0-1, lower is more deterministic
  maxTokens?: number; // Maximum response length
  userContext?: AiUserContext; // Additional context
  trackUsage?: boolean; // Whether to track token usage
}

/**
 * AI service response
 */
export interface AiResponse extends ApiResponse<string> {
  usage?: AIServiceUsage;
}

/**
 * AI message handler configuration
 */
export interface AiServiceConfig {
  defaultModel: string;
  defaultSystemPrompt: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  apiKey?: string;
  provider: 'anthropic' | 'openai' | 'gemini' | 'local';
  baseUrl?: string;
}

/**
 * Request body types for different AI providers
 */
interface AnthropicRequestBody {
  model: string;
  messages: AiMessage[];
  max_tokens: number;
  temperature: number;
  system: string;
}

interface OpenAIRequestBody {
  model: string;
  messages: AiMessage[];
  max_tokens: number;
  temperature: number;
}

interface GeminiRequestBody {
  contents: { role: string; parts: { text: string }[] }[]; // Gemini has a different format for messages
  generationConfig: {
    maxOutputTokens: number;
    temperature: number;
  };
}

interface LocalRequestBody {
  messages: AiMessage[];
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  userContext?: AiUserContext;
}

// Union type for all request body types
type AiRequestBody = AnthropicRequestBody | OpenAIRequestBody | GeminiRequestBody | LocalRequestBody;

/**
 * Core AI service for Neural AI interactions
 */
class AiService {
  private config: AiServiceConfig;
  
  constructor(config: AiServiceConfig) {
    this.config = config;
  }
  
  /**
   * Send a message to the AI service
   * 
   * @param messages Array of messages in the conversation
   * @param options Request options
   * @returns Promise with the AI response
   */
  async sendMessage(
    messages: AiMessage[],
    options: AiRequestOptions = {}
  ): Promise<AiResponse> {
    try {
      const {
        model = this.config.defaultModel,
        systemPrompt = this.config.defaultSystemPrompt,
        temperature = this.config.defaultTemperature,
        maxTokens = this.config.defaultMaxTokens,
        userContext,
        trackUsage = true
      } = options;
      
      // Prepare the request based on the AI provider
      let endpoint = '';
      let requestBody: AiRequestBody;
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      switch (this.config.provider) {
        case 'anthropic':
          endpoint = this.config.baseUrl || 'https://api.anthropic.com/v1/messages';
          headers['x-api-key'] = this.config.apiKey || process.env.ANTHROPIC_API_KEY || '';
          headers['anthropic-version'] = '2023-06-01';
          
          requestBody = {
            model,
            messages,
            max_tokens: maxTokens,
            temperature,
            system: systemPrompt
          } as AnthropicRequestBody;
          break;
          
        case 'openai':
          endpoint = this.config.baseUrl || 'https://api.openai.com/v1/chat/completions';
          headers['Authorization'] = `Bearer ${this.config.apiKey || process.env.OPENAI_API_KEY || ''}`;
          
          // Add system message to the beginning if provided
          const openaiMessages = systemPrompt 
            ? [{ role: 'system', content: systemPrompt }, ...messages]
            : messages;
            
          requestBody = {
            model,
            messages: openaiMessages,
            max_tokens: maxTokens,
            temperature
          } as OpenAIRequestBody;
          break;
          
        case 'gemini':
          endpoint = this.config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent';
          headers['x-goog-api-key'] = this.config.apiKey || process.env.GEMINI_API_KEY || '';
          
          // Convert messages to Gemini format
          const geminiMessages = systemPrompt 
            ? [{ role: 'system', parts: [{ text: systemPrompt }] }, ...this.convertToGeminiFormat(messages)]
            : this.convertToGeminiFormat(messages);
            
          requestBody = {
            contents: geminiMessages,
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature
            }
          } as GeminiRequestBody;
          break;
          
        case 'local':
          endpoint = this.config.baseUrl || '/api/ai';
          // Use on-premises AI with JWT auth if available
          const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          requestBody = {
            messages,
            model,
            systemPrompt,
            temperature,
            maxTokens,
            userContext
          } as LocalRequestBody;
          break;
          
        default:
          throw new Error(`Unsupported AI provider: ${this.config.provider}`);
      }
      
      // Make the API request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          `AI service error (${response.status}): ${
            errorData?.error?.message || response.statusText
          }`
        );
      }
      
      const data = await response.json();
      
      // Extract response based on provider format
      let responseText = '';
      let usage: AIServiceUsage | undefined;
      
      switch (this.config.provider) {
        case 'anthropic':
          responseText = data.content[0].text;
          if (trackUsage && data.usage) {
            usage = {
              tokens: {
                prompt: data.usage.input_tokens,
                completion: data.usage.output_tokens,
                total: data.usage.input_tokens + data.usage.output_tokens
              },
              model: data.model,
              provider: {
                name: 'Anthropic',
                requestId: data.id
              },
              cost: {
                estimated: this.calculateAnthropicCost(data.usage.input_tokens, data.usage.output_tokens, model),
                currency: 'USD'
              }
            };
          }
          break;
          
        case 'openai':
          responseText = data.choices[0].message.content;
          if (trackUsage && data.usage) {
            usage = {
              tokens: {
                prompt: data.usage.prompt_tokens,
                completion: data.usage.completion_tokens,
                total: data.usage.total_tokens
              },
              model: data.model,
              provider: {
                name: 'OpenAI'
              },
              cost: {
                estimated: this.calculateOpenAICost(data.usage.prompt_tokens, data.usage.completion_tokens, model),
                currency: 'USD'
              }
            };
          }
          break;
          
        case 'gemini':
          responseText = data.candidates[0].content.parts[0].text;
          // Gemini doesn't provide token usage in the same way
          if (trackUsage) {
            usage = {
              tokens: {
                prompt: 0, // Not provided by Gemini
                completion: 0, // Not provided by Gemini
                total: 0 // Not provided by Gemini
              },
              model,
              provider: {
                name: 'Google Gemini'
              },
              cost: {
                estimated: 0, // Would need a different calculation
                currency: 'USD'
              }
            };
          }
          break;
          
        case 'local':
          responseText = data.response;
          usage = data.usage;
          break;
          
        default:
          throw new Error(`Unsupported AI provider: ${this.config.provider}`);
      }
      
      return {
        response: responseText,
        usage
      };
      
    } catch (error) {
      console.error('AI service error:', error);
      throw error;
    }
  }
  
  /**
   * Convert messages to Gemini format
   */
  private convertToGeminiFormat(messages: AiMessage[]) {
    return messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }));
  }
  
  /**
   * Calculate estimated cost for Anthropic API usage
   */
  private calculateAnthropicCost(inputTokens: number, outputTokens: number, model: string): number {
    // Pricing as of April 2025 (example rates)
    const rates: Record<string, { input: number; output: number }> = {
      'claude-3-7-sonnet-20250219': { input: 0.000003, output: 0.000015 },
      'claude-3-opus-20250201': { input: 0.000015, output: 0.000075 },
      'claude-3-5-haiku-20250401': { input: 0.000001, output: 0.000005 }
    };
    
    const defaultRate = { input: 0.000003, output: 0.000015 };
    const rate = rates[model] || defaultRate;
    
    return (inputTokens * rate.input) + (outputTokens * rate.output);
  }
  
  /**
   * Calculate estimated cost for OpenAI API usage
   */
  private calculateOpenAICost(promptTokens: number, completionTokens: number, model: string): number {
    // Pricing as of April 2025 (example rates)
    const rates: Record<string, { prompt: number; completion: number }> = {
      'gpt-4o': { prompt: 0.000005, completion: 0.000015 },
      'gpt-4-turbo': { prompt: 0.00001, completion: 0.00003 },
      'gpt-4-turbo-2025': { prompt: 0.00001, completion: 0.00003 }
    };
    
    const defaultRate = { prompt: 0.000005, completion: 0.000015 };
    const rate = rates[model] || defaultRate;
    
    return (promptTokens * rate.prompt) + (completionTokens * rate.completion);
  }
  
  /**
   * Update the service configuration
   */
  updateConfig(newConfig: Partial<AiServiceConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }
}

// Create and export the singleton instance
export const aiService = new AiService({
  defaultModel: 'claude-3-7-sonnet-20250219',
  defaultSystemPrompt: 'You are a NeuroForge AI Tutor, designed to provide personalized learning support.',
  defaultTemperature: 0.7,
  defaultMaxTokens: 1000,
  provider: 'anthropic',
  baseUrl: process.env.ANTHROPIC_API_URL
});