// neuroforge/frontend/components/learning/AiTutorInterface.tsx
// Purpose: Basic chat interface for interacting with the AI Tutor
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Loader2, Send, User } from 'lucide-react';
import { postToAiTutor } from 'lib/api';
import { useToast } from "@/components/ui/use-toast";
import { cn } from 'lib/utils';

interface Message {
    id: string;
    sender: 'user' | 'ai';
    text: string;
}

interface AiTutorInterfaceProps {
    initialContext?: any; // e.g., { lessonId: string, subject: string }
    teachingStyle?: string; // Allow overriding user preference
    personality?: string; // Allow overriding user preference
}

export function AiTutorInterface({ initialContext, teachingStyle, personality }: AiTutorInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const messageText = inputValue.trim();
        if (!messageText || isLoading) return;

        const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await postToAiTutor(messageText, initialContext, teachingStyle, personality);
            if (response.success && response.data?.reply) {
                const aiMessage: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: response.data.reply };
                setMessages(prev => [...prev, aiMessage]);
            } else {
                throw new Error(response.message || 'Failed to get response from AI Tutor.');
            }
        } catch (error: any) {
            console.error("AI Tutor error:", error);
             toast({
                 title: "AI Tutor Error",
                 description: error.message,
                 variant: "destructive",
             });
             // Optionally add an error message to the chat
             // const errorMessage: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: `Error: ${error.message}` };
             // setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[400px] border rounded-md">
            {/* Message Display Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex items-start gap-3", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                            {msg.sender === 'ai' && (
                                <Avatar className="h-8 w-8 border">
                                    <AvatarFallback><Bot size={18} /></AvatarFallback>
                                </Avatar>
                            )}
                            <div className={cn(
                                "max-w-[75%] rounded-lg p-3 text-sm",
                                msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}>
                                {msg.text}
                            </div>
                             {msg.sender === 'user' && (
                                <Avatar className="h-8 w-8 border">
                                     <AvatarFallback><User size={18} /></AvatarFallback>
                                     {/* TODO: Use actual user avatar */}
                                </Avatar>
                             )}
                        </div>
                    ))}
                     {isLoading && (
                         <div className="flex items-start gap-3 justify-start">
                             <Avatar className="h-8 w-8 border">
                                 <AvatarFallback><Bot size={18} /></AvatarFallback>
                             </Avatar>
                              <div className="bg-muted rounded-lg p-3 text-sm flex items-center">
                                 <Loader2 className="h-4 w-4 animate-spin mr-2"/> Thinking...
                             </div>
                         </div>
                     )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t p-3 bg-background">
                <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask the NeuroForge AI Tutor..."
                    className="flex-1 resize-none border rounded-md p-2 text-sm focus-visible:ring-1 focus-visible:ring-ring"
                    rows={1}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="sr-only">Send message</span>
                </Button>
            </form>
        </div>
    );
}