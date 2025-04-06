import { Subject, LearningPath, UserPerformance, CognitiveFeedback } from '@/types';
import { db } from '@/lib/db';

/**
 * DynamicLearningPathService 
 * 
 * BACKEND SERVICE - Runs on Node.js with Express
 * 
 * Implements the core Graph-based ordering algorithm for NeuroForge's dynamic subject sequencing
 * - Treats subjects as nodes and dependencies as edges
 * - Creates optimal learning paths based on cognitive performance and subject dependencies
 * - Caches common paths for performance optimization
 * 
 * This service should be deployed as part of the backend API
 * and exposed via API endpoints for the frontend to consume
 */
export class DynamicLearningPathService {
  // Cache for common learning paths to improve performance
  private static pathCache: Map<string, LearningPath> = new Map();
  
  /**
   * Creates an optimal learning path for a user based on their performance and subject dependencies
   * 
   * @param userId The ID of the user
   * @param subjectIds Optional array of subject IDs to constrain the path to specific subjects
   * @returns A personalized learning path with ordered subjects and recommendations
   */
  public static async createLearningPath(userId: string, subjectIds?: string[]): Promise<LearningPath> {
    // Generate cache key based on inputs
    const cacheKey = this.generateCacheKey(userId, subjectIds);
    
    // Check if we have a cached path that hasn't expired
    const cachedPath = this.pathCache.get(cacheKey);
    if (cachedPath && !this.hasCacheExpired(cachedPath)) {
      return cachedPath;
    }
    
    try {
      // Fetch all required data
      const subjects = await this.fetchSubjects(subjectIds);
      const userPerformance = await this.fetchUserPerformance(userId);
      const userCognitiveFeedback = await this.fetchCognitiveFeedback(userId);
      
      // Build the subject dependency graph
      const graph = this.buildDependencyGraph(subjects);
      
      // Calculate initial ordering via topological sort
      let orderedSubjects = this.topologicalSort(graph);
      
      // Apply personalization based on user performance and cognitive feedback
      orderedSubjects = this.personalizeOrdering(
        orderedSubjects,
        userPerformance,
        userCognitiveFeedback
      );
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(
        orderedSubjects,
        userPerformance,
        userCognitiveFeedback
      );
      
      // Create the final learning path
      const learningPath: LearningPath = {
        userId,
        subjects: orderedSubjects,
        recommendations,
        generatedAt: new Date(),
        expiresAt: this.calculateExpirationTime(),
      };
      
      // Cache the path for future use
      this.pathCache.set(cacheKey, learningPath);
      
      return learningPath;
    } catch (error) {
      console.error('Error creating learning path:', error);
      throw new Error('Failed to create learning path');
    }
  }
  
  /**
   * Invalidates a user's cached learning path when curriculum changes
   * 
   * @param userId The ID of the user
   */
  public static invalidateCache(userId: string): void {
    // Remove all cached paths for this user
    for (const key of this.pathCache.keys()) {
      if (key.startsWith(`user:${userId}`)) {
        this.pathCache.delete(key);
      }
    }
  }
  
  /**
   * Invalidates all cached learning paths when global curriculum changes
   */
  public static invalidateAllCaches(): void {
    this.pathCache.clear();
  }
  
  /**
   * Fetches subjects from the database
   * 
   * @param subjectIds Optional array of specific subject IDs to fetch
   * @returns Array of Subject objects
   */
  private static async fetchSubjects(subjectIds?: string[]): Promise<Subject[]> {
    try {
      let query = {};
      
      if (subjectIds && subjectIds.length > 0) {
        query = { id: { $in: subjectIds } };
      }
      
      const subjects = await db.collection('subjects').find(query).toArray();
      return subjects as Subject[];
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw new Error('Failed to fetch subjects');
    }
  }
  
  /**
   * Fetches user performance data from the database
   * 
   * @param userId The ID of the user
   * @returns UserPerformance object with per-subject metrics
   */
  private static async fetchUserPerformance(userId: string): Promise<UserPerformance> {
    try {
      const performance = await db.collection('user_performance')
        .findOne({ userId });
        
      return performance as UserPerformance || {
        userId,
        subjectPerformance: {},
        averageScore: 0,
        learningRate: 1.0,
        completedSubjects: []
      };
    } catch (error) {
      console.error('Error fetching user performance:', error);
      throw new Error('Failed to fetch user performance');
    }
  }
  
