// components/gamification/StreakTracker.tsx
"use client";

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from 'components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Timer,
  Zap, 
  Gift, 
  TrendingUp, 
  AlertTriangle,
  Info,
  Lock
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface StreakMilestone {
  count: number;
  reward: string;
  reached: boolean;
}

export interface StreakDay {
  date: Date;
  completed: boolean;
}

export interface StreakTrackerProps {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date;
  streakHistory: StreakDay[];
  dayGoal?: number; // Daily activity goal if applicable
  currentDayProgress?: number; // Today's progress toward goal (0-100)
  dailyDeadline?: Date; // When the current streak would break
  milestones?: StreakMilestone[];
  showCalendar?: boolean;
  className?: string;
  onViewAllHistory?: () => void;
}

// Helper function to format date
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', { 
    weekday: 'short',
    month: 'short',
    day: 'numeric' 
  }).format(date);
};

// Helper function to get the day of the week (0 = Sunday, 6 = Saturday)
const getDayOfWeek = (date: Date): number => {
  return date.getDay();
};

// Helper to format the time
const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', { 
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
};

// Helper to check if two dates are the same day
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Helper to get time until midnight
const getTimeUntilMidnight = (date: Date = new Date()): { hours: number; minutes: number } => {
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const diff = tomorrow.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes };
};

