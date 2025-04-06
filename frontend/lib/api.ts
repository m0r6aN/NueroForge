// neuroforge/frontend/lib/api.ts
// ... (add new functions)

import { ApiResponse } from "@/types/api-usage";

function fetchApi<T>(id: string, options?: RequestInit): Promise<ApiResponse<T>> {
    console.log(`Fetching API: ${id}`, options);
    throw new Error("Function not implemented.");
}

// --- Learning & SRS ---

export async function getSubjectLessons(subjectId: string): Promise<ApiResponse<any[]>> { // Define Lesson type
    return fetchApi<any[]>(`/learning/subject/${subjectId}/lessons`);
}

export async function getLessonById(lessonId: string): Promise<ApiResponse<any>> { // Define Lesson type
    return fetchApi<any>(`/learning/lesson/${lessonId}`);
}

export async function completeLesson(lessonId: string): Promise<ApiResponse<{ xpAwarded: number }>> {
    return fetchApi<{ xpAwarded: number }>(`/learning/lesson/${lessonId}/complete`, { method: 'POST' });
}

export async function getDueReviewItems(limit: number = 20): Promise<ApiResponse<any[]>> { // Define UserProgress<Lesson> type
    return fetchApi<any[]>(`/learning/reviews/due?limit=${limit}`);
}

export async function submitReview(progressId: string, performanceScore: number): Promise<ApiResponse<any>> { // Define UserProgress type
    return fetchApi<any>(`/learning/reviews/${progressId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ performanceScore }),
    });
}

/ Fetch focus timer lesson
export async function fetchFocusTimer(lessonId) {
  try {
    const response = await fetch(`/api/learning/focustimer/${lessonId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch focus timer');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching focus timer:', error);
    throw error;
  }
}

// Submit focus timer results
export async function submitFocusTimerResults(lessonId, results) {
  try {
    const response = await fetch(`/api/learning/focustimer/${lessonId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(results),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit focus timer results');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting focus timer results:', error);
    throw error;
  }
}

// --- AI ---

interface AiTutorResponse {
    reply: string;
    // other potential fields
}

export async function postToAiTutor(
    message: string,
    context?: { lessonId: string }, // Define the expected structure of context
    teachingStyle?: string,
    personality?: string
): Promise<ApiResponse<AiTutorResponse>> {
    return fetchApi<AiTutorResponse>('/ai/tutor/chat', {
        method: 'POST',
        body: JSON.stringify({ message, context, teachingStyle, personality }),
    });
}


