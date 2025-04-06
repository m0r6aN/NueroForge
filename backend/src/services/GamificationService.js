// neuroforge/backend/src/services/GamificationService.js
const User = require('../models/mongo/User');
const Achievement = require('../models/mongo/Achievement');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// --- Configuration ---
// Example: XP required for each level (adjust curve as needed)
// Level 1 -> 2 needs 100 XP, Level 2 -> 3 needs 250 XP, etc.
const XP_PER_LEVEL = [0, 100, 250, 500, 1000, 2000, 4000, 7500, 12000, 20000]; // XP *to reach* this level from previous

function getXPForLevel(level) {
    if (level < 1) return 0;
    if (level - 1 < XP_PER_LEVEL.length) {
        return XP_PER_LEVEL[level - 1];
    }
    // Simple formula for higher levels (e.g., geometric progression)
    return XP_PER_LEVEL[XP_PER_LEVEL.length - 1] * Math.pow(1.5, level - XP_PER_LEVEL.length);
}

function getTotalXPForLevel(level) {
     let totalXp = 0;
     for (let i = 1; i <= level; i++) {
         totalXp += getXPForLevel(i);
     }
     return totalXp;
}

class GamificationService {

    /**
     * Awards XP to a user and checks for level ups.
     * @param {string} userId
     * @param {number} xpAmount - Amount of XP to award.
     * @returns {Promise<{leveledUp: boolean, newLevel: number, newXp: number}>}
     */
    async awardXp(userId, xpAmount) {
        if (xpAmount <= 0) return { leveledUp: false, newLevel: 0, newXp: 0 };

        const user = await User.findById(userId).select('xp level achievements stats');
        if (!user) {
            logger.error(`[Gamification] User not found for XP award: ${userId}`);
            return { leveledUp: false, newLevel: 0, newXp: 0 };
        }

        let currentXp = user.xp;
        let currentLevel = user.level;
        const initialLevel = currentLevel;

        currentXp += xpAmount;

        // Check for level ups
        let xpForNextLevel = getTotalXPForLevel(currentLevel + 1);
        while (currentXp >= xpForNextLevel && xpForNextLevel > 0) { // Check xpForNextLevel > 0 to prevent infinite loop if config is bad
            currentLevel++;
            logger.info(`[Gamification] User ${userId} leveled up to Level ${currentLevel}!`);
            // Award potential level-up achievement here if defined
            await this.checkAndAwardAchievement(userId, 'XP_THRESHOLD', { xp: currentXp, level: currentLevel }, user); // Pass user to avoid re-fetch
             xpForNextLevel = getTotalXPForLevel(currentLevel + 1);
             if (xpForNextLevel <= getTotalXPForLevel(currentLevel)) {
                 logger.warn(`[Gamification] Possible level config issue near level ${currentLevel}. Stopping level up.`);
                 break; // Prevent potential infinite loop if XP thresholds aren't increasing
             }
        }

        user.xp = currentXp;
        user.level = currentLevel;
        // user.stats might be updated elsewhere based on the event causing XP gain
        await user.save();

        const leveledUp = currentLevel > initialLevel;
        if (leveledUp) {
            // TODO: Emit event for real-time notification? (e.g., via WebSocket)
        }

        return { leveledUp, newLevel: currentLevel, newXp: currentXp };
    }

