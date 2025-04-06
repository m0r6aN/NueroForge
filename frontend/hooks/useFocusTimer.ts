// hooks/useFocusTimer.ts
import { useState, useEffect, useRef } from 'react';
import { useNeuroForgeWebSocket } from '@/components/providers/websocket-provider';
import { WebSocketStatus } from '@/hooks/useWebSocket';

interface FocusTimerHookOptions {
  duration: number;
  breakInterval: number;
  cycles: number;
  lessonId: string;
  onComplete: (data: FocusTimerCompletionData) => void;
}

export interface FocusTimerCompletionData {
  completed: boolean;
  focusTime: number; // Total time spent focusing in seconds
  pauseCount: number; // Number of times the timer was paused
  cyclesCompleted: number; // Number of complete cycles
}

export interface FocusTimerState {
  isRunning: boolean;
  isPaused: boolean;
  isBreak: boolean;
  timeRemaining: number;
  currentCycle: number;
  totalFocusTime: number;
  pauseCount: number;
  elapsedTime: number;
}

export function useFocusTimer({
  duration,
  breakInterval,
  cycles = 1,
  lessonId,
  onComplete
}: FocusTimerHookOptions) {
  // State
  const [state, setState] = useState<FocusTimerState>({
    isRunning: false,
    isPaused: false,
    isBreak: false,
    timeRemaining: duration,
    currentCycle: 1,
    totalFocusTime: 0,
    pauseCount: 0,
    elapsedTime: 0
  });
  
  // WebSocket for telemetry
  const { sendMessage, status: wsStatus } = useNeuroForgeWebSocket();
 
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Timer tick function
  const tick = () => {
    const now = Date.now();
    const elapsed = Math.floor((now - lastTickRef.current) / 1000);
    lastTickRef.current = now;
    
    setState(prev => {
      const newTimeRemaining = Math.max(0, prev.timeRemaining - elapsed);
      const newElapsedTime = prev.elapsedTime + elapsed;
      
      // Handle timer completion
      if (newTimeRemaining === 0) {
        // Clear interval
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // If we're in a focus period
        if (!prev.isBreak) {
          // Update total focus time
          const newTotalFocusTime = prev.totalFocusTime + (prev.isBreak ? 0 : elapsed);
          
          // If we have more cycles or need a break
          if (prev.currentCycle < cycles) {
            // Switch to break
            if (breakInterval > 0) {
              // Send telemetry for break start
              sendMessage({
                type: 'focus_timer_event',
                action: 'break_started',
                lessonId,
                data: {
                  cycle: prev.currentCycle,
                  focusTime: newTotalFocusTime
                }
              });
              
              // Start break timer
              startTimeRef.current = now;
              lastTickRef.current = now;
              
              timerRef.current = setInterval(tick, 1000);
              
              return {
                ...prev,
                isBreak: true,
                timeRemaining: breakInterval,
                totalFocusTime: newTotalFocusTime,
                elapsedTime: newElapsedTime
              };
            } else {
              // No break, move to next cycle
              startTimeRef.current = now;
              lastTickRef.current = now;
              
              // Send telemetry for cycle completion
              if (wsStatus === WebSocketStatus.OPEN) {
                sendMessage({
                  type: 'interaction',
                  payload: {
                    context: { type: 'lesson', id: lessonId },
                    interactionType: 'focus_timer_event',
                    details: {
                      action: 'timer_started',
                      timestamp: now,
                    }
                  }
                });
              }
              
              timerRef.current = setInterval(tick, 1000);
              
              return {
                ...prev,
                currentCycle: prev.currentCycle + 1,
                timeRemaining: duration,
                totalFocusTime: newTotalFocusTime,
                elapsedTime: newElapsedTime
              };
            }
          } else {
            // All cycles completed
            // Send telemetry for completion
            if (wsStatus === WebSocketStatus.OPEN) {
                sendMessage({
                  type: 'interaction',
                  payload: {
                    context: { type: 'lesson', id: lessonId },
                    interactionType: 'focus_timer_event',
                    details: {
                      action: 'timer_completed',
                      cycles: prev.currentCycle,
                      focusTime: newTotalFocusTime,
                      pauseCount: prev.pauseCount
                    }
                  }
                });
              }
            
            // Call completion handler
            onComplete({
              completed: true,
              focusTime: newTotalFocusTime,
              pauseCount: prev.pauseCount,
              cyclesCompleted: prev.currentCycle
            });
            
            return {
              ...prev,
              isRunning: false,
              timeRemaining: 0,
              totalFocusTime: newTotalFocusTime,
              elapsedTime: newElapsedTime
            };
          }
        } else {
          // Break completed, start next focus period
          startTimeRef.current = now;
          lastTickRef.current = now;
          
          // Send telemetry for focus start
          if (wsStatus === WebSocketStatus.OPEN) {
            sendMessage({
              type: 'interaction',
              payload: {
                context: { type: 'lesson', id: lessonId },
                interactionType: 'focus_timer_event',
                details: {
                  action: 'focus_started',
                  cycle: prev.currentCycle + 1,
                  previousFocusTime: prev.totalFocusTime
                }
              }
            });
          }
          
          timerRef.current = setInterval(tick, 1000);
          
          return {
            ...prev,
            isBreak: false,
            currentCycle: prev.currentCycle + 1,
            timeRemaining: duration,
            elapsedTime: newElapsedTime
          };
        }
      }
      
      // Regular tick update
      return {
        ...prev,
        timeRemaining: newTimeRemaining,
        totalFocusTime: prev.totalFocusTime + (!prev.isBreak ? elapsed : 0),
        elapsedTime: newElapsedTime
      };
    });
  };
  
  // Start the timer
  const startTimer = () => {
    if (state.isRunning) return;
    
    const now = Date.now();
    startTimeRef.current = now;
    lastTickRef.current = now;
    
    // Send telemetry for timer start
    if (wsStatus === WebSocketStatus.OPEN) {
        sendMessage({
          type: 'interaction',
          payload: {
            context: { type: 'lesson', id: lessonId },
            interactionType: 'focus_timer_event',
            details: {
              action: 'timer_started',
              timestamp: now
            }
          }
        });
      }
    
    timerRef.current = setInterval(tick, 1000);
    
    setState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
    }));
  };
  
  // Pause the timer
  const pauseTimer = () => {
    if (!state.isRunning || state.isPaused) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Send telemetry for timer pause
    if (wsStatus === WebSocketStatus.OPEN) {
        sendMessage({
          type: 'interaction',
          payload: {
            context: { type: 'lesson', id: lessonId },
            interactionType: 'focus_timer_event',
            details: {
              action: 'timer_paused',
              timeRemaining: state.timeRemaining,
              focusTime: state.totalFocusTime
            }
          }
        });
      }
    
    setState(prev => ({
      ...prev,
      isPaused: true,
      pauseCount: prev.pauseCount + 1
    }));
  };
  
  // Resume the timer
  const resumeTimer = () => {
    if (!state.isPaused) return;
    
    const now = Date.now();
    lastTickRef.current = now;
    
    // Send telemetry for timer resume
    if (wsStatus === WebSocketStatus.OPEN) {
        sendMessage({
          type: 'interaction',
          payload: {
            context: { type: 'lesson', id: lessonId },
            interactionType: 'focus_timer_event',
            details: {
              action: 'timer_resumed',
              timeRemaining: state.timeRemaining
            }
          }
        });
      }
    
    timerRef.current = setInterval(tick, 1000);
    
    setState(prev => ({
      ...prev,
      isPaused: false
    }));
  };
  
  // Stop the timer
  const stopTimer = () => {
    if (!state.isRunning) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Send telemetry for timer stop
    if (wsStatus === WebSocketStatus.OPEN) {
        sendMessage({
          type: 'interaction',
          payload: {
            context: { type: 'lesson', id: lessonId },
            interactionType: 'focus_timer_event',
            details: {
              action: 'timer_stopped',
              focusTime: state.totalFocusTime,
              pauseCount: state.pauseCount,
              cyclesCompleted: state.currentCycle - (state.timeRemaining === duration ? 1 : 0)
            }
          }
        });
      }

    // Call completion handler with partial completion
    onComplete({
      completed: false,
      focusTime: state.totalFocusTime,
      pauseCount: state.pauseCount,
      cyclesCompleted: state.currentCycle - (state.timeRemaining === duration ? 1 : 0)
    });
    
    setState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false
    }));
  };
  
  // Reset the timer
  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Send telemetry for timer reset
    if (wsStatus === WebSocketStatus.OPEN) {
        sendMessage({
            type: 'interaction',
            payload: {
            context: { type: 'lesson', id: lessonId },
            interactionType: 'focus_timer_event',
            details: {
                action: 'timer_reset',
                focusTime: state.totalFocusTime
            }
            }
        });
        }
    
    setState({
      isRunning: false,
      isPaused: false,
      isBreak: false,
      timeRemaining: duration,
      currentCycle: 1,
      totalFocusTime: 0,
      pauseCount: 0,
      elapsedTime: 0
    });
  };
  
  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return {
    // State
    ...state,
    
    // Formatted time
    formattedTimeRemaining: formatTime(state.timeRemaining),
    formattedTotalFocusTime: formatTime(state.totalFocusTime),
    
    // Progress percentage
    progressPercentage: state.isBreak 
      ? 100 - (state.timeRemaining / breakInterval) * 100
      : 100 - (state.timeRemaining / duration) * 100,
    
    // Cycle progress
    cycleProgressPercentage: ((state.currentCycle - 1) / cycles) * 100,
    
    // Controls
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer
  };
}