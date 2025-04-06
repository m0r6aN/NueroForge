/**
 * Frontend API client for interacting with the DynamicLearningPathService
 * This service allows the frontend to fetch personalized learning paths
 * without directly accessing the database
 */

import { LearningPath } from '@/types/';

/**
 * Fetches a personalized learning path for the current user
 * 
 * @param subjectIds Optional array of subject IDs to constrain the path
 * @returns A Promise resolving to the learning path data
 */
export async function fetchLearningPath(subjectIds?: string[]): Promise<{
  success: boolean;
  data?: LearningPath;
  error?: string;
}> {
  try {
    const queryParams = new URLSearchParams();
    
    if (subjectIds && subjectIds.length > 0) {
      queryParams.set('subjects', subjectIds.join(','));
    }
    
    const response = await fetch(`/api/learning-path?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error fetching learning path:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetches the recommended next learning path based on user progress and cognitive state
 * @returns Promise with the next learning path data
 */
export async function fetchNextPath() {
  try {
    const response = await fetch('/api/learning/path/next', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch next learning path');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching next learning path:', error);
    throw error;
  }
}

/**
 * Invalidates the cached learning path for the current user
 * Call this when the user completes a subject or their performance data changes
 * 
 * @returns A Promise resolving to a success/failure status
 */
export async function invalidateLearningPathCache(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch('/api/learning-path/invalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Error invalidating learning path cache:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Updates the order of subjects in the user's learning path
 * This is used when the user manually reorders subjects via drag-and-drop
 * 
 * @param subjectIds Array of subject IDs in the new order
 * @returns A Promise resolving to a success/failure status
 */
export async function updateLearningPathOrder(subjectIds: string[]): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch('/api/learning-path/reorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subjectIds }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Error updating learning path order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}