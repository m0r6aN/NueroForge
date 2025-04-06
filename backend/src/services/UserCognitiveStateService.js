// neuroforge/backend/src/services/UserCognitiveStateService.js
// Refactored to use MongoDB persistence via CognitiveState model.

const mongoose = require("mongoose");
const CognitiveState = require("../models/mongo/CognitiveState"); // Import the new model
const logger = require("../utils/logger");

// In-memory store for *active* sessions (to calculate duration, interaction count etc.)
// Key: userId, Value: { sessionId, contextType, contextId, startTime, interactionCount }
const activeSessions = new Map();

// --- Calculation Logic (Initial Simple Version) ---
// TODO: Move this to a separate calculation module/helper later
function calculateNewFocusScore(currentScore = 50, interactionType, details) {
  let scoreChange = 0;
  switch (interactionType) {
    case "srs_review_submit":
      if (details?.performanceScore !== undefined) {
        // Increase score more for higher performance, decrease slightly for low
        scoreChange = (details.performanceScore - 2.5) * 2; // e.g., 5 -> +5, 4 -> +3, 3 -> +1, 2 -> -1, 1 -> -3, 0 -> -5
      }
      break;
    case "quiz_answer_submit":
      if (details?.isCorrect !== undefined) {
        scoreChange = details.isCorrect ? 3 : -2; // Simple correct/incorrect change
      }
      break;
    case "audio_preset_change":
      // Could slightly adjust based on preset type (e.g., activating 'focus' adds a small temporary boost?)
      if (details?.preset === "focus" && details?.isPlaying) scoreChange = 1;
      else if (details?.preset === "relaxation" && details?.isPlaying)
        scoreChange = -1; // Example
      break;
    // Add other interaction types later
  }

  // Apply decay? Rate limiting? For now, simple additive change, clamped.
  const newScore = Math.max(0, Math.min(100, currentScore + scoreChange));
  // logger.debug(`[CognitiveCalc] Focus score change: ${scoreChange.toFixed(1)}, New Score: ${newScore.toFixed(1)}`);
  return newScore;
}

class UserCognitiveStateService {
  // Helper to get or create the state document for a user
  async _getOrCreateStateDoc(userId) {
    if (!userId) throw new Error("Valid userId required for cognitive state");
    let stateDoc = await CognitiveState.findOne({ user: userId });
    if (!stateDoc) {
      logger.info(
        `[CognitiveState] No existing state found for user ${userId}. Creating default.`
      );
      stateDoc = await CognitiveState.create({
        user: userId,
        derivedMetrics: {
          currentFocusScore: 50,
          lastUpdatedMetric: new Date(),
        }, // Sensible defaults
        sessionHistory: [],
      });
    }
    return stateDoc;
  }

  // --- WebSocket Event Handlers ---

  async startSession(userId, context) {
    if (!context || !context.type || !context.id) {
      logger.warn(
        `[CognitiveState] Invalid context provided for startSession, user ${userId}`
      );
      return;
    }
    // Use context.id as a simple sessionId for now, or generate UUID
    const sessionId = context.id; // Assuming lesson/review ID is unique enough for *concurrent* sessions? Revisit if needed.
    const now = new Date();
    activeSessions.set(userId, {
      sessionId: sessionId,
      contextType: context.type,
      contextId: context.id,
      startTime: now,
      interactionCount: 0,
    });
    logger.info(
      `[CognitiveState] Active session started for user ${userId}:`,
      activeSessions.get(userId)
    );
    // No immediate DB write needed, only on interaction or end session.
  }

  async endSession(userId, context, durationSeconds) {
    if (!context || !context.id) {
      logger.warn(
        `[CognitiveState] Invalid context provided for endSession, user ${userId}`
      );
      return;
    }
    const activeSession = activeSessions.get(userId);

    // Only process if the ended session matches the currently tracked active session
    if (activeSession && activeSession.contextId === context.id) {
      const endTime = new Date();
      const sessionSummary = {
        sessionId: activeSession.sessionId,
        contextType: activeSession.contextType,
        contextId: activeSession.contextId,
        startTime: activeSession.startTime,
        endTime: endTime,
        // Use provided duration if accurate, else calculate
        durationSeconds:
          durationSeconds ||
          (endTime.getTime() - activeSession.startTime.getTime()) / 1000,
        interactionCount: activeSession.interactionCount,
        // TODO: Add calculated focus/engagement score for the session here later
      };

      logger.info(
        `[CognitiveState] Active session ended for user ${userId}. Summary:`,
        sessionSummary
      );

      try {
        const stateDoc = await this._getOrCreateStateDoc(userId);
        // Add summary to history, maintaining max size
        stateDoc.sessionHistory.push(sessionSummary);
        if (stateDoc.sessionHistory.length > 50) {
          stateDoc.sessionHistory.shift(); // Remove oldest
        }
        stateDoc.lastUpdatedAt = new Date(); // Mark update
        await stateDoc.save();
        logger.debug(
          `[CognitiveState] Session history saved for user ${userId}`
        );
      } catch (error) {
        logger.error(
          `[CognitiveState] Failed to save session history for user ${userId}:`,
          error
        );
      } finally {
        // Clear active session regardless of save success/failure
        activeSessions.delete(userId);
      }
    } else {
      logger.warn(
        `[CognitiveState] Received endSession for user ${userId} but no matching active session found or context mismatch. Context:`,
        context
      );
    }
  }

