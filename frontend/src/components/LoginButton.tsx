/**
 * LoginButton - Google OAuth login/logout button
 * Shows sign in button when logged out, user avatar with dropdown when logged in
 * Includes settings for resetting progress data
 */
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogIn, LogOut, User, ChevronDown, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { SyncService } from '../services/SyncService';

export const LoginButton: React.FC = () => {
    const { user, isAuthenticated, isLoading, login, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'resetStats' | 'resetAll' | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
                setConfirmAction(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleResetStats = () => {
        SyncService.resetStats();
        setConfirmAction(null);
        setShowDropdown(false);
        // Event is dispatched by SyncService.saveLocalProgress - no reload needed
    };

    const handleResetAll = () => {
        SyncService.resetAll();
        setConfirmAction(null);
        setShowDropdown(false);
        // Event is dispatched by SyncService.saveLocalProgress - no reload needed
    };

    if (isLoading) {
        return (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
        );
    }

    if (!isAuthenticated) {
        return (
            <button
                onClick={login}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95"
            >
                <LogIn size={14} className="sm:w-4 sm:h-4" />
                <span>Sign In</span>
            </button>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
            >
                {user?.picture ? (
                    <img
                        src={user.picture}
                        alt={user.name}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-indigo-500/50 group-hover:border-indigo-500 transition-colors"
                    />
                ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                        <User size={14} className="sm:w-4 sm:h-4" />
                    </div>
                )}
                {/* Show name on larger screens */}
                <span className="hidden lg:block text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                    {user?.name?.split(' ')[0]}
                </span>
                <ChevronDown size={14} className="hidden lg:block text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors" />
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Info */}
                    <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
                        <p className="font-semibold text-sm sm:text-base text-slate-800 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                    </div>

                    {/* Settings Section */}
                    <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                        <p className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Settings</p>

                        {/* Reset Stats Button */}
                        {confirmAction === 'resetStats' ? (
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg mx-1 my-1">
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                                    <AlertTriangle size={14} />
                                    <span className="text-xs font-medium">Reset solved count?</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleResetStats}
                                        className="flex-1 px-2 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                                    >
                                        Yes, Reset
                                    </button>
                                    <button
                                        onClick={() => setConfirmAction(null)}
                                        className="flex-1 px-2 py-1.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirmAction('resetStats')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                            >
                                <RotateCcw size={14} />
                                <div className="text-left">
                                    <div className="font-medium">Reset Stats</div>
                                    <div className="text-[10px] text-slate-400">Clear solved & in-progress</div>
                                </div>
                            </button>
                        )}

                        {/* Clear All Data Button */}
                        {confirmAction === 'resetAll' ? (
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg mx-1 my-1">
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                                    <AlertTriangle size={14} />
                                    <span className="text-xs font-medium">Delete all data?</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleResetAll}
                                        className="flex-1 px-2 py-1.5 text-xs font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                    >
                                        Yes, Delete
                                    </button>
                                    <button
                                        onClick={() => setConfirmAction(null)}
                                        className="flex-1 px-2 py-1.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirmAction('resetAll')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs sm:text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <Trash2 size={14} />
                                <div className="text-left">
                                    <div className="font-medium">Clear All Data</div>
                                    <div className="text-[10px] text-red-400/70">Remove all progress & drafts</div>
                                </div>
                            </button>
                        )}
                    </div>

                    {/* Sign Out */}
                    <button
                        onClick={() => {
                            logout();
                            setShowDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

export default LoginButton;

