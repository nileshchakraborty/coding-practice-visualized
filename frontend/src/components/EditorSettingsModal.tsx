import React from 'react';
import { X, Type, Keyboard, Box, Check } from 'lucide-react';
import type { EditorSettings } from '../hooks/useEditorSettings';

interface EditorSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: EditorSettings;
    onUpdate: <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => void;
}

export const EditorSettingsModal: React.FC<EditorSettingsModalProps> = ({ isOpen, onClose, settings, onUpdate }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Editor Settings</h2>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Font Size */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                            <Type size={16} /> Font Size
                        </div>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="12"
                                max="24"
                                step="1"
                                value={settings.fontSize}
                                onChange={(e) => onUpdate('fontSize', parseInt(e.target.value))}
                                className="flex-1 w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <span className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md min-w-[3rem] text-center">
                                {settings.fontSize}px
                            </span>
                        </div>
                    </div>

                    {/* Keybinding */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                            <Keyboard size={16} /> Key Binding
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {(['standard', 'vim'] as const).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => onUpdate('keybinding', mode)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${settings.keybinding === mode
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <span className="capitalize">{mode}</span>
                                    {settings.keybinding === mode && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Theme */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                            <Box size={16} /> Theme
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { id: 'vs-dark', label: 'Dark+' },
                                { id: 'light', label: 'Light' },
                                { id: 'monokai', label: 'Monokai' },
                                { id: 'github-dark', label: 'GitHub' }
                            ].map(theme => (
                                <button
                                    key={theme.id}
                                    onClick={() => onUpdate('theme', theme.id as any)}
                                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-all text-center border ${settings.theme === theme.id
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {theme.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-500">Settings are saved automatically</p>
                </div>
            </div>
        </div>
    );
};
