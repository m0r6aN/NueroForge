// contexts/GamificationContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useGamificationNotifications, LevelUpOverlay } from 'components/gamification/GamificationNotification';
import { AchievementTier } from '@/components/gamification/AchievementBadge';
import { useRouter } from 'next/navigation';
import { toast } from "sonner"


// Define mock API functions - replace with actual implementation
import { 
  fetchApi,
  fetchGamificationStatus, 
  fetchAchievements, 
  fetchStreakData 
} from '@/lib/api'; // You'll implement these

// Define types
export interface GamificationStatus {
  level: number;
  rank: string;
  currentXP: number;
  nextLevelXP: number;
  totalXP: number;
  recentXPGains: Array<{
    amount: number;
    source: string;
    timestamp: Date;
  }>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  tier: AchievementTier;
  isUnlocked: boolean;
  progress?: number;
  dateUnlocked?: Date;
  criteria?: string;
  xpReward?: number;
  icon?: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date;
  streakHistory: Array<{
    date: Date;
    completed: boolean;
  }>;
  dailyDeadline?: Date;
  milestones: Array<{
    count: number;
    reward: string;
    reached: boolean;
  }>;
}

interface GamificationContextType {
  status: GamificationStatus | null;
  achievements: Achievement[];
  streakData: StreakData | null;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  trackActivity: (activityType: string, details?: any) => Promise<void>;
  showAchievementUnlocked: (achievementId: string) => void;
  showLevelUp: (oldLevel: number, newLevel: number, rank: string, unlockedFeatures: string[]) => void;
  showXPGained: (amount: number, source: string) => void;
  showStreakUpdated: (count: number, message: string) => void;
}

// Create context
const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

