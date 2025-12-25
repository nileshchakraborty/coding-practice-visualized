/**
 * useTutor ViewModel
 * Manages AI tutor chat state
 */
import { useState, useCallback } from 'react';
import { TutorAPI } from '../models';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface TutorState {
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
}

export function useTutor(slug: string | null) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = useCallback(async (content: string) => {
        if (!slug || !content.trim()) return;

        // Add user message
        const userMessage: ChatMessage = { role: 'user', content };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);

        try {
            setIsLoading(true);
            setError(null);

            const response = await TutorAPI.chat(slug, content, newMessages);

            if (response.error) {
                setError(response.error);
            } else if (response.response) {
                const assistantMessage: ChatMessage = {
                    role: 'assistant',
                    content: response.response
                };
                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message');
        } finally {
            setIsLoading(false);
        }
    }, [slug, messages]);

    const clearChat = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    return {
        // State
        messages,
        isLoading,
        error,

        // Derived
        hasMessages: messages.length > 0,
        lastMessage: messages[messages.length - 1] || null,

        // Actions
        sendMessage,
        clearChat,
    };
}

export type TutorViewModel = ReturnType<typeof useTutor>;
