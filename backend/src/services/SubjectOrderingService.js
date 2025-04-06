// neuroforge/backend/src/services/SubjectOrderingService.js
// Purpose: Encapsulates complex subject ordering logic for personalized learning paths.
// FINAL MERGED VERSION - Integrates real cognitive state, cycle checks, edge cases.

const mongoose = require('mongoose');
const Subject = require('../models/mongo/Subject');
const UserProgress = require('../models/mongo/UserProgress');
const Lesson = require('../models/mongo/Lesson');
const logger = require('../utils/logger');
// Import the REAL cognitive state service instance (assuming final name is UserProgressServiceInstance)
const { UserProgressServiceInstance } = require('./UserProgressService');

// Placeholder for caching implementation
// const cache = { get: async () => null, set: async () => {}, del: async () => {} };

class SubjectOrderingService {

    // Using Kahn's algorithm for topological sort (Robust & handles cycles gracefully during sort)
    _topologicalSort(subjects, graph, inDegree) {
        const queue = [];
        inDegree.forEach((degree, id) => {
            if (degree === 0) queue.push(id);
        });

        const sortedOrderIds = [];
        while (queue.length > 0) {
            const u = queue.shift();
            sortedOrderIds.push(u); // Store sorted IDs

            graph.get(u)?.forEach(v => {
                inDegree.set(v, inDegree.get(v) - 1);
                if (inDegree.get(v) === 0) queue.push(v);
            });
        }

        if (sortedOrderIds.length !== subjects.length) {
            // This check *after* Kahn's confirms if a cycle prevented a full sort
            logger.error("Cycle detected in subject dependencies! Topological sort incomplete.");
            // Return the partial sort. Downstream logic must handle potential incompleteness.
            return sortedOrderIds;
        }
        return sortedOrderIds; // Return array of sorted Subject IDs
    }

    // Helper to build graph and in-degrees for Kahn's
    _buildGraphAndDegrees(subjects) {
        const graph = new Map(); // subjectId -> [dependentSubjectIds]
        const inDegree = new Map(); // subjectId -> countOfPrerequisites
        const subjectMap = new Map(); // Keep minimal map if needed, or fetch full later

        subjects.forEach(subject => {
            const id = subject._id.toString();
            graph.set(id, []);
            inDegree.set(id, 0);
            subjectMap.set(id, subject); // Store subject data for lookup
        });

        subjects.forEach(subject => {
            const id = subject._id.toString();
            subject.prerequisites?.forEach(prereqId => {
                const prereqStr = prereqId.toString();
                if (graph.has(prereqStr)) {
                    // Store dependents correctly for Kahn's algorithm usage in _topologicalSort
                     // Add subject 'id' as dependent on 'prereqStr'
                     // This graph structure differs slightly from DFS cycle check if needed elsewhere
                     // For Kahn's, we typically need outgoing edges or just calculate in-degrees
                     // Let's refine: Build adjacency list prerequisite -> dependents for cycle check maybe?
                     // For Kahn's we JUST need inDegree counts.

                    // Build inDegree: prerequisite increases dependent's degree
                    inDegree.set(id, (inDegree.get(id) || 0) + 1);
                    // Build graph: needed for traversing after popping from queue
                    // Graph: prereqId -> [list of ids that depend on it] is not needed for kahn itself,
                    // but needed to *reduce* the inDegree of neighbors
                     // Let's store: subjectId -> [list of subjects it enables / depends on it] -> NO, needs reverse.
                     // Graph stores: subjectId -> [list of its prerequisites] -> NO
                     // Graph stores: prerequisiteId -> [list of subjects that have it as a prereq] -> YES, for propagation
                     if (!graph.has(prereqStr)) graph.set(prereqStr, []); // Initialize if needed
                     graph.get(prereqStr).push(id); // 'id' depends on 'prereqStr'


                } else {
                    logger.warn(`Prerequisite ${prereqStr} for subject ${id} not found during graph build.`);
                }
            });
        });

        // Corrected graph structure for Kahn's propagation:
        // Rebuild graph -> node points to nodes that depend on it
        const propagationGraph = new Map();
        subjects.forEach(subject => {
             propagationGraph.set(subject._id.toString(), []); // Init empty dependents list
        });
        subjects.forEach(subject => {
            const id = subject._id.toString();
            subject.prerequisites?.forEach(prereqId => {
                const prereqStr = prereqId.toString();
                if (propagationGraph.has(prereqStr)) {
                    propagationGraph.get(prereqStr).push(id); // Add 'id' to the list of nodes that depend on 'prereqStr'
                }
            });
        });


        return { graph: propagationGraph, inDegree, subjectMap };
    }

