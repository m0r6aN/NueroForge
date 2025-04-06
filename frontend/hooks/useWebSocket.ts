// neuroforge/frontend/hooks/useWebSocket.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner'; // For connection status/errors

// Define message types based on protocol doc
// TODO: Create proper types/interfaces in `types/websocket.ts`
interface WebSocketMessagePayload {
    type: string;
    [key: string]: any; // Adjust this to match the actual structure of your payload
}

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:5001/ws'; // Get URL from env

export enum WebSocketStatus {
    CONNECTING = 'Connecting',
    OPEN = 'Open',
    CLOSING = 'Closing',
    CLOSED = 'Closed',
    UNINSTANTIATED = 'Uninstantiated',
}

export function useWebSocket() {
    const { data: session } = useSession();
    const [status, setStatus] = useState<WebSocketStatus>(WebSocketStatus.UNINSTANTIATED);
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
    const connectAttempt = useRef<number>(0);
    const messageQueue = useRef<string[]>([]);

    // --- Helper to process queue ---
    const processMessageQueue = useCallback(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            while (messageQueue.current.length > 0) {
                const message = messageQueue.current.shift();
                if (message) {
                     try {
                         ws.current.send(message);
                         console.log('[WebSocket] Sent queued message:', JSON.parse(message).type);
                     } catch (error) {
                         console.error('[WebSocket] Error sending queued message:', error);
                         // Optionally re-queue or handle error
                     }
                }
            }
        }
    }, []);

    const connect = useCallback(() => {
        if (!session?.accessToken) {
             console.warn('[WebSocket] No access token available, delaying connection.');
             // Optionally try again later or require login
             setStatus(WebSocketStatus.CLOSED);
            return;
        }
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
             console.log('[WebSocket] Already connected.');
            return;
        }

        // Clear any existing reconnect timeouts
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = null;
        }

        console.log('[WebSocket] Attempting to connect...');
        setStatus(WebSocketStatus.CONNECTING);
        connectAttempt.current += 1;
        const urlWithToken = `${WEBSOCKET_URL}?token=${session.accessToken}`;
        ws.current = new WebSocket(urlWithToken);

        ws.current.onopen = () => {
            console.log('[WebSocket] Connection established.');
            setStatus(WebSocketStatus.OPEN);
            toast("Neural Link Active", { description: "duration: 2000" });
            connectAttempt.current = 0;
            processMessageQueue();
        };

        ws.current.onclose = (event) => {
            console.warn(`[WebSocket] Connection closed. Code: ${event.code}, Reason: ${event.reason}`);
            setStatus(WebSocketStatus.CLOSED);
            ws.current = null;

             // Implement reconnection logic with backoff
             if (connectAttempt.current < 5) { // Limit reconnect attempts
                  const delay = Math.pow(2, connectAttempt.current) * 1000; // Exponential backoff
                  console.log(`[WebSocket] Attempting reconnect in ${delay / 1000}s...`);
                  reconnectTimeout.current = setTimeout(connect, delay);
             } else {
                  console.error('[WebSocket] Max reconnect attempts reached.');
                  toast("Neural Link Severed", { description: "Could not maintain connection."});
             }
        };

        ws.current.onerror = (error) => {
            console.error('[WebSocket] Error:', error);
             // Ensure status is set and ref is nullified, onclose should follow
             if (ws.current) {
                 // Explicitly set status as errors might not always trigger onclose immediately
                 setStatus(WebSocketStatus.CLOSED);
                 ws.current = null;
             }
        };

        ws.current.onmessage = (event) => {
            // Handle messages from server (e.g., acknowledgments, errors, future features)
            try {
                const message = JSON.parse(event.data);
                console.log('[WebSocket] Message from server:', message);
                // TODO: Process server messages based on type
                 if (message.type === 'error') {
                      toast("WebSocket Error", { description: message.message});
                      
                      if (connectAttempt.current < 5) { 
                            const delay = Math.pow(2, connectAttempt.current) * 1000; // Exponential backoff
                            console.log(`[WebSocket] Attempting reconnect in ${delay / 1000}s...`);
                            reconnectTimeout.current = setTimeout(connect, delay);
                       } else { 
                            console.error('[WebSocket] Max reconnect attempts reached.');
                            toast("Neural Link Severed", { description: "Could not maintain connection."});
                       }
                 }
            } catch (error) {
                console.error('[WebSocket] Error parsing server message:', error);
            }
        };
    }, [session?.accessToken, processMessageQueue]); // Reconnect if token changes

    const disconnect = useCallback(() => {
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current); // Prevent reconnect attempts if manually disconnecting
            reconnectTimeout.current = null;
        }
         connectAttempt.current = 10; // Prevent automatic reconnect after manual disconnect
        if (ws.current) {
            console.log('[WebSocket] Closing connection...');
             // Set status immediately on initiating close
             setStatus(WebSocketStatus.CLOSING);
            ws.current.close(1000, "User disconnected"); // Use normal closure code
             // Rely on onclose handler to set final state and nullify ref
        }
        messageQueue.current = []; // Clear queue on manual disconnect
    }, []);

    // Effect to connect when session is available and disconnect on unmount/logout
    useEffect(() => {
        if (session?.accessToken && status !== WebSocketStatus.OPEN && status !== WebSocketStatus.CONNECTING) {
             connect();
        } else if (!session?.accessToken && status === WebSocketStatus.OPEN) {
             disconnect(); // Disconnect if user logs out
        }

        // Cleanup on component unmount
        return () => {
            disconnect();
        };
    }, [session, status, connect, disconnect]); // Added status dependency

    const sendMessage = useCallback((message: { type: string; payload: WebSocketMessagePayload }) => {
        const messageWithTimestamp = {
            ...message,
            timestamp: new Date().toISOString(),
        };
        const messageString = JSON.stringify(messageWithTimestamp);

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            try {
                ws.current.send(messageString);
                console.log('[WebSocket] Sent:', message.type, message.payload);
            } catch (error) {
                console.error('[WebSocket] Error sending message:', error);
                 // TODO: Maybe try to queue here if send fails transiently?
            }
        } else {
            console.warn('[WebSocket] Connection not open. Queuing message:', message.type);
            // --- NEW: Queue message if not connected ---
            messageQueue.current.push(messageString);
            // Optional: Add queue size limit?
             if (messageQueue.current.length > 50) {
                 messageQueue.current.shift(); // Remove oldest if queue gets too long
                 console.warn('[WebSocket] Message queue limit reached, dropping oldest message.');
             }
             // Attempt to reconnect if not already connecting/closing
             if (status !== WebSocketStatus.CONNECTING && status !== WebSocketStatus.CLOSING) {
                  console.log('[WebSocket] Triggering reconnect attempt due to queued message.');
                  connectAttempt.current = 0; // Reset attempt count for manual trigger
                  connect();
             }
        }
    }, [status, connect]); // Added status and connect dependencies

    return { status, sendMessage, connect, disconnect };
}