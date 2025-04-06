// app/(app)/achievements/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  SortDesc,
  Shield,
  Zap,
  Timer,
  Award,
  Brain,
  Lock,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

import AchievementBadge, {
  AchievementTier,
} from "@/components/gamification/AchievementBadge";
import LevelDisplay from "@/components/gamification/LevelDisplay";
import { fetchAchievements, fetchGamificationStatus } from "@/lib/api";

interface Achievement {
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

interface AchievementStats {
  totalCount: number;
  unlockedCount: number;
  byTier: {
    classified: { total: number; unlocked: number };
    confidential: { total: number; unlocked: number };
    secret: { total: number; unlocked: number };
    "top-secret": { total: number; unlocked: number };
  };
  byCategory: Record<string, { total: number; unlocked: number }>;
}

interface GamificationStatus {
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

// Define achievement categories with icons.
const CATEGORIES = [
  { id: "all", name: "All Achievements", icon: <Award /> },
  { id: "learning", name: "Learning Mastery", icon: <Brain /> },
  { id: "neural", name: "Neural Enhancement", icon: <Zap /> },
  { id: "streak", name: "Streak Operations", icon: <Timer /> },
  { id: "discovery", name: "Discovery Missions", icon: <Shield /> },
];

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filteredAchievements, setFilteredAchievements] = useState<
    Achievement[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("default");
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [status, setStatus] = useState<GamificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);

  const router = useRouter();

  // Fetch achievements and gamification status on component mount.
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const achievementsData = await fetchAchievements();
        setAchievements(achievementsData);

        const stats: AchievementStats = {
          totalCount: achievementsData.length,
          unlockedCount: achievementsData.filter((a) => a.isUnlocked).length,
          byTier: {
            classified: {
              total: achievementsData.filter((a) => a.tier === "classified")
                .length,
              unlocked: achievementsData.filter(
                (a) => a.tier === "classified" && a.isUnlocked
              ).length,
            },
            confidential: {
              total: achievementsData.filter((a) => a.tier === "confidential")
                .length,
              unlocked: achievementsData.filter(
                (a) => a.tier === "confidential" && a.isUnlocked
              ).length,
            },
            secret: {
              total: achievementsData.filter((a) => a.tier === "secret").length,
              unlocked: achievementsData.filter(
                (a) => a.tier === "secret" && a.isUnlocked
              ).length,
            },
            "top-secret": {
              total: achievementsData.filter((a) => a.tier === "top-secret")
                .length,
              unlocked: achievementsData.filter(
                (a) => a.tier === "top-secret" && a.isUnlocked
              ).length,
            },
          },
          byCategory: {},
        };

        const categories = [
          ...new Set(achievementsData.map((a) => a.category)),
        ];
        categories.forEach((category) => {
          stats.byCategory[category] = {
            total: achievementsData.filter((a) => a.category === category)
              .length,
            unlocked: achievementsData.filter(
              (a) => a.category === category && a.isUnlocked
            ).length,
          };
        });
        setStats(stats);