    // Optional: Separate cycle check using DFS (from Grok) if needed, though Kahn detects non-DAG
    _detectCyclesDFS(subjects) {
         const graph = new Map(); // Build graph: Node -> Prerequisites
         subjects.forEach(s => {
             graph.set(s._id.toString(), (s.prerequisites || []).map(p => p.toString()));
         });

        const visited = new Set();
        const recStack = new Set();

        const dfs = (node) => {
            if (!graph.has(node)) return false; // Node not in graph (shouldn't happen if built from all subjects)
            if (recStack.has(node)) return true; // Cycle detected
            if (visited.has(node)) return false; // Already visited and no cycle found from here

            visited.add(node);
            recStack.add(node);

            const deps = graph.get(node);
            for (const dep of deps) {
                if (dfs(dep)) return true; // Cycle found deeper
            }

            recStack.delete(node); // Backtrack
            return false;
        };

        for (const node of graph.keys()) {
            if (dfs(node)) return true; // Cycle detected starting from this node
        }
        return false; // No cycles found
    }

    // Fallback if cycles detected or other errors (from Grok)
     _fallbackToFirstSubject(subjects, completedLessonIds) {
         // Find first subject that HAS uncompleted lessons
         for(const subject of subjects) { // Iterate through original (potentially unsorted) list
              // Fetch lessons only when needed
             const lessonsInSubject = await Lesson.find({ subject: subject._id }).select('_id title cognitiveEnhancement').lean();
             const nextLesson = lessonsInSubject.find(lesson => !completedLessonIds.has(lesson._id.toString()));
             if (nextLesson) {
                 logger.warn(`Executing fallback path logic. Suggesting first available lesson in subject: ${subject.title}`);
                 return {
                     subjectId: subject._id.toString(),
                     lessonId: nextLesson._id.toString(),
                     rationale: 'System Suggestion: Fallback path initiated due to potential dependency cycle or error.'
                 };
             }
         }
         // No uncompleted lessons found anywhere
         return null;
     }

    // Cognitive state adjustment (logic from Grok, adapted)
    _adjustRationaleForCognitiveState(currentRationale, cognitiveState) {
        let adjustedRationale = currentRationale;
        // Assuming state is { recentPerformance: number | null }
        const performance = cognitiveState.recentPerformance;

        if (performance === null) {
            adjustedRationale += " (First steps - adapt as you go!)";
        } else if (performance < 2.5) { // Adjusted threshold
            adjustedRationale = `Performance suggests easing in. ${adjustedRationale}`;
            // FUTURE: Select easier lesson variant here if available
        } else if (performance > 4.0) { // Adjusted threshold
            adjustedRationale = `Strong performance! ${adjustedRationale}`;
            // FUTURE: Select harder lesson variant here if available
        } else {
            // Medium performance
             adjustedRationale += " (Steady progress.)"
        }
        return adjustedRationale;
    }