export const StreakTracker: React.FC<StreakTrackerProps> = ({
  currentStreak,
  longestStreak,
  lastActiveDate,
  streakHistory,
  dayGoal,
  currentDayProgress = 0,
  dailyDeadline,
  milestones = [],
  showCalendar = true,
  className,
  onViewAllHistory
}) => {
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('week');
  
  // Calculate if streak is at risk (no activity today and has active streak)
  const today = new Date();
  const isToday = lastActiveDate ? isSameDay(lastActiveDate, today) : false;
  const streakAtRisk = currentStreak > 0 && !isToday;
  
  // Time remaining until deadline
  const timeUntilMidnight = getTimeUntilMidnight();
  
  // Sort milestones by count
  const sortedMilestones = [...milestones].sort((a, b) => a.count - b.count);
  
  // Get next milestone
  const nextMilestone = sortedMilestones.find(m => !m.reached);
  
  // Calculate progress to next milestone
  const milestoneProgress = nextMilestone 
    ? Math.min(100, (currentStreak / nextMilestone.count) * 100) 
    : 100;
  
  // Generate calendar data
  const generateCalendarData = () => {
    const today = new Date();
    let startDate: Date;
    
    if (calendarView === 'week') {
      // Start from 6 days ago for a 7-day view
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
    } else {
      // For month view, go back to show ~4 weeks (28 days)
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 27);
    }
    
    const days: Array<{ date: Date; status: 'completed' | 'missed' | 'future' | 'today' }> = [];
    
    // Fill in all dates in the range
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      const matchingDay = streakHistory.find(day => isSameDay(day.date, currentDate));
      
      // Determine status
      let status: 'completed' | 'missed' | 'future' | 'today';
      if (isSameDay(currentDate, today)) {
        status = 'today';
      } else if (matchingDay) {
        status = matchingDay.completed ? 'completed' : 'missed';
      } else {
        status = currentDate > today ? 'future' : 'missed';
      }
      
      days.push({ date: new Date(currentDate), status });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };
  
  const calendarData = generateCalendarData();
  
  return (
    <Card className={cn("bg-zinc-900 border-zinc-800", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-amber-500" />
              Neural Training Streak
            </CardTitle>
            <CardDescription>Consecutive days of cognitive enhancement</CardDescription>
          </div>
          
          {streakAtRisk && (
            <Badge variant="outline" className="bg-red-900/20 text-red-400 border-red-500 gap-1 flex items-center">
              <AlertTriangle className="h-3 w-3" />
              <span>At Risk</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Streak Counter Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-800/70 p-4 rounded border border-zinc-700/50 flex flex-col items-center justify-center">
            <div className="text-sm text-gray-400 mb-1">Current Streak</div>
            <div className="flex items-center">
              <div className="text-3xl font-bold font-mono text-amber-400">
                {currentStreak}
              </div>
              <div className="text-gray-400 ml-1">days</div>
            </div>
          </div>
          
          <div className="bg-zinc-800/70 p-4 rounded border border-zinc-700/50 flex flex-col items-center justify-center">
            <div className="text-sm text-gray-400 mb-1">Longest Streak</div>
            <div className="flex items-center">
              <div className="text-2xl font-bold font-mono text-blue-400">
                {longestStreak}
              </div>
              <div className="text-gray-400 ml-1">days</div>
            </div>
          </div>
          
          <div className="col-span-2 bg-zinc-800/70 p-4 rounded border border-zinc-700/50 flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-400 mb-1">Last Activity</div>
              <div className="text-white">
                {formatDate(lastActiveDate)}
                {isToday ? (
                  <Badge variant="outline" className="ml-2 bg-green-900/20 text-green-400 border-green-500">Today</Badge>
                ) : streakAtRisk ? (
                  <Badge variant="outline" className="ml-2 bg-red-900/20 text-red-400 border-red-500">
                    {Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24))} days ago
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-2">
                    {Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24))} days ago
                  </Badge>
                )}
              </div>
            </div>
            
            {streakAtRisk && (
              <div className="text-right">
                <div className="text-sm text-red-400 mb-1">Streak Expires</div>
                <div className="font-mono text-red-300">
                  {timeUntilMidnight.hours}h {timeUntilMidnight.minutes}m remaining
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Today's Progress (if not completed) */}
        {!isToday && dayGoal && (
          <div className="bg-zinc-800/50 p-4 rounded border border-zinc-700/50">
            <div className="flex justify-between mb-2">
              <div className="text-sm font-medium">Today's Training Goal</div>
              <div className="text-sm text-gray-400">{currentDayProgress}% Complete</div>
            </div>
            <Progress value={currentDayProgress} className="h-2 bg-zinc-700" />
            <div className="mt-2 text-xs text-gray-400">
              Complete your daily training to maintain your neural enhancement streak.
            </div>
          </div>
        )}
        
        {/* Calendar View */}
        {showCalendar && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Activity History</span>
              </div>
              
              <div className="flex gap-1">
                <Button 
                  variant={calendarView === 'week' ? "secondary" : "outline"} 
                  size="sm"
                  onClick={() => setCalendarView('week')}
                  className="h-7 px-2 text-xs"
                >
                  Week
                </Button>
                <Button 
                  variant={calendarView === 'month' ? "secondary" : "outline"} 
                  size="sm"
                  onClick={() => setCalendarView('month')}
                  className="h-7 px-2 text-xs"
                >
                  Month
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {/* Day labels */}
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={`day-${i}`} className="text-xs text-center text-gray-400 py-1">
                  {day}
                </div>
              ))}
              
              {/* Fill empty cells for the first row based on start date day of week */}
              {Array.from({ length: getDayOfWeek(calendarData[0].date) }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {/* Calendar days */}
              {calendarData.map((day, index) => (
                <TooltipProvider key={`day-${index}`}>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <div 
                        className={cn(
                          "aspect-square rounded flex items-center justify-center text-xs font-medium relative",
                          day.status === 'completed' ? "bg-green-500/20 border border-green-500/50 text-green-400" :
                          day.status === 'missed' ? "bg-red-500/10 border border-red-500/30 text-gray-400" :
                          day.status === 'today' ? "bg-amber-500/20 border border-amber-500/50 text-amber-400 animate-pulse" :
                          "bg-zinc-800/20 border border-zinc-800 text-gray-500"
                        )}
                      >
                        {day.date.getDate()}
                        
                        {/* Status indicator */}
                        <div 
                          className={cn(
                            "absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full",
                            day.status === 'completed' ? "bg-green-400" : 
                            day.status === 'today' ? "bg-amber-400" : 
                            day.status === 'missed' ? "bg-red-400" : "bg-transparent"
                          )}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="p-2 text-xs">
                      <div>
                        <div className="font-bold">{formatDate(day.date)}</div>
                        {day.status === 'completed' && (
                          <div className="text-green-400 flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            <span>Mission Completed</span>
                          </div>
                        )}
                        {day.status === 'missed' && (
                          <div className="text-red-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Mission Failed</span>
                          </div>
                        )}
                        {day.status === 'today' && (
                          <div className="text-amber-400 flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            <span>Today's Mission</span>
                          </div>
                        )}
                        {day.status === 'future' && (
                          <div className="text-gray-400 flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            <span>Future Mission</span>
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}
        
        {/* Next Milestone */}
        {nextMilestone && (
          <div className="bg-zinc-800/50 p-4 rounded border border-zinc-700/50">
            <div className="flex justify-between mb-2">
              <div className="text-sm font-medium flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                <span>Next Milestone: {nextMilestone.count} Days</span>
              </div>
              <div className="text-sm text-gray-400">
                {currentStreak}/{nextMilestone.count} days
              </div>
            </div>
            
            <Progress value={milestoneProgress} className="h-2 bg-zinc-700" />
            
            <div className="mt-3 flex items-start gap-3">
              <div className="bg-amber-500/20 p-2 rounded-md">
                <Gift className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Reward Unlock</div>
                <div className="text-xs text-gray-300">{nextMilestone.reward}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Previous Milestones */}
        {sortedMilestones.filter(m => m.reached).length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Achieved Milestones</div>
            <div className="flex flex-wrap gap-2">
              {sortedMilestones
                .filter(m => m.reached)
                .map((milestone, index) => (
                  <Badge 
                    key={`milestone-${index}`}
                    variant="outline" 
                    className="bg-green-900/20 text-green-400 border-green-500"
                  >
                    {milestone.count} Days
                  </Badge>
                ))
              }
            </div>
          </div>
        )}
        
        {onViewAllHistory && (
          <div className="text-right mt-2">
            <Button variant="outline" size="sm" onClick={onViewAllHistory}>
              View Complete History
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StreakTracker;