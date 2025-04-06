// components/gamification/LevelDisplay.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Brain,
  Zap,
  Award,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast"; // Import toast for notifications

export interface XPGain {
  amount: number;
  source: string;
  timestamp: Date;
}

export interface LevelDisplayProps {
  currentLevel: number;
  currentXP: number;
  nextLevelXP: number;
  rank: string;
  totalXP?: number;
  recentXPGains?: XPGain[];
  showDetail?: boolean;
  className?: string;
  variant?: "navbar" | "profile" | "dashboard";
  isLoading?: boolean;
  onViewAllProgress?: () => void;
}

// Helper: Get rank icon based on level.
const getRankIcon = (level: number) => {
  if (level >= 76) return <Award className="h-full w-full" />;
  if (level >= 51) return <Brain className="h-full w-full" />;
  if (level >= 26) return <Zap className="h-full w-full" />;
  if (level >= 11) return <Badge className="h-3/4 w-3/4" />;
  return <Sparkles className="h-full w-full" />;
};

// Helper: Get rank color string.
const getRankColor = (level: number) => {
  if (level >= 76) return "from-purple-600 to-purple-900 border-purple-400";
  if (level >= 51) return "from-emerald-600 to-emerald-900 border-emerald-400";
  if (level >= 26) return "from-cyan-600 to-cyan-900 border-cyan-400";
  if (level >= 11) return "from-blue-600 to-blue-900 border-blue-400";
  return "from-gray-600 to-gray-900 border-gray-400";
};

// Helper: Format XP numbers.
const formatXP = (xp: number): string => {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toString();
};

export const LevelDisplay = ({
  currentLevel,
  currentXP,
  nextLevelXP,
  rank,
  totalXP = 0,
  recentXPGains = [],
  showDetail = false,
  className,
  variant = "navbar",
  isLoading = false,
  onViewAllProgress,
}: LevelDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(showDetail);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [displayedXP, setDisplayedXP] = useState(currentXP);
  const prevLevelRef = useRef(currentLevel);

  // Calculate XP progress percentage.
  const xpProgress = Math.min(Math.round((currentXP / nextLevelXP) * 100), 100);

  // Detect XP changes and level-ups.
  useEffect(() => {
    if (currentXP !== displayedXP) {
      setDisplayedXP(currentXP);
    }
    if (prevLevelRef.current !== currentLevel && prevLevelRef.current !== 0) {
      setIsLevelingUp(true);
      toast({
        title: "Level Up!",
        description: `Congratulations! You've reached level ${currentLevel}.`,
        variant: "success",
      });
      setTimeout(() => setIsLevelingUp(false), 1500);
    }
    prevLevelRef.current = currentLevel;
  }, [currentXP, currentLevel, displayedXP]);

  // Minimal Navbar view with Popover details.
  if (variant === "navbar") {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "h-9 px-2 flex items-center gap-2 group",
              isLevelingUp && "animate-level-pulse",
              className
            )}
          >
            {/* Level Badge */}
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-white border",
                "bg-gradient-to-b shadow transition-all",
                getRankColor(currentLevel),
                "group-hover:shadow-md group-hover:scale-110"
              )}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {getRankIcon(currentLevel)}
              </div>
              <span className="text-xs font-bold relative z-10">
                {currentLevel}
              </span>
            </div>

            {/* Compact XP Progress Bar */}
            <div className="h-1.5 w-14 bg-gray-800 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 animate-security-scan"
                style={{ width: `${xpProgress}%` }}
              ></div>
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0 border-zinc-700/60" align="end">
          <div className="bg-zinc-900 p-4 rounded-t-md border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-white border-2",
                  "bg-gradient-to-b shadow-md",
                  getRankColor(currentLevel)
                )}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {getRankIcon(currentLevel)}
                </div>
                <span className="text-lg font-bold relative z-10">
                  {currentLevel}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-bold">{rank}</h4>
                  <span className="text-xs text-gray-400">
                    Level {currentLevel}
                  </span>
                </div>
                <div className="text-xs text-gray-300 mb-1">
                  Neural Enhancement Progress
                </div>
                <div className="relative h-2.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 animate-security-scan"
                    style={{ width: `${xpProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>{formatXP(currentXP)} XP</span>
                  <span>{formatXP(nextLevelXP)} XP</span>
                </div>
              </div>
            </div>
          </div>

          {recentXPGains.length > 0 && (
            <div className="p-3 max-h-48 overflow-y-auto">
              <h5 className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                Recent Neural Enhancements
              </h5>
              <ul className="space-y-1.5">
                {recentXPGains.map((gain, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-300">{gain.source}</span>
                    <span className="text-cyan-400 font-mono">
                      +{gain.amount} XP
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-3 bg-zinc-900 rounded-b-md border-t border-zinc-800 text-right">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewAllProgress}
              className="text-xs"
            >
              View Full Neural Profile
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Expanded view for Dashboard or Profile.
  return (
    <div
      className={cn(
        "bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden",
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-4">
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center text-white border-2",
                "bg-gradient-to-b shadow-md",
                getRankColor(currentLevel)
              )}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {getRankIcon(currentLevel)}
              </div>
              <span className="text-2xl font-bold relative z-10">
                {currentLevel}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="text-lg font-bold flex items-center gap-2">
                {rank}
                <Badge
                  variant="outline"
                  className={cn(
                    "ml-2 border",
                    getRankColor(currentLevel).split(" ")[0]
                  )}
                >
                  Level {currentLevel}
                </Badge>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Neural Enhancement Progress
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span>{formatXP(currentXP)} XP</span>
                <span className="text-gray-400">
                  {formatXP(nextLevelXP)} XP needed for next level
                </span>
              </div>
              <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 animate-security-scan"
                  style={{ width: `${xpProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <div className="mb-4">
            <h4 className="text-sm font-bold mb-2">
              Neural Enhancement Status
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
                <div className="text-xs text-gray-400">Total Experience</div>
                <div className="text-xl font-mono mt-1 text-white">
                  {formatXP(totalXP)} XP
                </div>
              </div>
              <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
                <div className="text-xs text-gray-400">Next Level In</div>
                <div className="text-xl font-mono mt-1 text-white">
                  {formatXP(nextLevelXP - currentXP)} XP
                </div>
              </div>
            </div>
          </div>
          {recentXPGains.length > 0 && (
            <div>
              <h4 className="text-sm font-bold mb-2">Recent Activity</h4>
              <div className="bg-zinc-900 rounded border border-zinc-800 divide-y divide-zinc-800">
                {recentXPGains.slice(0, 5).map((gain, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2.5"
                  >
                    <div>
                      <div className="text-sm">{gain.source}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(gain.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="text-cyan-400 font-mono font-bold">
                      +{gain.amount} XP
                    </div>
                  </div>
                ))}
              </div>
              {recentXPGains.length > 5 && (
                <div className="mt-3 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onViewAllProgress}
                  >
                    View All Activity
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LevelDisplay;
