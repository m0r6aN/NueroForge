// components/gamification/GamificationNotification.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { X, Shield, Award, Zap, Clock, BadgeCheck, ArrowUp } from 'lucide-react'; // Add and use Brain icon
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { toast } from "sonner"
import { Button } from '@/components/ui/button';
import { cva } from 'class-variance-authority';
import { AchievementTier } from './AchievementBadge';

// Notification types
export type NotificationType = 'achievement' | 'level' | 'streak' | 'xp' | 'custom';

// Notification variants
export type NotificationVariant = 'standard' | 'urgent' | 'classified';

export interface NotificationProps {
  type: NotificationType;
  title: string;
  message: string;
  icon?: React.ReactNode;
  timestamp?: Date;
  duration?: number; // How long to display
  actionLabel?: string;
  onAction?: () => void;
  variant?: NotificationVariant;
  tier?: AchievementTier; // For achievement notifications
  level?: number; // For level-up notifications
  xpAmount?: number; // For XP gain notifications
  streakCount?: number; // For streak notifications
}

// Styled variants for notifications
const notificationVariants = cva(
  "fixed z-50 p-4 rounded-md border shadow-lg transition-all duration-300 flex items-start gap-3 max-w-md",
  {
    variants: {
      variant: {
        standard: "bg-zinc-900 border-zinc-700",
        urgent: "bg-amber-950 border-amber-700",
        classified: "bg-red-950 border-red-700"
      },
      position: {
        topRight: "top-4 right-4",
        bottomRight: "bottom-4 right-4", 
        bottomLeft: "bottom-4 left-4",
        topLeft: "top-4 left-4"
      },
      visible: {
        true: "opacity-100 transform translate-y-0",
        false: "opacity-0 transform translate-y-8 pointer-events-none"
      }
    },
    defaultVariants: {
      variant: "standard",
      position: "bottomRight",
      visible: false
    }
  }
);

// Custom styled components for notification types
const TypedNotificationContent = ({ type, title, message, tier, level, xpAmount, streakCount, icon }: Pick<NotificationProps, 'type' | 'title' | 'message' | 'tier' | 'level' | 'xpAmount' | 'streakCount' | 'icon'>) => {
  // Helper to render achievement badge colored by tier
  const getTierColor = (tier: AchievementTier = 'classified') => {
    switch (tier) {
      case 'top-secret': return 'bg-[#E5E4E2]/10 border-[#E5E4E2] text-[#E5E4E2]';
      case 'secret': return 'bg-[#FFD700]/10 border-[#FFD700] text-[#FFD700]';
      case 'confidential': return 'bg-[#C0C0C0]/10 border-[#C0C0C0] text-[#C0C0C0]';
      default: return 'bg-[#CD7F32]/10 border-[#CD7F32] text-[#CD7F32]';
    }
  };
  
  // Default icon based on type
  const defaultIcon = () => {
    switch (type) {
      case 'achievement': return <Award className="h-6 w-6" />;
      case 'level': return <ArrowUp className="h-6 w-6" />;
      case 'streak': return <Clock className="h-6 w-6" />;
      case 'xp': return <Zap className="h-6 w-6" />;
      default: return <Shield className="h-6 w-6" />;
    }
  };
  
  // Wrapper for notification icon
  const IconWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className={cn(
      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
      type === 'achievement' ? getTierColor(tier) : 
      type === 'level' ? "bg-blue-500/20 border border-blue-500 text-blue-500" :
      type === 'streak' ? "bg-amber-500/20 border border-amber-500 text-amber-500" :
      type === 'xp' ? "bg-cyan-500/20 border border-cyan-500 text-cyan-500" :
      "bg-gray-500/20 border border-gray-500 text-gray-300"
    )}>
      {children}
    </div>
  );
  
  return (
    <>
      <IconWrapper>
        {icon || defaultIcon()}
      </IconWrapper>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-sm mb-1">
            {title}
            {type === 'level' && level && (
              <span className="ml-1 font-mono">→ LEVEL {level}</span>
            )}
            {type === 'streak' && streakCount && (
              <span className="ml-1 font-mono">→ {streakCount} DAYS</span>
            )}
            {type === 'xp' && xpAmount && (
              <span className="ml-1 font-mono text-cyan-400">+{xpAmount} XP</span>
            )}
          </h3>
        </div>
        
        <p className="text-sm text-gray-300 break-words">
          {message}
        </p>
        
        {type === 'achievement' && tier && (
          <div className={cn(
            "text-xs px-2 py-0.5 rounded-sm inline-block mt-1 font-mono",
            getTierColor(tier)
          )}>
            {tier.toUpperCase()}
          </div>
        )}
      </div>
    </>
  );
};

