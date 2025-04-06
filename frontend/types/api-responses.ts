/**
 * API response types for NeuroForge frontend
 */

// Generic API response wrapper
export interface ApiDataResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
  }
  
  // Lesson details from API
  export interface LessonDetails {
    _id: string;
    title: string;
    description?: string;
    content?: string;
    contentType?: 'video' | 'text' | 'interactive' | 'quiz';
    subject: {
      _id: string;
      name: string;
    };
    difficulty: number; // 1-10 scale
    estimatedTimeMinutes?: number;
    keyTerms: string[];
    learningObjectives: string[];
    conceptualAreas: string[];
    mediaUrls?: string[];
    attachments?: Array<{
      name: string;
      url: string;
      type: string;
    }>;
    cognitiveEnhancement?: {
      focusLevel: number; // 1-10
      creativityLevel: number; // 1-10
      recommendedAudioPreset?: string;
    };
    version?: string;
    createdAt?: string;
    updatedAt?: string;
  }
  
  // Subject details from API
  export interface SubjectDetails {
    _id: string;
    name: string;
    description: string;
    category?: string;
    tags?: string[];
    difficulty?: number; // 1-10
    estimatedTimeHours?: number;
    prerequisites?: Array<{
      _id: string;
      name: string;
      description?: string;
    }>;
    lessons?: Array<{
      _id: string;
      title: string;
      order: number;
    }>;
    cognitiveEnhancement?: {
      recommendedAudioPreset: string | null;
      focusRequirement?: number; // 1-10
      creativityBenefit?: number; // 1-10
    };
    stats?: {
      studentsEnrolled: number;
      averageCompletionTimeHours: number;
      averageMasteryScore: number;
    };
    createdAt?: string;
    updatedAt?: string;
  }
  
  // User progress data from API
  export interface UserProgressData {
    userId: string;
    overallMastery: number; // 0-100
    completedLessons: number;
    totalLessons: number;
    subjectProgress?: Array<{
      subjectId: string;
      subjectName?: string;
      masteryPercentage: number;
      completedLessons: number;
      totalLessons: number;
      lastAccessedAt?: string;
    }>;
    recentAssessments?: Array<{
      lessonId: string;
      lessonTitle?: string;
      score: number; // 0-100
      completedAt: string;
      timeSpentMinutes: number;
      conceptResults?: Array<{
        conceptId?: string;
        conceptName: string;
        masteryPercentage: number;
      }>;
    }>;
    masteredTopics: string[]; // Topic IDs
    lessonAttempts: number;
    timeSpentToday: number; // Minutes
    streak?: {
      current: number;
      longest: number;
      lastActive: string;
    };
    attentionMetrics?: {
      focusScore: number; // 0-100
      consistencyScore: number; // 0-100
      distractionEvents: number;
      focusTrend?: 'improving' | 'declining' | 'stable';
    };
    recommendedLessons?: Array<{
      lessonId: string;
      lessonTitle: string;
      reason: string;
    }>;
    preferredLearningTimes?: Array<{
      dayOfWeek: number; // 0-6, where 0 is Sunday
      hourStart: number; // 0-23
      hourEnd: number; // 0-23
      performanceScore: number; // 0-100
    }>;
    audioPresetPerformance?: Array<{
      preset: string;
      averageScore: number; // 0-100
      timeSpentMinutes: number;
      subjectTypes?: string[]; // Types of subjects where this preset performed best
    }>;
    learningStyles?: Array<{
      style: string; // e.g., 'visual', 'auditory', 'kinesthetic'
      strength: number; // 0-100
    }>;
    lastUpdated: string;
  }