// components/gamification/AchievementBadge.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Award, 
  Eye, 
  AlertCircle, 
  CheckCircle2,
  Star
} from 'lucide-react';
import { 
  Card, 
  CardContent
} from 'components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'components/ui/tooltip';

export type AchievementTier = 'classified' | 'confidential' | 'secret' | 'top-secret';
export type AchievementSize = 'sm' | 'md' | 'lg';
export type AchievementAnimation = 'pulse' | 'glow' | 'reveal' | 'none';

export interface AchievementBadgeProps {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  tier: AchievementTier;
  isUnlocked: boolean;
  progress?: number;
  dateUnlocked?: Date;
  animation?: AchievementAnimation;
  size?: AchievementSize;
  onClick?: () => void;
  className?: string;
}

export const AchievementBadge = ({
  //id,
  title,
  description,
  icon,
  tier = 'classified',
  isUnlocked = false,
  progress = 0,
  dateUnlocked,
  animation = 'none',
  size = 'md',
  onClick,
  className
}: AchievementBadgeProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [wasUnlocked, setWasUnlocked] = useState(isUnlocked);
  
  // Handle unlock animation
  useEffect(() => {
    if (!wasUnlocked && isUnlocked) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    setWasUnlocked(isUnlocked);
  }, [isUnlocked, wasUnlocked]);

  // Define size classes
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-28 h-28',
    lg: 'w-36 h-36'
  };

  // Define tier styles
  const tierStyles = {
    'classified': {
      border: 'border-[#CD7F32]',
      bg: 'bg-gradient-to-b from-[#CD7F32]/20 to-[#8B4513]/30',
      text: 'text-[#CD7F32]',
      shadow: 'shadow-[0_0_10px_rgba(205,127,50,0.3)]',
      glow: 'shadow-[0_0_15px_rgba(205,127,50,0.5)]'
    },
    'confidential': {
      border: 'border-[#C0C0C0]',
      bg: 'bg-gradient-to-b from-[#C0C0C0]/20 to-[#A9A9A9]/30',
      text: 'text-[#C0C0C0]',
      shadow: 'shadow-[0_0_10px_rgba(192,192,192,0.3)]',
      glow: 'shadow-[0_0_15px_rgba(192,192,192,0.5)]'
    },
    'secret': {
      border: 'border-[#FFD700]',
      bg: 'bg-gradient-to-b from-[#FFD700]/20 to-[#B8860B]/30',
      text: 'text-[#FFD700]',
      shadow: 'shadow-[0_0_10px_rgba(255,215,0,0.3)]',
      glow: 'shadow-[0_0_15px_rgba(255,215,0,0.5)]'
    },
    'top-secret': {
      border: 'border-[#E5E4E2]',
      bg: 'bg-gradient-to-b from-[#E5E4E2]/20 to-[#B8B8B8]/20',
      text: 'text-[#E5E4E2]',
      shadow: 'shadow-[0_0_10px_rgba(229,228,226,0.3)]', 
      glow: 'shadow-[0_0_15px_rgba(229,228,226,0.7)]'
    }
  };

  // Animation classes
  const animationClasses = {
    pulse: 'animate-pulse',
    glow: 'animate-glow',
    reveal: 'animate-reveal',
    none: ''
  };

  // Custom animation for reveal
  const revealAnimation = isAnimating && animation === 'reveal' ? 'animate-reveal' : '';

  // Icon based on tier if none provided
  const defaultIcon = () => {
    switch(tier) {
      case 'top-secret':
        return <Award className="w-1/2 h-1/2" />;
      case 'secret':
        return <Shield className="w-1/2 h-1/2" />;
      case 'confidential':
        return <Eye className="w-1/2 h-1/2" />;
      default:
        return <Star className="w-1/2 h-1/2" />;
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Card 
            className={cn(
              'relative flex flex-col items-center justify-center p-2 transition-all duration-300 hover:scale-105 cursor-pointer border-2',
              sizeClasses[size],
              tierStyles[tier].border,
              tierStyles[tier].bg,
              isUnlocked ? tierStyles[tier].shadow : 'opacity-80',
              isAnimating && animation !== 'none' ? animationClasses[animation] : '',
              isAnimating && animation === 'glow' ? tierStyles[tier].glow : '',
              className
            )}
            onClick={onClick}
          >
            {/* Progress circle for in-progress achievements */}
            {!isUnlocked && progress > 0 && progress < 100 && (
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r={size === 'sm' ? 38 : size === 'md' ? 52 : 68}
                  strokeWidth="3"
                  fill="none"
                  stroke="#2A3A4A"
                  className="opacity-30"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r={size === 'sm' ? 38 : size === 'md' ? 52 : 68}
                  strokeWidth="3"
                  fill="none"
                  stroke={tier === 'classified' ? '#CD7F32' : 
                         tier === 'confidential' ? '#C0C0C0' : 
                         tier === 'secret' ? '#FFD700' : '#E5E4E2'}
                  strokeDasharray={size === 'sm' ? 240 : size === 'md' ? 330 : 430}
                  strokeDashoffset={size === 'sm' ? 240 - (240 * progress / 100) : 
                                 size === 'md' ? 330 - (330 * progress / 100) : 
                                 430 - (430 * progress / 100)}
                  className="transition-all duration-500"
                />
              </svg>
            )}

            {/* Locked overlay */}
            {!isUnlocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[1px] z-10">
                <Lock className="text-white/80 w-1/3 h-1/3" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute top-1/2 left-0 right-0 text-center transform -translate-y-1/2">
                    <div className="bg-red-800/80 text-white text-xs px-1 py-0.5 font-mono rotate-[-10deg] tracking-wider">
                      CLASSIFIED
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Newly unlocked animation overlay */}
            {isAnimating && animation === 'reveal' && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/40 backdrop-blur-[2px] animate-fadeOut">
                <div className="bg-red-700 text-white text-xs px-2 py-1 font-mono rotate-[-20deg] tracking-wider animate-stampIn">
                  DECLASSIFIED
                </div>
              </div>
            )}

            {/* Badge content */}
            <CardContent className="flex flex-col items-center justify-center p-0 h-full">
              <div className={cn("flex justify-center items-center", 
                 isUnlocked ? tierStyles[tier].text : "text-gray-500",
                 size === 'sm' ? 'mb-1' : 'mb-2',
                 revealAnimation
              )}>
                {icon || defaultIcon()}
              </div>
              
              <div className={cn("text-center",
                isUnlocked ? "text-white" : "text-gray-400",
                size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base',
                revealAnimation
              )}>
                <h3 className="font-bold truncate w-full">
                  {size === 'sm' ? (title.length > 10 ? `${title.substring(0, 8)}...` : title) : 
                  size === 'md' ? (title.length > 15 ? `${title.substring(0, 12)}...` : title) : title}
                </h3>
              </div>
              
              {/* Tier badge for medium and large sizes */}
              {size !== 'sm' && (
                <Badge 
                  className={cn("absolute bottom-1 text-[0.65rem] py-0", 
                    tierStyles[tier].bg, 
                    isUnlocked ? tierStyles[tier].text : "text-gray-400 opacity-70"
                  )}
                >
                  {tier.toUpperCase()}
                </Badge>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm">{title}</h4>
              <Badge className={cn(
                "ml-1 text-[0.65rem]", 
                tierStyles[tier].bg, 
                tierStyles[tier].text
              )}>
                {tier.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-gray-200">{description}</p>
            <div className="pt-1 flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-1">
                {isUnlocked ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>Unlocked {dateUnlocked ? formatDate(dateUnlocked) : ''}</span>
                  </>
                ) : progress > 0 ? (
                  <>
                    <AlertCircle className="h-3 w-3 text-amber-500" />
                    <span>{progress}% Complete</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" />
                    <span>Locked</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AchievementBadge;