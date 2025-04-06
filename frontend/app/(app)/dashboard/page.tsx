// app/(app)/dashboard/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import LevelDisplay from "components/gamification/LevelDisplay";
import GamificationOverview from "components/gamification/GamificationOverview";
import AIQuiz from "components/ai/AIQuiz";
import { Leaderboard } from "components/gamification/Leaderboard";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Operative Dashboard</h1>
      
      {/* Navbar integration of LevelDisplay */}
      <div className="flex justify-end">
        <LevelDisplay 
          variant="navbar" 
          onViewAllProgress={() => router.push('/profile')}
          // Replace the static data below with data fetched from /api/v1/gamification/status via SWR in production.
          currentLevel={10} 
          currentXP={500} 
          nextLevelXP={1000} 
          rank="Agent" 
          totalXP={500} 
          recentXPGains={[]} 
        />
      </div>
      
      {/* Gamification Overview */}
      <GamificationOverview />
      
      {/* AI Quiz UI */}
      <AIQuiz />
      
      {/* Leaderboard */}
      <Leaderboard />
      
      {/* Additional UI cards can be added here */}
    </div>
  );
}
