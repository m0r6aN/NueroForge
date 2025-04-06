// lib/api.ts
// API Functions for Gamification System

import { GamificationStatus, Achievement, StreakData } from '@/contexts/GamificationContext';

/**
 * Fetch user's gamification status including level, XP, and recent gains
 */
export async function fetchGamificationStatus(): Promise<GamificationStatus> {
  try {
    const response = await fetch('/api/gamification/status');
    
    if (!response.ok) {
      throw new Error(`Error fetching gamification status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Convert date strings to Date objects for recent XP gains
    return {
      ...data,
      recentXPGains: data.recentXPGains.map((gain: { amount: number; source: string; timestamp: string }) => ({
        ...gain,
        timestamp: new Date(gain.timestamp)
      }))
    };
  } catch (error) {
    console.error('Failed to fetch gamification status:', error);
    throw error;
  }
}

/**
 * Fetch all achievements with user's progress
 */
export async function fetchAchievements(): Promise<Achievement[]> {
  try {
    const response = await fetch('/api/gamification/achievements');
    
    if (!response.ok) {
      throw new Error(`Error fetching achievements: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Convert date strings to Date objects
    return data.map((achievement: Achievement) => ({
      ...achievement,
      dateUnlocked: achievement.dateUnlocked ? new Date(achievement.dateUnlocked) : undefined
    }));
  } catch (error) {
    console.error('Failed to fetch achievements:', error);
    throw error;
  }
}

/**
 * Fetch user's streak data
 */
export async function fetchStreakData(): Promise<StreakData> {
  try {
    const response = await fetch('/api/gamification/streak');
    
    if (!response.ok) {
      throw new Error(`Error fetching streak data: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Convert date strings to Date objects
    return {
      ...data,
      lastActiveDate: new Date(data.lastActiveDate),
      streakHistory: data.streakHistory.map((day: { date: string; completed: boolean }) => ({
        ...day,
        date: new Date(day.date)
      })),
      dailyDeadline: data.dailyDeadline ? new Date(data.dailyDeadline) : undefined
    };
  } catch (error) {
    console.error('Failed to fetch streak data:', error);
    throw error;
  }
}

/**
 * Record user activity and get XP rewards
 */
export async function recordActivity(activityType: string, details: Record<string, unknown> = {}): Promise<{
  xpGained: number;
  achievements: {
    id: string;
    title: string;
    tier: string;
    description: string;
  }[];
  levelUp: {
    oldLevel: number;
    newLevel: number;
    rank: string;
    unlockedFeatures: string[];
  } | null;
  streakUpdated: boolean;
}> {
  try {
    const response = await fetch('/api/gamification/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        activityType,
        details,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error recording activity: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to record activity:', error);
    throw error;
  }
}

/**
 * Initialize mock API if in development mode
 * This is for demo purposes - would be removed in production
 */
export function initMockAPI() {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && !window.mockInitialized) {
    // Mock API responses
    const mockGamificationStatus: GamificationStatus = {
      level: 5,
      rank: 'Agent',
      currentXP: 240,
      nextLevelXP: 500,
      totalXP: 1240,
      recentXPGains: [
        {
          amount: 25,
          source: 'Lesson Completed: Advanced Pattern Recognition',
          timestamp: new Date(Date.now() - 3600000)
        },
        {
          amount: 15,
          source: 'Quiz Score: Memory Enhancement',
          timestamp: new Date(Date.now() - 7200000)
        },
        {
          amount: 50,
          source: 'Streak Bonus: 7 Days',
          timestamp: new Date(Date.now() - 86400000)
        }
      ]
    };
    
    // A subset of achievements for the mock
    const mockAchievements: Achievement[] = [
      {
        id: 'first-mission',
        title: 'First Mission',
        description: 'Complete your first learning module',
        category: 'learning',
        tier: 'classified',
        isUnlocked: true,
        dateUnlocked: new Date(Date.now() - 604800000),
        criteria: 'Complete any learning module',
        xpReward: 25,
        icon: 'shield'
      },
      {
        id: 'focus-adept',
        title: 'Focus Adept',
        description: 'Maintain focus state for 30 minutes',
        category: 'neural',
        tier: 'confidential',
        isUnlocked: true,
        dateUnlocked: new Date(Date.now() - 172800000),
        criteria: 'Maintain at least 80% focus score for 30 consecutive minutes',
        xpReward: 40,
        icon: 'zap'
      },
      {
        id: 'week-warrior',
        title: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        category: 'streak',
        tier: 'classified',
        isUnlocked: true,
        dateUnlocked: new Date(Date.now() - 86400000),
        criteria: 'Complete at least one learning activity for 7 consecutive days',
        xpReward: 50,
        icon: 'timer'
      },
      // Additional mock achievements (more than in the UI demo so we can simulate unlocks)
      {
        id: 'memory-master',
        title: 'Memory Master',
        description: 'Score 100% on a memory enhancement test',
        category: 'neural',
        tier: 'confidential',
        isUnlocked: false,
        progress: 75,
        criteria: 'Achieve a perfect score on any memory test',
        xpReward: 50,
        icon: 'brain'
      },
      {
        id: 'audio-explorer',
        title: 'Audio Explorer',
        description: 'Try all audio enhancement presets',
        category: 'discovery',
        tier: 'confidential',
        isUnlocked: false,
        progress: 50,
        criteria: 'Use Focus, Creative, Deep Learning, and Relaxation audio presets at least once each',
        xpReward: 35,
        icon: 'zap'
      },
      {
        id: 'night-owl',
        title: 'Night Owl',
        description: 'Complete training sessions after midnight',
        category: 'discovery',
        tier: 'secret',
        isUnlocked: false,
        progress: 20,
        criteria: 'Complete 5 learning modules between 12 AM and 5 AM',
        xpReward: 60,
        icon: 'shield'
      }
    ];
    
    // Mock streak data
    const mockStreakData: StreakData = {
      currentStreak: 7,
      longestStreak: 7,
      lastActiveDate: new Date(),
      streakHistory: Array.from({ length: 30 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date,
          completed: i <= 7 || Math.random() > 0.3
        };
      }),
      milestones: [
        {
          count: 3,
          reward: 'Basic Focus Enhancement Badge',
          reached: true
        },
        {
          count: 7,
          reward: 'Weekly Warrior Badge + 50 XP Bonus',
          reached: true
        },
        {
          count: 14,
          reward: 'Fortnight Focus Badge + 100 XP Bonus',
          reached: false
        },
        {
          count: 30,
          reward: 'Elite Monthlong Mission Badge + 200 XP Bonus',
          reached: false
        }
      ]
    };
    
    // Mock fetch implementations
    const originalFetch = window.fetch;
    window.fetch = async (url, options) => {
      // If not an API route we care about, use the original fetch
      if (typeof url !== 'string' || !url.startsWith('/api/gamification')) {
        return originalFetch(url, options as RequestInit);
      }
      
      // Add artificial delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock API responses
      if (url === '/api/gamification/status') {
        return new Response(JSON.stringify(mockGamificationStatus), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (url === '/api/gamification/achievements') {
        return new Response(JSON.stringify(mockAchievements), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (url === '/api/gamification/streak') {
        return new Response(JSON.stringify(mockStreakData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (url === '/api/gamification/activity' && options?.method === 'POST') {
        const body = options.body ? JSON.parse(options.body as string) : {};
        const activityType = body.activityType || '';
        
        // Simulate different responses based on activity type
        const response: {
          xpGained: number;
          achievements: {
            id: string;
            title: string;
            tier: string;
            description: string;
          }[];
          levelUp: {
            oldLevel: number;
            newLevel: number;
            rank: string;
            unlockedFeatures: string[];
          } | null;
          streakUpdated: boolean;
        } = {
          xpGained: Math.floor(Math.random() * 30) + 10,
          achievements: [],
          levelUp: null,
          streakUpdated: false
        };
        
        // Randomize achievement unlocks
        if (Math.random() > 0.6) {
          const unlockedAchievement = mockAchievements.find(a => !a.isUnlocked);
          if (unlockedAchievement) {
            response.achievements.push({
              id: unlockedAchievement.id,
              title: unlockedAchievement.title,
              tier: unlockedAchievement.tier,
              description: unlockedAchievement.description
            });
            
            // Update our mock data
            const index = mockAchievements.findIndex(a => a.id === unlockedAchievement.id);
            if (index !== -1) {
              mockAchievements[index].isUnlocked = true;
              mockAchievements[index].dateUnlocked = new Date();
            }
          }
        }
        
        // Simulate level up (occasionally)
        if (Math.random() > 0.8) {
          response.levelUp = {
            oldLevel: mockGamificationStatus.level,
            newLevel: mockGamificationStatus.level + 1,
            rank: 'Senior Agent',
            unlockedFeatures: ['Advanced Focus Training', 'New Avatar Options']
          };
          
          // Update our mock data
          mockGamificationStatus.level += 1;
        }
        
        // Simulate streak update for daily login
        if (activityType === 'daily_login') {
          response.streakUpdated = true;
        }
        
        // Update XP in mock data
        mockGamificationStatus.currentXP += response.xpGained;
        mockGamificationStatus.totalXP += response.xpGained;
        
        // Add to recent XP gains
        mockGamificationStatus.recentXPGains.unshift({
          amount: response.xpGained,
          source: body.details?.source || activityType,
          timestamp: new Date()
        });
        
        // Keep only the 10 most recent
        mockGamificationStatus.recentXPGains = mockGamificationStatus.recentXPGains.slice(0, 10);
        
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // If we get here, it's an API route we don't recognize
      return new Response(JSON.stringify({ error: 'Not implemented in mock' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    };
    
    //window.mockInitialized = true;
    console.log('Mock API initialized for development');
  }
}

// Init the mock API when in development
declare global {
  interface Window {
    mockInitialized?: boolean;
    fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  }
}

// Extend the Window interface to include mockInitialized (removed as unused)

if (process.env.NODE_ENV === 'development') {
  // Only initialize in client-side
  if (typeof window !== 'undefined') {
    // Call on next tick to avoid issues with module initialization
    setTimeout(initMockAPI, 0);
  }
}
