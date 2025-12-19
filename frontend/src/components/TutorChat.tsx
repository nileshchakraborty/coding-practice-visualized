import React, { useState, useRef, useEffect } from 'react';

import { TutorAPI } from '../models/api';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface TutorChatProps {
    slug: string;
    problemTitle: string;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const TutorChat: React.FC<TutorChatProps> = ({ slug, messages, setMessages }) => {
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMsg = inputValue.trim();
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            // Prepare history for API (excluding the initial greeting if it wasn't from API context, but let's keep it simple)
            // The backend expects specific history format.
            // We'll send the conversation excluding the very last user message which is 'message' param
            // actually, let's send previous messages as history.

            const history = messages.map(m => ({ role: m.role, content: m.content }));


            // Use Centralized API
            const res = await TutorAPI.chat(slug, userMsg, history);

            if (res.response) {
                setMessages(prev => [...prev, { role: 'assistant', content: res.response || '' }]);
            } else if (res.error) {
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${res.error}` }]);
            }
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't reach the AI server." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Helper to render markdown-like content (simple approach for now)
    const renderContent = (content: string) => {
        // Split by code blocks
        const parts = content.split(/(```[\s\S]*?```)/g);

        return parts.map((part, index) => {
            if (part.startsWith('```')) {
                const match = part.match(/```(\w*)\n([\s\S]*)```/);
                const language = match ? match[1] : 'text';
                const code = match ? match[2] : part.slice(3, -3);

                return (
                    <div key={index} className="my-2 rounded-md overflow-hidden text-xs">
                        <SyntaxHighlighter language={language} style={vscDarkPlus} PreTag="div">
                            {code.trim()}
                        </SyntaxHighlighter>
                    </div>
                );
            }
            // Basic bold/italic parsing could go here, or just whitespace
            return <div key={index} className="whitespace-pre-wrap">{part}</div>;
        });
    };

    return (
        <div className="flex flex-col h-full bg-[#0d0d15] rounded-xl border border-slate-700 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-emerald-600'
                            }`}>
                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>

                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                            }`}>
                            {renderContent(msg.content)}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                            <Bot size={16} />
                        </div>
                        <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-700">
                            <Loader2 size={20} className="animate-spin text-emerald-400" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#16162a] border-t border-slate-700">
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Ask a question..."
                        rows={1}
                        className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none py-2"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">
                    AI can be inaccurate. Check important info.
                </p>
            </div>
        </div>
    );
};

export default TutorChat;
