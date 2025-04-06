// neuroforge/frontend/components/providers/websocket-provider.tsx
"use client";

import React, { createContext, useContext } from 'react';
import { useWebSocket, WebSocketStatus } from '@/hooks/useWebSocket';

interface WebSocketContextType {
    status: WebSocketStatus;
    sendMessage: (message: { type: string; payload: any }) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const { status, sendMessage } = useWebSocket();

    return (
        <WebSocketContext.Provider value={{ status, sendMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useNeuroForgeWebSocket(): WebSocketContextType {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useNeuroForgeWebSocket must be used within a WebSocketProvider');
    }
    return context;
}