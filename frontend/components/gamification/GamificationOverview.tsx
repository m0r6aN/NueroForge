// components/gamification/GamificationOverview.tsx
"use client";

import React from "react";
import useSWR from "swr";
import LevelDisplay from "./LevelDisplay";
import StreakTracker from "components/gamification/StreakTracker";
import { Card, CardHeader, CardTitle, CardContent } from "components/ui/card";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const GamificationOverview: React.FC = () => {
  const { data, error } = useSWR("/api/v1/gamification/status", fetcher);

  if (error) return <div>Error loading gamification status</div>;
  if (!data) return <div>Loading...</div>;

  const {
    dailyStreak,
    lastDailyCompletion,
    xp,
    level,
    xpCurrentLevelBase,
    xpNextLevelTarget,
    xpInLevelProgress,
  } = data.data;

  // Prepare streak props – adjust as the API expands.
  const streakProps = {
    currentStreak: dailyStreak,
    longestStreak: dailyStreak, // Update when longest streak is available.
    lastActiveDate: lastDailyCompletion
      ? new Date(lastDailyCompletion)
      : new Date(),
    streakHistory: [], // Populate with detailed history when available.
    showCalendar: false,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gamification Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LevelDisplay
          currentLevel={level}
          currentXP={xp}
          nextLevelXP={xpNextLevelTarget}
          rank={"Clearance " + level}
          totalXP={xpCurrentLevelBase + xpInLevelProgress}
          recentXPGains={[]} // Optionally pass recent XP gains if available.
          variant="dashboard"
        />
        <StreakTracker {...streakProps} />
      </CardContent>
    </Card>
  );
};

export default GamificationOverview;