  async logInteraction(userId, context, interaction) {
    if (!interaction || !interaction.interactionType) return;

    const activeSession = activeSessions.get(userId);
    if (activeSession) {
      // Ensure interaction context matches active session if needed (optional strictness)
      if (context && context.id && activeSession.contextId !== context.id) {
        logger.warn(
          `[CognitiveState] Interaction context mismatch for user ${userId}. Active: ${activeSession.contextId}, Interaction: ${context.id}`
        );
        // Decide whether to still process or ignore - let's process for now
      }
      activeSession.interactionCount += 1;
      // No need to update map value explicitly if just incrementing count
    } else {
      logger.warn(
        `[CognitiveState] Interaction logged for user ${userId} outside of an active session? Context:`,
        context
      );
      // Decide if these should still affect overall score - perhaps less impact?
    }

    try {
      const stateDoc = await this._getOrCreateStateDoc(userId);
      const oldScore = stateDoc.derivedMetrics?.currentFocusScore ?? 50;

      // --- Calculate new focus score ---
      const newFocusScore = calculateNewFocusScore(
        oldScore,
        interaction.interactionType,
        interaction.details
      );

      // Update the document
      let updated = false;
      if (stateDoc.derivedMetrics.currentFocusScore !== newFocusScore) {
        stateDoc.derivedMetrics.currentFocusScore = newFocusScore;
        stateDoc.derivedMetrics.lastUpdatedMetric = new Date();
        updated = true;
      }
      if (updated) {
        stateDoc.lastUpdatedAt = new Date();
        await stateDoc.save();
        logger.debug(
          `[CognitiveState] Updated focus score for user ${userId} to ${newFocusScore.toFixed(
            1
          )} based on ${interaction.interactionType}`
        );
      }
    } catch (error) {
      logger.error(
        `[CognitiveState] Failed to log interaction and update state for user ${userId}:`,
        error
      );
    }
  }

  /**
   * Gets the current derived cognitive state for a user.
   * Reads persisted data.
   * @param {string} userId
   * @returns {Promise<{ currentFocusScore: number | null }>}
   */
  async getCurrentCognitiveState(userId) {
    // This method is now intended primarily for the pathing service, reading the persisted derived state.
    // It does NOT rely on the real-time activeSessions map.
    try {
      // No need to create here, if no state exists, return null/default
      const stateDoc = await CognitiveState.findOne({ user: userId })
        .select("derivedMetrics")
        .lean(); // Use lean

      if (!stateDoc || !stateDoc.derivedMetrics) {
        logger.warn(
          `[CognitiveState] No persisted state found for user ${userId} when requested.`
        );
        // Return default or null state
        return { currentFocusScore: 50 }; // Default neutral state
      }

      // TODO: Add logic for state decay? If lastUpdatedMetric is old, decay score towards 50?
      // const decayThreshold = 1 * 60 * 60 * 1000; // 1 hour
      // if (Date.now() - stateDoc.derivedMetrics.lastUpdatedMetric.getTime() > decayThreshold) { ... apply decay ... }

      return {
        currentFocusScore: stateDoc.derivedMetrics.currentFocusScore ?? 50, // Return persisted score
      };
    } catch (error) {
      logger.error(
        `[CognitiveState] Error fetching current cognitive state for user ${userId}:`,
        error
      );
      return { currentFocusScore: null }; // Indicate error state
    }
  }

  /**
   * Calculates recent performance score - KEEPING THIS SEPARATE FOR NOW
   * This is based on explicit review history, distinct from derived focus score.
   * Pathing service can call BOTH methods if needed.
   * @param {string} userId
   * @param {number} [lookbackLimit=10]
   * @returns {Promise<{averagePerformance: number | null, reviewsConsidered: number}>}
   */
  async calculateRecentPerformance(userId, lookbackLimit = 10) {
    // ... Keep the implementation from previous version using UserProgress ...
    // Find UserProgress, get reviewHistory, calculate average...
    try {
      const recentProgressEntries = await UserProgress.find({
        user: userId,
        "reviewHistory.0": { $exists: true },
      })
        .sort({ updatedAt: -1 })
        .select("reviewHistory")
        .lean();
      if (!recentProgressEntries || recentProgressEntries.length === 0)
        return { averagePerformance: null, reviewsConsidered: 0 };
      let allReviews = [];
      recentProgressEntries.forEach((entry) => {
        if (entry.reviewHistory) allReviews.push(...entry.reviewHistory);
      });
      allReviews.sort((a, b) => b.date.getTime() - a.date.getTime());
      const reviewsToConsider = allReviews.slice(0, lookbackLimit);
      if (reviewsToConsider.length === 0)
        return { averagePerformance: null, reviewsConsidered: 0 };
      const totalScore = reviewsToConsider.reduce(
        (sum, review) => sum + (review.performanceScore || 0),
        0
      );
      const averagePerformance = totalScore / reviewsToConsider.length;
      return {
        averagePerformance: averagePerformance,
        reviewsConsidered: reviewsToConsider.length,
      };
    } catch (error) {
      logger.error(
        `Error calculating recent performance for user ${userId}:`,
        error
      );
      return { averagePerformance: null, reviewsConsidered: 0 };
    }
  }
}

// Export a singleton instance
module.exports.UserCognitiveStateServiceInstance =
  new UserCognitiveStateService();
