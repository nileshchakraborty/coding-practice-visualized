/**
 * LoginButton - Google OAuth login/logout button
 * Shows sign in button when logged out, user avatar with dropdown when logged in
 * Responsive design for mobile, tablet, and desktop
 */
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, LogOut, User, ChevronDown } from 'lucide-react';

export const LoginButton: React.FC = () => {
    const { user, isAuthenticated, isLoading, login, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
                        <p className="font-semibold text-sm sm:text-base text-slate-800 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <button
                        onClick={() => {
                            logout();
                            setShowDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={14} className="sm:w-4 sm:h-4" />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

export default LoginButton;