// In-app notification component
export const GamificationNotification: React.FC<NotificationProps & { onClose: () => void; isVisible: boolean; position?: 'topRight' | 'bottomRight' | 'bottomLeft' | 'topLeft' }> = ({
  type,
  title,
  message,
  icon,
  //timestamp = new Date(),
  duration = 5000,
  actionLabel,
  onAction,
  variant = 'standard',
  tier,
  level,
  xpAmount,
  streakCount,
  onClose,
  isVisible,
  position = 'bottomRight'
}) => {
  useEffect(() => {
    // Auto-close after duration
    if (isVisible && duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);
  
  return createPortal(
    <div
      className={cn(
        notificationVariants({ variant, position, visible: isVisible })
      )}
    >
      <TypedNotificationContent 
        type={type}
        title={title}
        message={message}
        icon={icon}
        tier={tier}
        level={level}
        xpAmount={xpAmount}
        streakCount={streakCount}
      />
      
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
      
      {actionLabel && onAction && (
        <div className="mt-2 flex justify-end">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => {
              onAction();
              onClose();
            }}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>,
    document.body
  );
};

// Notification manager to handle queue of notifications
export const useGamificationNotifications = () => {
  const [notifications, setNotifications] = useState<(NotificationProps & { id: string; isVisible: boolean })[]>([]);
  
  // Show notification
  const showNotification = (notification: NotificationProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setNotifications(prev => [
      ...prev, 
      { ...notification, id, isVisible: true }
    ]);
    
    return id;
  };
  
  // Close notification
  const closeNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isVisible: false } : n)
    );
    
    // Remove from DOM after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 300);
  };
  
  // Helper functions for different notification types
  const showAchievementUnlocked = (achievementTitle: string, description: string, tier: AchievementTier = 'classified', onView?: () => void) => {
    return showNotification({
      type: 'achievement',
      title: 'INTEL DECLASSIFIED',
      message: `Achievement unlocked: ${achievementTitle}. ${description}`,
      variant: 'classified',
      tier,
      actionLabel: onView ? 'View Details' : undefined,
      onAction: onView,
      duration: 7000
    });
  };
  
  const showLevelUp = (newLevel: number, rewards?: string, onView?: () => void) => {
    return showNotification({
      type: 'level',
      title: 'SECURITY CLEARANCE UPGRADED',
      message: rewards ? `You've reached Level ${newLevel}! ${rewards}` : `You've reached Level ${newLevel}!`,
      level: newLevel,
      variant: 'standard',
      actionLabel: onView ? 'View Profile' : undefined,
      onAction: onView,
      duration: 8000
    });
  };
  
  const showXPGained = (amount: number, source: string) => {
    return showNotification({
      type: 'xp',
      title: 'NEURAL ENHANCEMENT',
      message: `Gained from: ${source}`,
      xpAmount: amount,
      variant: 'standard',
      duration: 3000
    });
  };
  
  const showStreakUpdated = (count: number, message: string, onView?: () => void) => {
    return showNotification({
      type: 'streak',
      title: 'CONSECUTIVE OPERATION SUCCESS',
      message,
      streakCount: count,
      variant: 'standard',
      actionLabel: onView ? 'View Streak' : undefined,
      onAction: onView,
      duration: 5000
    });
  };
  
  // Also expose a method to use regular toast notifications for less important events
  const showToast = (title: string, description: string) => {
    toast(title, {
      description: description,
    });
  };
    
  // Render notifications
  const NotificationsRenderer = () => (
    <>
      {notifications.map((notification, index) => (
        <GamificationNotification
          key={notification.id}
          {...notification}
          onClose={() => closeNotification(notification.id)}
          // Adjust position for stacked notifications
          position={index % 2 === 0 ? 'bottomRight' : 'bottomLeft'}
        />
      ))}
    </>
  );
  
  return {
    showNotification,
    closeNotification,
    showAchievementUnlocked,
    showLevelUp,
    showXPGained,
    showStreakUpdated,
    showToast,
    NotificationsRenderer
  };
};

