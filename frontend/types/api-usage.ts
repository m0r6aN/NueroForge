/**
 * Types for API usage tracking and rate limiting
 */

/**
 * Represents usage metrics from AI service providers
 */
export interface AIServiceUsage {
    // Token counts (common across most LLM providers)
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    
    // Model specific information
    model: string;
    
    // Provider-specific metrics (optional)
    provider: {
      name: string;
      requestId?: string;
      latencyMs?: number;
    };
    
    // Cost estimation (in USD)
    cost: {
      estimated: number;
      currency: string;
    };
    
    // Rate limit information
    rateLimit?: {
      limit: number;
      remaining: number;
      reset: number; // Unix timestamp
    };
  }
  
  /**
   * Represents audio processing usage metrics
   */
  export interface AudioProcessingUsage {
    // Duration of processed audio
    duration: {
      seconds: number;
    };
    
    // Type of processing performed
    processingType: 'binaural' | 'isochronic' | 'mixed';
    
    // Resource consumption
    resources: {
      cpuTimeMs: number;
      memoryMb: number;
    };
    
    // Cost estimation (in USD)
    cost: {
      estimated: number;
      currency: string;
    };
  }
  
  /**
   * Represents AR processing usage metrics
   */
  export interface ARProcessingUsage {
    // Session information
    session: {
      durationSeconds: number;
      objectsRendered: number;
      interactionsCount: number;
    };
    
    // Resource consumption
    resources: {
      cpuTimeMs: number;
      gpuTimeMs: number;
      memoryMb: number;
    };
    
    // Cost estimation (in USD)
    cost: {
      estimated: number;
      currency: string;
    };
  }
  
  /**
   * Union type for all usage tracking
   */
  export type ApiUsage = AIServiceUsage | AudioProcessingUsage | ARProcessingUsage;
  
  /**
   * Response including usage metrics
   */
  export interface ApiResponse<T> {
    response: T;
    usage?: ApiUsage;
  }