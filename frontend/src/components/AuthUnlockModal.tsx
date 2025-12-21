import React from 'react';
import { Sparkles, Lock, X, CheckCircle2 } from 'lucide-react';

interface AuthUnlockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: () => void;
    featureName: string; // e.g., "AI Tutor" or "Code Execution"
}

export const AuthUnlockModal: React.FC<AuthUnlockModalProps> = ({ isOpen, onClose, onLogin, featureName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {/* Hero Section */}
                <div className="relative h-32 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                        <Lock size={32} className="text-white" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Unlock {featureName}
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Sign in to access powerful features and track your progress.
                        </p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                            <span>Unlimited Code Execution & Test Results</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                            <span>Personalized AI Tutor Assistance</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                            <span>Save Progress & Submission History</span>
                        </div>
                    </div>

                    <button
                        onClick={onLogin}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Sparkles size={18} />
                        Sign In with Google
                    </button>

                    <p className="mt-4 text-xs text-center text-slate-500 dark:text-slate-500">
                        Join thousands of developers mastering algorithms.
                    </p>
                </div>
            </div>
        </div>
    );
};
