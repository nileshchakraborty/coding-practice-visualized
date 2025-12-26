import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Check, LogOut } from 'lucide-react';
import React from 'react';

interface ConsentModalProps {
    isOpen: boolean;
    title: string;
    content: string;
    summary: string;
    version: string;
    isLoading: boolean;
    onAccept: () => void;
    onDecline: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
    isOpen,
    title,
    content,
    summary,
    version,
    isLoading,
    onAccept,
    onDecline
}) => {
    // Simple parser for bold text (**text**) and bullet points
    const formatContent = (text: string) => {
        return text.split('\n').map((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={index} className="h-4" />;

            // Helper to parse formatting within a line
            const parseLine = (str: string) => {
                const parts = str.split(/(\*\*.*?\*\*)/g);
                return parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="font-bold text-slate-800 dark:text-slate-100">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                });
            };

            // Bullet points
            const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('* ');
            if (isBullet) {
                const content = trimmed.replace(/^[•\-*]\s*/, '');
                return (
                    <div key={index} className="flex items-start gap-3 mb-2 pl-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {parseLine(content)}
                        </p>
                    </div>
                );
            }

            // Regular paragraphs
            return (
                <p key={index} className="mb-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                    {parseLine(trimmed)}
                </p>
            );
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ring-1 ring-white/10"
                    >
                        {/* Gradient Top Border */}
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                        {/* Header */}
                        <div className="p-8 pb-4 flex items-start gap-5">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl">
                                <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" strokeWidth={2} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                        {title || 'Activity Tracking Consent'}
                                    </h2>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    Version {version} • Mandatory Update
                                </p>
                            </div>
                        </div>

                        {/* Summary Alert */}
                        {summary && (
                            <div className="mx-8 mt-2 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-xl flex gap-3">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-500" />
                                <div className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                                    {summary}
                                </div>
                            </div>
                        )}

                        {/* Content Scroll Area */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
                            <div className="prose prose-slate dark:prose-invert max-w-none text-sm">
                                {content ? formatContent(content) : (
                                    <div className="flex flex-col gap-3 animate-pulse">
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-sm border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-center gap-4">
                            <button
                                onClick={onDecline}
                                className="group flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                                <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                                Decline & Logout
                            </button>
                            <button
                                onClick={onAccept}
                                disabled={isLoading}
                                className="relative overflow-hidden flex items-center gap-2 px-8 py-3 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Processing...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Check size={18} strokeWidth={3} />
                                        I Accept Terms
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