// Provider component
export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<GamificationStatus | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLevelUpVisible, setIsLevelUpVisible] = useState(false);
  const [levelUpDetails, setLevelUpDetails] = useState({
    oldLevel: 0,
    newLevel: 0,
    rank: '',
    unlockedFeatures: ['']
  });

  const router = useRouter();
  const notifications = useGamificationNotifications();

  // Load initial data
  useEffect(() => {
    refreshData();
  });

  // Function to refresh all gamification data
  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch gamification status
      const statusData = await fetchGamificationStatus();
      setStatus(statusData);
      
      // Fetch achievements
      const achievementsData = await fetchAchievements();
      setAchievements(achievementsData);
      
      // Fetch streak data
      const streakData = await fetchStreakData();
      setStreakData(streakData);
    } catch (error) {
      console.error('Error loading gamification data:', error);
      toast('Error loading gamification data', {
        description: 'Please try again later',
        action: {
          label: "Retry",
          onClick: () => console.log("Retrying..."),
        },
      });
    } finally {
      setIsLoading(false);
    }
  });

  // Function to show achievement unlocked notification
  const showAchievementUnlocked = useCallback((achievementId: string) => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return;
    
    notifications.showAchievementUnlocked(
      achievement.title,
      achievement.description,
      achievement.tier,
      () => router.push('/achievements')
    );
    
    // Update local achievements list to mark as unlocked
    setAchievements(prevAchievements => 
      prevAchievements.map(a => 
        a.id === achievementId 
          ? { ...a, isUnlocked: true, dateUnlocked: new Date() } 
          : a
      )
    );
  }, [achievements, notifications, router]);

  // Function to track user activity (learning, completing lessons, etc.)
  const trackActivity = useCallback(async (activityType: string, details?: string) => {
    try {
      // This would call your API to record the activity
      // For now, we'll just mock different responses
      console.log(`Tracking activity: ${activityType}`, details);
      // Mock response based on activity type
      if (activityType === 'complete_lesson') {
        // Mock XP gain
        const xpGained = Math.floor(Math.random() * 30) + 10;
        
        // Show XP notification
        notifications.showXPGained(xpGained, 'Lesson Completed');
        
        // Refresh data to update status
        await refreshData();
        
        // Check for level up (comparing old and new level)
        // This is just a simple example - your actual implementation would be more sophisticated
        if (status && status.level < status?.level + 1) {
          showLevelUp(
            status.level, 
            status.level + 1, 
            'Agent', 
            ['Advanced learning modules', 'New avatar customization']
          );
        }
      }
      
      if (activityType === 'daily_login') {
        // Update streak
        await refreshData();
        
        // Check if streak milestone reached
        if (streakData && streakData.currentStreak % 7 === 0) {
          notifications.showStreakUpdated(
            streakData.currentStreak,
            `Weekly streak milestone achieved! +${streakData.currentStreak * 2} bonus XP awarded.`
          );
        } else if (streakData) {
          notifications.showStreakUpdated(
            streakData.currentStreak,
            'Neural training streak maintained!'
          );
        }
      }
      
      // Simulate unlocking an achievement
      if (Math.random() > 0.7) {
        const unlockedAchievement = achievements.find(a => !a.isUnlocked);
        if (unlockedAchievement) {
          showAchievementUnlocked(unlockedAchievement.id);
        }
      }
      
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }, [status, streakData, achievements, notifications, refreshData, showAchievementUnlocked, showLevelUp]);

  // Function to show achievement unlocked notification
  const showAchievementUnlocked = useCallback((achievementId: string) => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return;
    
    notifications.showAchievementUnlocked(
      achievement.title,
      achievement.description,
      achievement.tier,
      () => router.push('/achievements')
    );
    
    // Update local achievements list to mark as unlocked
    setAchievements(prevAchievements => 
      prevAchievements.map(a => 
        a.id === achievementId 
          ? { ...a, isUnlocked: true, dateUnlocked: new Date() } 
          : a
      )
    );
  }, [achievements, notifications, router]);

  // Function to show level up notification and overlay
  const showLevelUp = useCallback((oldLevel: number, newLevel: number, rank: string, unlockedFeatures: string[]) => {
    // Show notification
    notifications.showLevelUp(
      newLevel, 
      `You've been promoted to Level ${newLevel}!`, 
      () => router.push('/profile')
    );
    
    // Show level up overlay
    setLevelUpDetails({
      oldLevel,
      newLevel,
      rank,
      unlockedFeatures
    });
    setIsLevelUpVisible(true);
  }, [notifications, router]);

  // Function to show XP gained notification
  const showXPGained = useCallback((amount: number, source: string) => {
    notifications.showXPGained(amount, source);
  }, [notifications]);

  // Function to show streak updated notification
  const showStreakUpdated = useCallback((count: number, message: string) => {
    notifications.showStreakUpdated(count, message, () => router.push('/dashboard'));
  }, [notifications, router]);

  // Context value
  const value = {
    status,
    achievements,
    streakData,
    isLoading,
    refreshData,
    trackActivity,
    showAchievementUnlocked,
    showLevelUp,
    showXPGained,
    showStreakUpdated
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
      <notifications.NotificationsRenderer />
      <LevelUpOverlay
        isVisible={isLevelUpVisible}
        onClose={() => setIsLevelUpVisible(false)}
        oldLevel={levelUpDetails.oldLevel}
        newLevel={levelUpDetails.newLevel}
        newRank={levelUpDetails.rank}
        unlockedFeatures={levelUpDetails.unlockedFeatures}
      />
    </GamificationContext.Provider>
  );
};

// Custom hook to use the gamification context
export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

// Mock API implementation for testing/development
// You'd replace these with actual API calls in production
export const setupMockGamificationAPI = () => {
  // Mock status data
  const mockStatus: GamificationStatus = {
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
  
  // Mock achievements data
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
    },
    {
      id: 'elite-operative',
      title: 'Elite Operative',
      description: 'Reach Level 10 clearance',
      category: 'learning',
      tier: 'secret',
      isUnlocked: false,
      progress: 50,
      criteria: 'Achieve Level 10 through consistent neural enhancement',
      xpReward: 100,
      icon: 'award'
    },
    {
      id: 'master-of-focus',
      title: 'Master of Focus',
      description: 'Complete 10 lessons with the Focus audio preset',
      category: 'neural',
      tier: 'secret',
      isUnlocked: false,
      progress: 40,
      criteria: 'Complete 10 full learning modules while using the Focus audio preset',
      xpReward: 75,
      icon: 'brain'
    },
    {
      id: 'monthlong-mission',
      title: 'Monthlong Mission',
      description: 'Maintain a 30-day streak',
      category: 'streak',
      tier: 'top-secret',
      isUnlocked: false,
      progress: 23,
      criteria: 'Complete at least one learning activity for 30 consecutive days',
      xpReward: 200,
      icon: 'timer'
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
  
  // Mock API functions
  global.fetchGamificationStatus = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockStatus;
  };
  
  global.fetchAchievements = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));
    return mockAchievements;
  };
  
  global.fetchStreakData = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockStreakData;
  };
};

export default GamificationContext;