// Level-up overlay for major level transitions
export const LevelUpOverlay: React.FC<{
  isVisible: boolean;
  onClose: () => void;
  oldLevel: number;
  newLevel: number;
  newRank: string;
  unlockedFeatures?: string[];
}> = ({
  isVisible,
  onClose,
  oldLevel,
  newLevel,
  newRank,
  unlockedFeatures = []
}) => {
  // Get rank icon and color
  const getRankColor = (level: number) => {
    if (level >= 76) return 'from-purple-600 to-purple-900 border-purple-400'; // Neural Commander
    if (level >= 51) return 'from-emerald-600 to-emerald-900 border-emerald-400'; // Director
    if (level >= 26) return 'from-cyan-600 to-cyan-900 border-cyan-400'; // Special Agent
    if (level >= 11) return 'from-blue-600 to-blue-900 border-blue-400'; // Agent
    return 'from-gray-600 to-gray-900 border-gray-400'; // Recruit
  };
  
  // Only render if visible
  if (!isVisible) return null;
  
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm">
      <div className="max-w-2xl w-full mx-auto p-8 text-center">
        <h2 className="text-3xl font-bold mb-2 font-mono text-white animate-pulse">SECURITY CLEARANCE UPGRADED</h2>
        <p className="text-gray-300 mb-10">Your neural capabilities have been recognized with increased access.</p>
        
        <div className="flex justify-center gap-16 items-center mb-10">
          <div className="text-center">
            <div className={cn(
              "w-24 h-24 rounded-full mx-auto flex items-center justify-center text-white border-2",
              "bg-gradient-to-b shadow-md mb-3 opacity-50 transform scale-90 transition-all duration-500",
              getRankColor(oldLevel)
            )}>
              <span className="text-3xl font-bold">{oldLevel}</span>
            </div>
            <p className="text-sm text-gray-400">Previous Level</p>
          </div>
          
          <div className="text-center">
            <div className={cn(
              "w-32 h-32 rounded-full mx-auto flex items-center justify-center text-white border-2",
              "bg-gradient-to-b shadow-lg mb-3 animate-level-pulse",
              getRankColor(newLevel)
            )}>
              <span className="text-4xl font-bold">{newLevel}</span>
            </div>
            <p className="text-xl font-bold text-cyan-400">{newRank}</p>
          </div>
        </div>
        
        {unlockedFeatures.length > 0 && (
          <div className="mb-10">
            <h3 className="text-xl font-bold mb-4 font-mono text-white">NEW ACCESS GRANTED</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
              {unlockedFeatures.map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-zinc-900 border border-zinc-700 p-3 rounded flex items-center gap-2"
                >
                  <BadgeCheck className="text-green-500 flex-shrink-0" />
                  <span className="text-left">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Button 
          size="lg" 
          onClick={onClose}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600"
        >
          Continue Mission
        </Button>
      </div>
    </div>,
    document.body
  );
};

// Example usage context provider
export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const notifications = useGamificationNotifications();
  const [levelUpState, setLevelUpState] = useState<{
    isVisible: boolean;
    oldLevel: number;
    newLevel: number;
    newRank: string;
    unlockedFeatures: string[];
  }>({
    isVisible: false,
    oldLevel: 0,
    newLevel: 0,
    newRank: '',
    unlockedFeatures: []
  });
  
  // Function to show major level-up overlay
  // const showLevelUpOverlay = (oldLevel: number, newLevel: number, newRank: string, unlockedFeatures: string[] = []) => {
  //   setLevelUpState({
  //     isVisible: true,
  //     oldLevel,
  //     newLevel,
  //     newRank,
  //     unlockedFeatures
  //   });
  // };
  
  // Function to close level-up overlay
  const closeLevelUpOverlay = () => {
    setLevelUpState(prev => ({ ...prev, isVisible: false }));
  };
  
  // Example of how to expose these methods using a context
  // You would create a proper context and provider in your actual implementation
  
  return (
    <>
      {children}
      <notifications.NotificationsRenderer />
      <LevelUpOverlay 
        isVisible={levelUpState.isVisible}
        onClose={closeLevelUpOverlay}
        oldLevel={levelUpState.oldLevel}
        newLevel={levelUpState.newLevel}
        newRank={levelUpState.newRank}
        unlockedFeatures={levelUpState.unlockedFeatures}
      />
    </>
  );
};

// Export a hook to use gamification notifications in any component
export const useGamification = () => {
  // In a real implementation, this would use React Context to access the provider
  const notifications = useGamificationNotifications();
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  
  const showLevelUpOverlay = (oldLevel: number, newLevel: number, newRank: string, unlockedFeatures: string[] = []) => {
    setLevelUpVisible(true);
    
    // This is a mock implementation - in real code, you'd call the context method
    return (
      <LevelUpOverlay
        isVisible={levelUpVisible}
        onClose={() => setLevelUpVisible(false)}
        oldLevel={oldLevel}
        newLevel={newLevel}
        newRank={newRank}
        unlockedFeatures={unlockedFeatures}
      />
    );
  };
  
  return {
    ...notifications,
    showLevelUpOverlay
  };
};

export default GamificationNotification;