    /**
     * Gets the next recommended lesson for the user. FINAL MERGED VERSION.
     * @param {string} userId
     * @returns {Promise<{subjectId: string, subjectTitle: string, lessonId: string, lessonTitle: string, rationale: string, recommendedAudioPreset: string | null } | null>}
     */
    async suggestNextLesson(userId) {
        try {
            // 1. Fetch subjects
            const allSubjects = await Subject.find().select('_id title prerequisites').lean();
            if (!allSubjects || allSubjects.length === 0) {
                logger.info(`No subjects found for path suggestion.`);
                return { subjectId: null, lessonId: null, rationale: "No subjects available.", subjectTitle: null, lessonTitle: null, recommendedAudioPreset: null };
            }

            // 2. Build Graph & Check for Cycles using DFS
            if (this._detectCyclesDFS(allSubjects)) {
                logger.error(`Cycle detected in subject graph for user ${userId}. Attempting fallback.`);
                 // Need completed lessons for fallback
                 const fallbackProgress = await UserProgress.find({ user: userId, status: { $in: ['completed', 'mastered'] } }).select('lesson').lean();
                 const fallbackCompletedIds = new Set(fallbackProgress.map(p => p.lesson.toString()));
                 return await this._fallbackToFirstSubject(allSubjects, fallbackCompletedIds);
            }

            // 3. Build Graph & In-Degrees for Kahn's topological sort
            const { graph: propagationGraph, inDegree, subjectMap } = this._buildGraphAndDegrees(allSubjects);

            // 4. Perform Topological Sort
            const sortedSubjectIds = this._topologicalSort(allSubjects, propagationGraph, inDegree);
            // Check if Kahn's sort failed (cycle detection alternative)
             if (sortedSubjectIds.length !== allSubjects.length) {
                 logger.error(`Kahn's algorithm failed, indicates cycle or graph issue for user ${userId}. Attempting fallback.`);
                 const fallbackProgress = await UserProgress.find({ user: userId, status: { $in: ['completed', 'mastered'] } }).select('lesson').lean();
                 const fallbackCompletedIds = new Set(fallbackProgress.map(p => p.lesson.toString()));
                 return await this._fallbackToFirstSubject(allSubjects, fallbackCompletedIds);
             }


            // 5. Get user's completed lesson IDs
            const completedProgress = await UserProgress.find({ user: userId, status: { $in: ['completed', 'mastered'] } })
                .select('lesson')
                .lean();
            const completedLessonIds = new Set(completedProgress.map(p => p.lesson.toString()));

            // 6. Get user's current cognitive state (using REAL service)
            const cognitiveState = await UserProgressServiceInstance.getCurrentCognitiveState(userId);
            logger.debug(`Cognitive state for user ${userId}:`, cognitiveState);

            // 7. Find the next uncompleted lesson in the optimal path
            for (const subjectId of sortedSubjectIds) {
                 const currentSubject = subjectMap.get(subjectId); // Get subject data from map
                 if (!currentSubject) continue; // Should not happen if map is correct

                 // More robust prerequisite check needed here based on Subject Completion logic (Dev 3 / Future)
                 // For now, trust the topological sort implies prerequisite possibility

                const lessonsInSubject = await Lesson.find({ subject: subjectId })
                    .select('_id title cognitiveEnhancement') // Fetch needed fields
                    .sort({ createdAt: 1 }) // Ensure consistent order
                    .lean();

                 if (!lessonsInSubject || lessonsInSubject.length === 0) {
                      logger.warn(`Subject ${subjectId} has no lessons. Skipping.`);
                      // TODO: Trigger Subject Completion Check even if empty?
                      continue; // Move to next subject
                 }


                for (const lesson of lessonsInSubject) {
                    const lessonId = lesson._id.toString();
                    if (!completedLessonIds.has(lessonId)) {
                        // Found the next uncompleted lesson.

                        let baseRationale = "Next lesson in calculated learning path.";
                        // Apply cognitive state adjustments to rationale
                        let finalRationale = this._adjustRationaleForCognitiveState(baseRationale, cognitiveState);

                        // Add audio recommendation to rationale if present
                         const recommendedAudio = lesson.cognitiveEnhancement?.recommendedAudioPreset || null;
                         if (recommendedAudio) {
                             finalRationale += ` Recommended audio: ${recommendedAudio}.`;
                         }


                        logger.info(`Suggesting next lesson for user ${userId}: Subject ${subjectId}, Lesson ${lessonId}`);
                        // Fetch full Subject title here to include in response
                        const subjectDoc = await Subject.findById(subjectId).select('title').lean();

                        return {
                            subjectId: subjectId,
                            subjectTitle: subjectDoc?.title || 'Unknown Subject', // Add title
                            lessonId: lessonId,
                            lessonTitle: lesson.title, // Add title
                            rationale: finalRationale,
                            recommendedAudioPreset: recommendedAudio // Add preset
                        };
                    }
                }
                // If loop finishes, all lessons in this subject are done.
                // TODO: Hook for marking Subject as complete (Dev 3).
            }

            // All lessons in all reachable subjects completed
            logger.info(`User ${userId} has completed all available lessons.`);
            return { subjectId: null, lessonId: null, rationale: "All available lessons completed!", subjectTitle: null, lessonTitle: null, recommendedAudioPreset: null };

        } catch (error) {
            logger.error(`Error suggesting next lesson for user ${userId}:`, error);
             // Attempt graceful fallback on generic error too
            try {
                 const fallbackSubjects = await Subject.find().select('_id title prerequisites lessons').lean(); // Fetch enough for fallback
                 const fallbackProgress = await UserProgress.find({ user: userId, status: { $in: ['completed', 'mastered'] } }).select('lesson').lean();
                 const fallbackCompletedIds = new Set(fallbackProgress.map(p => p.lesson.toString()));
                 return await this._fallbackToFirstSubject(fallbackSubjects, fallbackCompletedIds);
             } catch (fallbackError) {
                 logger.error(`Fallback path logic also failed for user ${userId}:`, fallbackError);
                 return null; // Final failure state
             }
        }
    }

    // ... [getSubjectGraph if kept] ...
    async getSubjectGraph() { /* ... */ }
    // ... [handleSubjectChange caching logic if added later] ...
}

// Export singleton instance
module.exports.SubjectOrderingServiceInstance = new SubjectOrderingService();