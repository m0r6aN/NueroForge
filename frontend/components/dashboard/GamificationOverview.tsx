// components/dashboard/GamificationOverview.tsx
"use client";

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from 'components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from 'components/ui/skeleton';
import { useRouter } from 'next/navigation';

import AchievementBadge from '@/components/gamification/AchievementBadge';
import LevelDisplay from '@/components/gamification/LevelDisplay';
import StreakTracker from 'components/gamification/StreakTracker';
import { useGamification } from '@/contexts/GamificationContext';
import { Award, Brain, Calendar, ExternalLink, Shield, Timer, Zap } from 'lucide-react';
import { Achievement } from 'contexts/GamificationContext';

export default function GamificationOverview() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('achievements');
  const { 
    status, 
    achievements, 
    streakData, 
    isLoading, 
    trackActivity,
    showXPGained,
    showAchievementUnlocked,
    showLevelUp
  } = useGamification();
  
  // Get recent achievements (last 6)
  const recentAchievements = [...achievements]
    .filter(a => a.isUnlocked)
    .sort((a, b) => {
      return (b.dateUnlocked?.getTime() || 0) - (a.dateUnlocked?.getTime() || 0);
    })
    .slice(0, 6);
  
  // Get in-progress achievements
  const inProgressAchievements = [...achievements]
    .filter(a => !a.isUnlocked && a.progress && a.progress > 0)
    .sort((a, b) => (b.progress || 0) - (a.progress || 0))
    .slice(0, 3);
  
  // Helper to get icon for achievement
  interface AchievementIcon {
    icon?: 'zap' | 'brain' | 'shield' | 'timer' | 'award';
  }

  const getIconForAchievement = (achievement: AchievementIcon) => {
    if (!achievement.icon) return null;
    
    // Map string icon names to Lucide components
    switch (achievement.icon) {
      case 'zap': return <Zap />;
      case 'brain': return <Brain />;
      case 'shield': return <Shield />;
      case 'timer': return <Timer />;
      case 'award': return <Award />;
      default: return null;
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Neural Enhancement Status</CardTitle>
          <CardDescription>Your gamification progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Demo toolbar (for testing in development)
  const DemoControls = () => {
    return process.env.NODE_ENV === 'development' ? (
      <div className="mt-6 p-3 border border-amber-800/40 rounded bg-amber-900/10">
        <h3 className="font-bold text-amber-400 text-sm mb-2">Development Testing Controls</h3>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => trackActivity('complete_lesson', { lessonId: 'demo-lesson-1' })}
          >
            Simulate Lesson Completion
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => trackActivity('daily_login')}
          >
            Simulate Daily Login
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => showXPGained(25, 'Demo: Quiz Completed')}
          >
            Show XP Notification
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const unlockedAchievement: Achievement | undefined = achievements.find((a: Achievement) => !a.isUnlocked);
              if (unlockedAchievement) {
                showAchievementUnlocked(unlockedAchievement.id);
              }
            }}
          >
            Unlock Achievement
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if (status) {
                showLevelUp(
                  status.level, 
                  status.level + 1, 
                  'Senior Agent', 
                  ['Advanced Neural Techniques', 'New Avatar Items']
                );
              }
            }}
          >
            Simulate Level Up
          </Button>
        </div>
      </div>
    ) : null;
  };
  
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle>Neural Enhancement Status</CardTitle>
        <CardDescription>Your NeuroForge gamification progress</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Level and XP Display */}
        {status && (
          <LevelDisplay 
            currentLevel={status.level}
            currentXP={status.currentXP}
            nextLevelXP={status.nextLevelXP}
            rank={status.rank}
            totalXP={status.totalXP}
            recentXPGains={status.recentXPGains}
            showDetail={true}
          />
        )}
        
        {/* Tabs for different gamification aspects */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-zinc-950 border border-zinc-800">
            <TabsTrigger value="achievements" className="data-[state=active]:bg-zinc-800 flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="streak" className="data-[state=active]:bg-zinc-800 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Streak</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Achievements Content */}
          <TabsContent value="achievements" className="space-y-4 mt-4">
            {recentAchievements.length > 0 ? (
              <>
                <div>
                  <h3 className="text-sm font-medium mb-3">Recent Achievements</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {recentAchievements.map((achievement) => (
                      <AchievementBadge
                        key={achievement.id}
                        id={achievement.id}
                        title={achievement.title}
                        description={achievement.description}
                        tier={achievement.tier}
                        isUnlocked={true}
                        dateUnlocked={achievement.dateUnlocked}
                        icon={getIconForAchievement({ icon: achievement.icon as AchievementIcon['icon'] })}
                        size="sm"
                        onClick={() => router.push('/achievements')}
                      />
                    ))}
                  </div>
                </div>
                
                {inProgressAchievements.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">In Progress</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {inProgressAchievements.map((achievement) => (
                        <AchievementBadge
                          key={achievement.id}
                          id={achievement.id}
                          title={achievement.title}
                          description={achievement.description}
                          tier={achievement.tier}
                          isUnlocked={false}
                          progress={achievement.progress}
                          icon={getIconForAchievement({ icon: achievement.icon as AchievementIcon['icon'] })}
                          size="sm"
                          onClick={() => router.push('/achievements')}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-2">No achievements yet</h3>
                <p className="text-gray-400 max-w-md mx-auto mb-4">
                  Complete learning activities to unlock achievements and earn rewards.
                </p>
                <Button onClick={() => router.push('/achievements')}>
                  View All Possible Achievements
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Streak Content */}
          <TabsContent value="streak" className="mt-4">
            {streakData ? (
              <StreakTracker
                currentStreak={streakData.currentStreak}
                longestStreak={streakData.longestStreak}
                lastActiveDate={streakData.lastActiveDate}
                streakHistory={streakData.streakHistory}
                milestones={streakData.milestones}
                onViewAllHistory={() => router.push('/achievements')}
              />
            ) : (
              <div className="text-center py-6">
                <Timer className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-2">No streak data yet</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Start your learning journey to begin tracking your daily streak.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Demo controls for development */}
        <DemoControls />
      </CardContent>
      
      <CardFooter className="pt-2 pb-4">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2" 
          onClick={() => router.push('/achievements')}
        >
          <ExternalLink className="h-4 w-4" />
          <span>View Full Achievement Records</span>
        </Button>
      </CardFooter>
    </Card>
  );
}