  /**
   * Fetches cognitive feedback data for the user
   * 
   * @param userId The ID of the user
   * @returns CognitiveFeedback object with neural state data
   */
  private static async fetchCognitiveFeedback(userId: string): Promise<CognitiveFeedback> {
    try {
      const feedback = await db.collection('cognitive_feedback')
        .findOne({ userId });
        
      return feedback as CognitiveFeedback || {
        userId,
        optimalTimes: [],
        focusMetrics: {
          averageFocusScore: 0,
          focusPeaks: [],
          attentionSpanMinutes: 20
        },
        preferredAudioPresets: [],
        learningStyles: []
      };
    } catch (error) {
      console.error('Error fetching cognitive feedback:', error);
      throw new Error('Failed to fetch cognitive feedback');
    }
  }
  
  /**
   * Builds a dependency graph from subject data
   * 
   * @param subjects Array of Subject objects
   * @returns Map representing the graph (adjacency list)
   */
  private static buildDependencyGraph(subjects: Subject[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    // Initialize graph with all subjects (even those without dependencies)
    subjects.forEach(subject => {
      graph.set(subject.id, []);
    });
    
    // Add dependency edges
    subjects.forEach(subject => {
      if (subject.dependencies && subject.dependencies.length > 0) {
        subject.dependencies.forEach(depId => {
          const dependencies = graph.get(depId) || [];
          dependencies.push(subject.id);
          graph.set(depId, dependencies);
        });
      }
    });
    
    return graph;
  }
  
  /**
   * Performs a topological sort on the dependency graph
   * 
   * @param graph The subject dependency graph
   * @returns Array of ordered Subject IDs
   */
  private static topologicalSort(graph: Map<string, string[]>): string[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: string[] = [];
    
    // Helper function for depth-first search
    const visit = (id: string): void => {
      // Skip if already processed
      if (visited.has(id)) return;
      
      // Check for cyclic dependencies
      if (temp.has(id)) {
        console.warn(`Cyclic dependency detected involving subject ${id}`);
        return;
      }
      
      // Mark as being processed
      temp.add(id);
      
      // Visit dependencies first
      const dependencies = graph.get(id) || [];
      dependencies.forEach(dep => visit(dep));
      
      // Mark as processed and add to order
      temp.delete(id);
      visited.add(id);
      order.push(id);
    };
    
    // Process all nodes
    for (const id of graph.keys()) {
      if (!visited.has(id)) {
        visit(id);
      }
    }
    
    return order;
  }
  
  /**
   * Personalizes the subject ordering based on user performance and cognitive data
   * 
   * @param initialOrder Array of subject IDs in initial topological order
   * @param performance User performance data
   * @param cognitiveFeedback User cognitive feedback data
   * @returns Reordered array of subject IDs optimized for the user
   */
  private static personalizeOrdering(
    initialOrder: string[], 
    performance: UserPerformance,
    cognitiveFeedback: CognitiveFeedback
  ): string[] {
    // Clone the initial order to avoid modifying it
    const personalizedOrder = [...initialOrder];
    
    // Skip completed subjects to the end
    const completedSubjects = performance.completedSubjects || [];
    
    // Apply cognitive feedback adjustments
    // - Focus patterns might indicate which subjects to tackle when attention is fresh
    // - Learning styles can influence the order (e.g., visual learners may do better with certain subjects first)
    
    // For now, a simple implementation that:
    // 1. Moves completed subjects to the end
    // 2. Prioritizes subjects that match the user's learning styles
    
    // Sort the array using a custom comparator function
    personalizedOrder.sort((a, b) => {
      // Move completed subjects to the end
      const aCompleted = completedSubjects.includes(a);
      const bCompleted = completedSubjects.includes(b);
      
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      
      // Calculate a priority score for each subject based on learning styles and cognitive patterns
      const aScore = this.calculateSubjectPriorityScore(a, performance, cognitiveFeedback);
      const bScore = this.calculateSubjectPriorityScore(b, performance, cognitiveFeedback);
      
      // Higher scores should come first
      return bScore - aScore;
    });
    
    return personalizedOrder;
  }
  
  /**
   * Calculates a priority score for a subject based on user-specific factors
   * 
   * @param subjectId The ID of the subject
   * @param performance User performance data
   * @param cognitiveFeedback User cognitive feedback data
   * @returns A numerical score representing the priority (higher = more suitable)
   */
  private static calculateSubjectPriorityScore(
    subjectId: string,
    performance: UserPerformance,
    cognitiveFeedback: CognitiveFeedback
  ): number {
    let score = 50; // Base score
    
    // Adjust based on user's learning styles
    const subjectPerf = performance.subjectPerformance[subjectId];
    if (subjectPerf) {
      // If user has attempted this subject before, adjust score based on their success
      if (subjectPerf.attempts > 0) {
        // Lower priority if they struggled with it
        if (subjectPerf.averageScore < 50) {
          score -= 15;
        }
        // If they did well but didn't complete it, prioritize it to encourage completion
        else if (subjectPerf.averageScore > 70 && !performance.completedSubjects.includes(subjectId)) {
          score += 10;
        }
      }
      
      // Adjust based on cognitive patterns (e.g., time of day preferences)
      if (cognitiveFeedback.optimalTimes.length > 0) {
        const currentHour = new Date().getHours();
        const isOptimalTimeNow = cognitiveFeedback.optimalTimes.some(
          timeRange => currentHour >= timeRange.start && currentHour <= timeRange.end
        );
        
        // If it's an optimal learning time for the user, prioritize challenging subjects
        if (isOptimalTimeNow && subjectPerf.difficulty > 3) {
          score += 15;
        }
      }
      
      // Adjust based on attention span
      const attentionSpan = cognitiveFeedback.focusMetrics.attentionSpanMinutes;
      if (attentionSpan < 15 && subjectPerf.estimatedTimeMinutes > 20) {
        // Lower priority for long subjects when attention span is short
        score -= 10;
      }
    }
    
    return score;
  }
  
  /**
   * Generates recommendations based on the ordered subjects and user data
   * 
   * @param orderedSubjects Array of subject IDs in recommended order
   * @param performance User performance data
   * @param cognitiveFeedback User cognitive feedback data
   * @returns Array of recommendation objects
   */
  private static generateRecommendations(
    orderedSubjects: string[],
    performance: UserPerformance,
    cognitiveFeedback: CognitiveFeedback
  ): Array<{ type: string, message: string, subjectId?: string }> {
    const recommendations = [];
    
    // Recommend audio presets based on cognitive feedback and subject matter
    if (cognitiveFeedback.preferredAudioPresets.length > 0) {
      const nextSubject = orderedSubjects[0];
      const subjectPerf = performance.subjectPerformance[nextSubject];
      
      if (subjectPerf) {
        // Different recommendations based on subject type
        if (subjectPerf.subjectType === 'analytical') {
          recommendations.push({
            type: 'audio_preset',
            message: 'For analytical content like this, the Focus (Beta Waves) preset has been most effective for your learning.',
            subjectId: nextSubject
          });
        } else if (subjectPerf.subjectType === 'creative') {
          recommendations.push({
            type: 'audio_preset',
            message: 'Creative subjects like this one pair well with your performance using the Creative (Alpha Waves) preset.',
            subjectId: nextSubject
          });
        }
      }
    }
    
    // Recommend optimal time slots if the user shows time-based performance patterns
    if (cognitiveFeedback.optimalTimes.length > 0) {
      const nextDifficultSubject = orderedSubjects.find(id => {
        const subjectPerf = performance.subjectPerformance[id];
        return subjectPerf && subjectPerf.difficulty > 3;
      });
      
      if (nextDifficultSubject) {
        const optimalTimes = cognitiveFeedback.optimalTimes
          .map(time => `${time.start}:00-${time.end}:00`)
          .join(' or ');
          
        recommendations.push({
          type: 'optimal_time',
          message: `For challenging content, your peak performance hours are ${optimalTimes}. Consider scheduling this subject then.`,
          subjectId: nextDifficultSubject
        });
      }
    }
    
    // Recommend focus length based on attention span metrics
    const attentionSpan = cognitiveFeedback.focusMetrics.attentionSpanMinutes;
    recommendations.push({
      type: 'focus_length',
      message: `Your optimal learning sessions are ${attentionSpan} minutes. Take short breaks after this period to maintain neural efficiency.`
    });
    
    return recommendations;
  }
  
  /**
   * Generates a cache key based on user ID and optional subject IDs
   * 
   * @param userId The ID of the user
   * @param subjectIds Optional array of subject IDs
   * @returns A string key for the cache
   */
  private static generateCacheKey(userId: string, subjectIds?: string[]): string {
    let key = `user:${userId}`;
    
    if (subjectIds && subjectIds.length > 0) {
      // Sort to ensure consistent keys regardless of order
      const sortedIds = [...subjectIds].sort();
      key += `:subjects:${sortedIds.join(',')}`;
    }
    
    return key;
  }
  
  /**
   * Checks if a cached learning path has expired
   * 
   * @param path The cached learning path
   * @returns Boolean indicating if the cache has expired
   */
  private static hasCacheExpired(path: LearningPath): boolean {
    if (!path.expiresAt) return true;
    
    const now = new Date();
    return now > path.expiresAt;
  }
  
  /**
   * Calculates the expiration time for a learning path cache
   * 
   * @returns Date object representing when the cache expires
   */
  private static calculateExpirationTime(): Date {
    const expiresAt = new Date();
    // Cache valid for 24 hours by default
    expiresAt.setHours(expiresAt.getHours() + 24);
    return expiresAt;
  }
}