        const statusData = await fetchGamificationStatus();
        setStatus(statusData);
      } catch (error) {
        console.error("Error loading achievements:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Apply filters and sorting.
  useEffect(() => {
    if (!achievements.length) return;

    let filtered = [...achievements];

    if (selectedCategory !== "all") {
      filtered = filtered.filter((a) => a.category === selectedCategory);
    }

    if (statusFilter === "unlocked") {
      filtered = filtered.filter((a) => a.isUnlocked);
    } else if (statusFilter === "locked") {
      filtered = filtered.filter((a) => !a.isUnlocked);
    } else if (statusFilter === "in-progress") {
      filtered = filtered.filter(
        (a) => !a.isUnlocked && a.progress && a.progress > 0
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query)
      );
    }

    if (sortOption === "recent") {
      filtered.sort((a, b) => {
        if (a.isUnlocked && b.isUnlocked && a.dateUnlocked && b.dateUnlocked) {
          return b.dateUnlocked.getTime() - a.dateUnlocked.getTime();
        }
        return a.isUnlocked ? -1 : 1;
      });
    } else if (sortOption === "rarity") {
      const tierOrder = {
        "top-secret": 3,
        secret: 2,
        confidential: 1,
        classified: 0,
      };
      filtered.sort((a, b) => tierOrder[b.tier] - tierOrder[a.tier]);
    } else if (sortOption === "progress") {
      filtered.sort((a, b) => {
        if (a.isUnlocked && !b.isUnlocked) return -1;
        if (!a.isUnlocked && b.isUnlocked) return 1;
        if (!a.isUnlocked && !b.isUnlocked) {
          return (b.progress || 0) - (a.progress || 0);
        }
        return 0;
      });
    } else if (sortOption === "alphabetical") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredAchievements(filtered);
  }, [achievements, selectedCategory, statusFilter, searchQuery, sortOption]);

  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
  };

  const getIconForAchievement = (achievement: Achievement) => {
    if (!achievement.icon) return null;
    switch (achievement.icon) {
      case "zap":
        return <Zap />;
      case "brain":
        return <Brain />;
      case "shield":
        return <Shield />;
      case "timer":
        return <Timer />;
      case "award":
        return <Award />;
      default:
        return null;
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      {/* Header with Title and Gamification Status */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            Neural Achievement Records
          </h1>
          <p className="text-gray-400">
            Track your progress through classified NeuroForge training
            objectives
          </p>
        </div>
        {status && (
          <div className="w-full md:w-auto">
            <LevelDisplay
              currentLevel={status.level}
              currentXP={status.currentXP}
              nextLevelXP={status.nextLevelXP}
              rank={status.rank}
              totalXP={status.totalXP}
              recentXPGains={status.recentXPGains}
              variant="navbar"
              onViewAllProgress={() => router.push("/profile")}
            />
          </div>
        )}
      </div>

      {/* Stats Summary Card */}
      {stats && (
        <Card className="mb-6 bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Achievement Intel Summary</CardTitle>
            <CardDescription>
              Your declassified achievement progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-800/50 p-4 rounded-md border border-zinc-700/50">
                <div className="text-sm text-gray-400">Total Achievements</div>
                <div className="text-2xl font-bold mt-1">
                  {stats.totalCount}
                </div>
              </div>
              <div className="bg-zinc-800/50 p-4 rounded-md border border-zinc-700/50">
                <div className="text-sm text-gray-400">Declassified</div>
                <div className="text-2xl font-bold mt-1 text-cyan-400">
                  {stats.unlockedCount}
                  <span className="text-sm text-gray-400 ml-1">
                    (
                    {Math.round((stats.unlockedCount / stats.totalCount) * 100)}
                    %)
                  </span>
                </div>
              </div>
              <div className="bg-zinc-800/50 p-4 rounded-md border border-zinc-700/50 col-span-2">
                <div className="text-sm text-gray-400 mb-2">
                  By Clearance Level
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="border-[#CD7F32] text-[#CD7F32] text-xs"
                  >
                    Classified: {stats.byTier.classified.unlocked}/
                    {stats.byTier.classified.total}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-[#C0C0C0] text-[#C0C0C0] text-xs"
                  >
                    Confidential: {stats.byTier.confidential.unlocked}/
                    {stats.byTier.confidential.total}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-[#FFD700] text-[#FFD700] text-xs"
                  >
                    Secret: {stats.byTier.secret.unlocked}/
                    {stats.byTier.secret.total}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-[#E5E4E2] text-[#E5E4E2] text-xs"
                  >
                    Top Secret: {stats.byTier["top-secret"].unlocked}/
                    {stats.byTier["top-secret"].total}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters & Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-900 border-zinc-700"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-zinc-900 border-zinc-700">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="unlocked">Unlocked</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-40 bg-zinc-900 border-zinc-700">
                <SortDesc className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="rarity">By Rarity</SelectItem>
                <SelectItem value="progress">By Progress</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Achievements Tabbed Content */}
      <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
        <TabsList className="w-full mb-6 bg-zinc-900 border border-zinc-800 p-1">
          {CATEGORIES.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="flex items-center gap-2 data-[state=active]:bg-zinc-800"
            >
              {category.icon}
              <span className="hidden sm:inline">{category.name}</span>
              {stats &&
                category.id !== "all" &&
                stats.byCategory[category.id] && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {stats.byCategory[category.id].unlocked}/
                    {stats.byCategory[category.id].total}
                  </Badge>
                )}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                <span className="ml-3 text-gray-400">
                  Accessing achievement database...
                </span>
              </div>
            ) : filteredAchievements.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-md p-12 text-center">
                <Lock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-2">
                  No achievements found
                </h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  {searchQuery
                    ? "No achievements match your search criteria. Try adjusting your filters."
                    : "No achievements in this category yet. Continue your neural training to unlock more achievements."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredAchievements.map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    id={achievement.id}
                    title={achievement.title}
                    description={achievement.description}
                    tier={achievement.tier}
                    isUnlocked={achievement.isUnlocked}
                    progress={achievement.progress}
                    dateUnlocked={achievement.dateUnlocked}
                    icon={getIconForAchievement(achievement)}
                    size="md"
                    animation={achievement.isUnlocked ? "glow" : "none"}
                    onClick={() => handleAchievementClick(achievement)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAchievement(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start">
              <div className="mr-4">
                <AchievementBadge
                  id={selectedAchievement.id}
                  title={selectedAchievement.title}
                  description={selectedAchievement.description}
                  tier={selectedAchievement.tier}
                  isUnlocked={selectedAchievement.isUnlocked}
                  progress={selectedAchievement.progress}
                  dateUnlocked={selectedAchievement.dateUnlocked}
                  icon={getIconForAchievement(selectedAchievement)}
                  size="lg"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">
                  {selectedAchievement.title}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    variant="outline"
                    className={
                      selectedAchievement.tier === "classified"
                        ? "border-[#CD7F32] text-[#CD7F32]"
                        : selectedAchievement.tier === "confidential"
                        ? "border-[#C0C0C0] text-[#C0C0C0]"
                        : selectedAchievement.tier === "secret"
                        ? "border-[#FFD700] text-[#FFD700]"
                        : "border-[#E5E4E2] text-[#E5E4E2]"
                    }
                  >
                    {selectedAchievement.tier.toUpperCase()}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-blue-500 text-blue-500"
                  >
                    {selectedAchievement.category}
                  </Badge>
                  {selectedAchievement.xpReward && (
                    <Badge
                      variant="outline"
                      className="border-cyan-500 text-cyan-500"
                    >
                      +{selectedAchievement.xpReward} XP
                    </Badge>
                  )}
                </div>
                <p className="text-gray-300 mb-4">
                  {selectedAchievement.description}
                </p>
                {selectedAchievement.criteria && (
                  <div className="mb-4">
                    <h4 className="text-sm font-bold mb-1 text-gray-400">
                      Declassification Criteria:
                    </h4>
                    <p className="text-sm text-gray-300 bg-black/20 p-2 rounded border border-zinc-800">
                      {selectedAchievement.isUnlocked
                        ? selectedAchievement.criteria
                        : selectedAchievement.criteria.replace(
                            /[a-zA-Z]/g,
                            "█"
                          )}
                    </p>
                  </div>
                )}
                <div className="mt-4">
                  {selectedAchievement.isUnlocked ? (
                    <div className="flex items-center text-green-500 bg-green-500/10 px-3 py-2 rounded-md">
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      <div>
                        <div className="font-medium">Achievement Unlocked</div>
                        {selectedAchievement.dateUnlocked && (
                          <div className="text-xs text-green-300">
                            {new Date(
                              selectedAchievement.dateUnlocked
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : selectedAchievement.progress &&
                    selectedAchievement.progress > 0 ? (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-amber-500">In Progress</span>
                        <span className="text-gray-400">
                          {selectedAchievement.progress}% Complete
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${selectedAchievement.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-400 bg-zinc-800/50 px-3 py-2 rounded-md">
                      <Lock className="h-5 w-5 mr-2" />
                      <div className="font-medium">Achievement Locked</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 text-right">
              <Button
                variant="outline"
                onClick={() => setSelectedAchievement(null)}
              >
                Close Intel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