    /**
     * Checks if a user has met the criteria for any achievements based on a trigger.
     * @param {string} userId
     * @param {string} triggerType - The type of event (e.g., 'LESSON_COMPLETE_COUNT')
     * @param {object} eventData - Data relevant to the event (e.g., { count: 10 })
     * @param {object} [user] - Optional: Pre-fetched user object to avoid redundant DB call.
     * @returns {Promise<Array<object>>} List of newly awarded achievements.
     */
    async checkAndAwardAchievement(userId, triggerType, eventData, user = null) {
        if (!user) {
            // Fetch user with necessary stats and current achievements
            user = await User.findById(userId).select('achievements stats level xp streaks');
        }
        if (!user) return [];

        const userAchievementIds = new Set(user.achievements.map(id => id.toString()));
        const potentialAchievements = await Achievement.find({ triggerType: triggerType });
        const newlyAwarded = [];

        for (const achievement of potentialAchievements) {
            const achievementId = achievement._id.toString();
            if (userAchievementIds.has(achievementId)) {
                continue; // Already awarded
            }

            let criteriaMet = false;
            const condition = achievement.triggerConditionValue;

            // Check criteria based on trigger type
            switch (triggerType) {
                case 'LESSON_COMPLETE_COUNT':
                case 'SUBJECT_COMPLETE_COUNT':
                case 'REVIEW_SESSION_COUNT':
                case 'AI_INTERACTION_COUNT':
                    // Assumes stats are updated *before* this check is called
                    const statKey = triggerType.split('_')[0].toLowerCase() + triggerType.split('_')[1].charAt(0).toUpperCase() + triggerType.split('_')[1].slice(1).toLowerCase() + 's'; // e.g., lessonsCompleted
                     if (user.stats?.[statKey] !== undefined && user.stats[statKey] >= condition) {
                         criteriaMet = true;
                     }
                    break;
                case 'STREAK_DAILY':
                     if (user.streaks?.daily?.count !== undefined && user.streaks.daily.count >= condition) {
                         criteriaMet = true;
                     }
                    break;
                case 'STREAK_WEEKLY':
                     if (user.streaks?.weekly?.count !== undefined && user.streaks.weekly.count >= condition) {
                         criteriaMet = true;
                     }
                    break;
                case 'XP_THRESHOLD':
                    // Use eventData passed in (current XP/Level after award)
                     if (eventData.xp !== undefined && eventData.xp >= condition) {
                         criteriaMet = true;
                     }
                     // Could also check level: if (eventData.level !== undefined && eventData.level >= condition) ...
                    break;
                 case 'AUDIO_PRESET_DURATION':
                     // Requires tracking usage time per preset (complex, maybe store elsewhere)
                     // Example: if (user.stats.audioPresetUsage[condition.preset] >= condition.minutes) criteriaMet = true;
                     logger.warn(`[Gamification] Trigger type ${triggerType} check not fully implemented.`);
                     break;
                // Add other trigger type checks
                default:
                    logger.warn(`[Gamification] Unknown trigger type for achievement check: ${triggerType}`);
            }

            if (criteriaMet) {
                logger.info(`[Gamification] Awarding achievement "${achievement.name}" to user ${userId}`);
                user.achievements.push(achievement._id);
                newlyAwarded.push(achievement); // Return the full achievement object
                // Award bonus XP if any
                if (achievement.xpReward > 0) {
                    await this.awardXp(userId, achievement.xpReward); // Call awardXp again for bonus
                }
                 // TODO: Emit achievement unlocked event?
            }
        }

        if (newlyAwarded.length > 0) {
            await user.save(); // Save updated achievements list
        }

        return newlyAwarded; // Return list of newly awarded achievements
    }

     /**
      * Updates daily or weekly streak for a user. Should be called when a qualifying action occurs (e.g., completing first review of the day/week).
      * @param {string} userId
      * @param {'daily' | 'weekly'} type
      * @returns {Promise<{updated: boolean, newCount: number}>}
      */
     async updateStreak(userId, type) {
         const user = await User.findById(userId).select('streaks');
         if (!user) return { updated: false, newCount: 0 };

         const now = new Date();
         const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
         const currentWeek = `${now.getFullYear()}-W${this.getWeekNumber(now)}`;

         let streakData = user.streaks?.[type];
         let updated = false;
         let newCount = streakData?.count || 0;

         if (type === 'daily') {
             const lastCompleted = streakData?.lastCompletedDate ? streakData.lastCompletedDate.toISOString().split('T')[0] : null;

             if (lastCompleted === todayDate) {
                 // Already completed today, do nothing
                 return { updated: false, newCount };
             }

             const yesterday = new Date(now);
             yesterday.setDate(now.getDate() - 1);
             const yesterdayDate = yesterday.toISOString().split('T')[0];

             if (lastCompleted === yesterdayDate) {
                 // Consecutive day
                 newCount++;
                 updated = true;
             } else {
                 // Streak broken or first time
                 newCount = 1;
                 updated = true;
             }
             user.streaks.daily = { count: newCount, lastCompletedDate: now };

         } else if (type === 'weekly') {
             const lastCompleted = streakData?.lastCompletedWeek;

             if (lastCompleted === currentWeek) {
                  // Already completed this week
                 return { updated: false, newCount };
             }

             const lastWeekDate = new Date(now);
             lastWeekDate.setDate(now.getDate() - 7);
             const lastWeek = `${lastWeekDate.getFullYear()}-W${this.getWeekNumber(lastWeekDate)}`;

             if (lastCompleted === lastWeek) {
                  // Consecutive week
                 newCount++;
                 updated = true;
             } else {
                  // Streak broken or first time
                 newCount = 1;
                 updated = true;
             }
             user.streaks.weekly = { count: newCount, lastCompletedWeek: currentWeek };
         }

         if (updated) {
             await user.save();
             logger.info(`[Gamification] User ${userId} ${type} streak updated to ${newCount}`);
             // Check for streak achievements
             await this.checkAndAwardAchievement(userId, type === 'daily' ? 'STREAK_DAILY' : 'STREAK_WEEKLY', { count: newCount }, user);
         }

         return { updated, newCount };
     }

     // Helper to get ISO week number
     getWeekNumber(d) {
         d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
         d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
         const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
         const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
         return weekNo;
     }
}

// Export a singleton instance
module.exports.GamificationServiceInstance = new GamificationService();
module.exports.XPConfig = { getXPForLevel, getTotalXPForLevel }; // Export helpers if needed elsewhere