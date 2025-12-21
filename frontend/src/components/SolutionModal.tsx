import React, { useState, useRef, useEffect } from 'react';
import type { Solution, TestCaseResult } from '../types';
import { PlaygroundAPI } from '../models/api';
import SmartVisualizer from './SmartVisualizer';
import TutorChat from './TutorChat';
import { AuthUnlockModal } from './AuthUnlockModal';
import {
    X,
    Play,
    MessageCircle,
    Code as CodeIcon,
    Volume2,
    Square,
    AlertTriangle,
    CheckCircle2,
    Copy,
    ExternalLink,
    Terminal,
    Youtube,
    FileText,
    BookOpen,
    Trash2,
    Plus,
    Settings
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import type { editor } from 'monaco-editor';
import Editor from '@monaco-editor/react';
import { useAuth } from '../hooks/useAuth';
import { useProgress } from '../hooks/useProgress';
import { useEditorSettings } from '../hooks/useEditorSettings';
import { EditorSettingsModal } from './EditorSettingsModal';
import { initVimMode, type VimMode } from 'monaco-vim';

interface SolutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    solution: Solution | null;
    slug: string | null;
}

const SolutionModal: React.FC<SolutionModalProps> = ({ isOpen, onClose, solution, slug }) => {
    const [activeTab, setActiveTab] = useState<'problem' | 'explanation' | 'playground' | 'tutor'>('problem');
    const [activeApproach, setActiveApproach] = useState<'bruteforce' | 'optimal'>('optimal');
    const [language, setLanguage] = useState<'python' | 'javascript' | 'java' | 'go' | 'rust' | 'cpp'>('python');
    const [code, setCode] = useState(solution?.code || '');

    // Auth state for feature gating
    const { isAuthenticated, login } = useAuth();

    // Progress tracking
    const { markSolved, saveDraft, getDraft, isSolved } = useProgress();
    const [isProblemSolved, setIsProblemSolved] = useState(false);

    // Ref for scrollable content container
    const contentRef = useRef<HTMLDivElement>(null);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    // Single Custom Test Case State (editable, temporary)
    const [customTestCase, setCustomTestCase] = useState<{ input: string; output: string } | null>(null);

    // Tutor Chat State (persisted across tab switches)
    const [tutorMessages, setTutorMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

    // Responsive state
    const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Helper function to convert Python starter template to other languages
    const convertToLanguage = (pythonCode: string, targetLang: string): string => {
        // Extract function name and params from Python def
        const defMatch = pythonCode.match(/def\s+(\w+)\s*\(([^)]*)\)/);
        if (!defMatch) return pythonCode;

        const funcName = defMatch[1];
        const params = defMatch[2].split(',').map(p => p.trim().split(':')[0].trim()).filter(Boolean);

        switch (targetLang) {
            case 'javascript':
                return `/**\n * @param {${params.map(() => 'any').join(', ')}} ${params.join(', ')}\n * @return {any}\n */\nvar ${funcName} = function(${params.join(', ')}) {\n    // Your code here\n};`;
            case 'java':
                return `class Solution {\n    public int ${funcName}(${params.map(p => `int ${p}`).join(', ')}) {\n        // Your code here\n        return 0;\n    }\n}`;
            case 'cpp':
                return `class Solution {\npublic:\n    int ${funcName}(${params.map(p => `int ${p}`).join(', ')}) {\n        // Your code here\n        return 0;\n    }\n};`;
            case 'go':
                return `func ${funcName}(${params.map(p => `${p} int`).join(', ')}) int {\n    // Your code here\n    return 0\n}`;
            case 'rust':
                return `impl Solution {\n    pub fn ${funcName.replace(/([A-Z])/g, '_$1').toLowerCase()}(${params.map(p => `${p}: i32`).join(', ')}) -> i32 {\n        // Your code here\n        0\n    }\n}`;
            default:
                return pythonCode;
        }
    };

    // Update code when language changes (only if no user edits / draft exists)
    React.useEffect(() => {
        if (solution && slug && language !== 'python') {
            const savedDraft = getDraft(`${slug}_${language}`);
            if (savedDraft) {
                setCode(savedDraft);
            } else {
                // Convert Python template to target language
                const rawCode = solution.initialCode || solution.code || '';
                const converted = convertToLanguage(rawCode.replace(/\\n/g, '\n'), language);
                setCode(converted);
            }
        } else if (solution && slug && language === 'python') {
            const savedDraft = getDraft(slug);
            if (savedDraft) {
                setCode(savedDraft);
            } else {
                const rawCode = solution.initialCode || solution.code || '';
                setCode(rawCode.replace(/\\n/g, '\n'));
            }
        }
    }, [language, solution, slug, getDraft]);

    React.useEffect(() => {
        if (solution && slug) {
            // Check for saved draft first (from SyncService)
            const savedDraft = getDraft(slug);

            if (savedDraft) {
                setCode(savedDraft);
            } else {
                // Use skeleton code (initialCode) if available, otherwise full code
                const rawCode = solution.initialCode || solution.code || '';
                const formattedCode = rawCode.replace(/\\n/g, '\n');
                setCode(formattedCode);
            }
            setOutput('');

            // Check if problem is already solved
            setIsProblemSolved(isSolved(slug));
        }
    }, [solution, slug, getDraft, isSolved]);

    // Persist code changes as draft (Debounced)
    React.useEffect(() => {
        if (!slug) return;

        const timer = setTimeout(() => {
            saveDraft(slug, code);
        }, 1000);

        return () => clearTimeout(timer);
    }, [code, slug, saveDraft]);

    // Initialize tutor greeting when solution changes
    React.useEffect(() => {
        if (solution?.title) {
            setTutorMessages([{
                role: 'assistant',
                content: `Hi! I'm your AI Tutor. I can help you understand **${solution.title}**. Ask me about the brute force approach, time complexity, or for a hint!`
            }]);
        }
    }, [solution?.title]);

    // Reset state when problem changes (Navigation)
    React.useEffect(() => {
        setActiveTab('problem');
        setSpeakingSection(null);
        window.speechSynthesis.cancel();
    }, [slug]);

    // Reset scroll position when tab changes
    useEffect(() => {
        // Use requestAnimationFrame to ensure DOM is updated before scrolling
        requestAnimationFrame(() => {
            if (contentRef.current) {
                contentRef.current.scrollTop = 0;
            }
        });
    }, [activeTab]);

    const handleRunCode = async () => {
        if (!slug) return;
        setIsRunning(true);
        setOutput('Running code...');
        try {

            // Combine built-in and custom test cases
            const allTestCases = [...(solution?.testCases || [])];
            if (customTestCase) {
                allTestCases.push(customTestCase);
            }

            const res = await PlaygroundAPI.runCode(code, slug, allTestCases.length > 0 ? allTestCases : undefined, language);

            if (res.success) {
                // Determine logic based on runner response structure
                // Runner returns { results: [...], success: bool }
                // Let's format it nicel
                if (res.results) {
                    const allPassed = res.results.every((r: TestCaseResult) => r.passed);
                    const outputMsg = res.results.map((r: TestCaseResult, i: number) => {
                        if (r.error) {
                            return `Test Case ${i + 1}: ERROR ⚠️\nInput: ${r.input}\nError: ${r.error}\n`;
                        }
                        return `Test Case ${i + 1}: ${r.passed ? 'PASSED ✅' : 'FAILED ❌'}\nInput: ${r.input}\nExpected: ${r.expected}\nActual: ${r.actual}\n`;
                    }).join('\n-------------------\n');

                    setOutput(allPassed ? `All Test Cases Passed! 🎉\n\n${outputMsg}` : `Some Tests Failed.\n\n${outputMsg}`);

                    // Mark as solved if all tests passed
                    if (allPassed && slug) {
                        markSolved(slug, code);
                        setIsProblemSolved(true);
                    }
                } else if (res.error) {
                    setOutput(`Error: ${res.error}`);
                } else {
                    setOutput(JSON.stringify(res, null, 2));
                }
            } else {
                setOutput(`Execution Failed:\n${res.error || 'Unknown error'}`);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setOutput(`Network Error: ${errorMessage}`);
        } finally {
            setIsRunning(false);
        }
    };



    // Auth Modal State
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authFeatureName, setAuthFeatureName] = useState('');

    const openAuthModal = (feature: string) => {
        setAuthFeatureName(feature);
        setShowAuthModal(true);
    };

    const [speakingSection, setSpeakingSection] = useState<string | null>(null);

    // Editor Settings
    const { settings, updateSetting } = useEditorSettings();
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const vimModeRef = useRef<VimMode | null>(null);

    useEffect(() => {
        if (!editorRef.current) return;

        const disposeVim = () => {
            if (vimModeRef.current) {
                vimModeRef.current.dispose();
                vimModeRef.current = null;
            }
        };

        if (settings.keybinding === 'vim') {
            // Initialize Vim Mode
            // Note: initVimMode attaches to the editor instance and a status bar element
            // We need a status bar ref for this to work perfectly, or pass null
            const statusBar = document.getElementById('vim-status-bar');
            disposeVim();
            try {
                vimModeRef.current = initVimMode(editorRef.current, statusBar);
            } catch (e) {
                console.warn("Failed to init Vim mode", e);
            }
        } else {
            disposeVim();
        }

        return disposeVim;
    }, [settings.keybinding]);

    const handleEditorMount = (editor: editor.IStandaloneCodeEditor) => {
        editorRef.current = editor;
    };
    React.useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
            setSpeakingSection(null);
        };
    }, [activeTab, isOpen]);

    const handleSpeak = (text: string, section: string) => {
        if (!solution || !text) return;

        if (speakingSection === section) {
            window.speechSynthesis.cancel();
            setSpeakingSection(null);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => setSpeakingSection(null);
        utterance.onerror = () => setSpeakingSection(null);

        window.speechSynthesis.speak(utterance);
        setSpeakingSection(section);
    };

    if (!isOpen || !solution) return null;

    // ==================== RENDER FUNCTIONS ====================

    // Render the Problem Tab Content
    const renderProblemTab = () => (
        <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-4 duration-300">
            {/* Problem Description */}
            <div className="space-y-3 sm:space-y-4">
                <h3 className="text-xs sm:text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                    📋 Problem Description
                </h3>
                <div className="p-4 sm:p-6 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                    <p className="text-slate-700 dark:text-slate-200 text-sm sm:text-lg leading-relaxed whitespace-pre-line">
                        {solution.problemStatement || solution.description || 'No description available.'}
                    </p>
                </div>
            </div>

            {/* Examples */}
            <div className="space-y-4">
                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                    🧪 Examples
                </h3>
                <div className="space-y-3">
                    {(solution.examples || solution.testCases || []).map((ex, i) => (
                        <div key={i} className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 rounded">
                                    Example {i + 1}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-xs uppercase text-slate-500 font-semibold">Input:</span>
                                    <pre className="mt-1 p-3 bg-slate-200 dark:bg-slate-900 rounded-lg text-sm text-cyan-600 dark:text-cyan-300 overflow-x-auto">
                                        <code>{ex.input}</code>
                                    </pre>
                                </div>
                                <div>
                                    <span className="text-xs uppercase text-slate-500 font-semibold">Output:</span>
                                    <pre className="mt-1 p-3 bg-slate-200 dark:bg-slate-900 rounded-lg text-sm text-emerald-600 dark:text-emerald-300 overflow-x-auto">
                                        <code>{ex.output}</code>
                                    </pre>
                                </div>
                                {'explanation' in ex && typeof (ex as { explanation?: string }).explanation === 'string' && (
                                    <div>
                                        <span className="text-xs uppercase text-slate-500 font-semibold">Explanation:</span>
                                        <p className="mt-1 text-slate-600 dark:text-slate-300 text-sm">{(ex as { explanation: string }).explanation}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Constraints */}
            {solution.constraints && solution.constraints.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                        📏 Constraints
                    </h3>
                    <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                        <ul className="space-y-1">
                            {solution.constraints.map((c, i) => (
                                <li key={i} className="text-slate-600 dark:text-slate-300 font-mono text-sm flex items-start gap-2">
                                    <span className="text-indigo-500 dark:text-indigo-400">•</span> {c}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Hints (Collapsible) */}
            {solution.hints && solution.hints.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                        💡 Hints
                    </h3>
                    <div className="space-y-2">
                        {solution.hints.map((hint, i) => (
                            <details key={i} className="group">
                                <summary className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 cursor-pointer hover:bg-amber-500/20 transition-colors">
                                    <span className="ml-2 font-medium">Hint {i + 1}</span>
                                </summary>
                                <div className="mt-2 p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300">
                                    {hint}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            )}

            {/* Complexity Analysis */}
            <div className="space-y-3 sm:space-y-4">
                <h3 className="text-xs sm:text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                    ⚡ Complexity Analysis
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                        <div className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-semibold mb-1">Time Complexity</div>
                        <div className="text-lg sm:text-xl text-slate-800 dark:text-white font-mono">{solution.timeComplexity || 'N/A'}</div>
                    </div>
                    <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30">
                        <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-semibold mb-1">Space Complexity</div>
                        <div className="text-lg sm:text-xl text-slate-800 dark:text-white font-mono">{solution.spaceComplexity || 'N/A'}</div>
                    </div>
                </div>
            </div>

            {/* Key Insight */}
            {solution.keyInsight && (
                <div className="p-6 rounded-xl border-l-4 border-amber-500 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                    <h3 className="text-lg font-semibold text-amber-600 dark:text-amber-300 mb-1">🔑 Key Insight</h3>
                    <p className="text-slate-700 dark:text-slate-200 text-lg leading-relaxed">{solution.keyInsight}</p>
                </div>
            )}

            {/* Related Problems */}
            {solution.relatedProblems && solution.relatedProblems.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                        🔗 Related Problems
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {solution.relatedProblems.map((related, i) => (
                            <span
                                key={i}
                                onClick={() => window.location.href = `/problem/${related}`}
                                className="px-3 py-1.5 text-sm bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded-full hover:bg-indigo-500/30 transition-colors cursor-pointer"
                            >
                                {related.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* External Resources */}
            <div className="space-y-3 sm:space-y-4">
                <h3 className="text-xs sm:text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                    📚 External Resources
                </h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                    {slug && (
                        <>
                            <a
                                href={`https://leetcode.com/problems/${slug}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-[#ffa116]/10 text-[#ffa116] border border-[#ffa116]/30 hover:bg-[#ffa116]/20 transition-colors text-xs sm:text-sm font-medium"
                            >
                                <CodeIcon size={14} /> LeetCode
                            </a>
                            <a
                                href={solution.neetcodeLink || `https://neetcode.io/problems/${slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors text-xs sm:text-sm font-medium"
                            >
                                <Terminal size={14} /> NeetCode
                            </a>
                        </>
                    )}
                    {solution.videoId && (
                        <a
                            href={`https://www.youtube.com/watch?v=${solution.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors text-xs sm:text-sm font-medium"
                        >
                            <Youtube size={14} /> Video
                        </a>
                    )}
                    {solution.takeuforwardLink && (
                        <a
                            href={solution.takeuforwardLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/30 hover:bg-pink-500/20 transition-colors text-xs sm:text-sm font-medium"
                        >
                            <FileText size={14} /> TakeUForward
                        </a>
                    )}
                </div>
            </div>
        </div>
    );

    // Render the Explanation Tab Content
    const renderExplanationTab = () => (
        <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-4 duration-300">


            {/* 1. YouTube Video (First) */}
            {solution.videoId && (
                <div className="space-y-4">
                    <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                        <Youtube size={16} /> Video Explanation
                    </h3>
                    <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${solution.videoId}`}
                            title="Solution Video"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}

            {/* 2. Approach Toggle (Brute Force / Optimal) */}
            <div className="space-y-4">
                <div className="flex items-center gap-4 p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
                    <button
                        onClick={() => setActiveApproach('bruteforce')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeApproach === 'bruteforce' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                        Brute Force
                    </button>
                    <button
                        onClick={() => setActiveApproach('optimal')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeApproach === 'optimal' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                        Optimal
                    </button>
                </div>
            </div>

            {/* 3. Quick Summary */}
            <div className="p-6 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30">
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-300">💬 Quick Summary</h3>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSpeak(solution.oneliner, 'summary');
                        }}
                        className="p-1.5 rounded-full hover:bg-white/50 dark:hover:bg-slate-800/50 text-indigo-600 dark:text-indigo-400 transition-colors"
                        title={speakingSection === 'summary' ? "Stop speaking" : "Read summary"}
                    >
                        {speakingSection === 'summary' ? <Square size={16} /> : <Volume2 size={16} />}
                    </button>
                </div>
                <p className="text-slate-700 dark:text-slate-200 text-lg leading-relaxed">{solution.oneliner}</p>
            </div>

            {/* 4. Core Intuition (Approach-Specific) */}
            {activeApproach === 'bruteforce' ? (
                <div className="space-y-6">
                    {/* Brute Force Complexity */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle size={18} className="text-orange-500" />
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-orange-600 dark:text-orange-400">Naive/Brute Force Approach</h4>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSpeak((solution.bruteForceIntuition || []).join('. '), 'bruteForce');
                                    }}
                                    className="p-1 rounded-full hover:bg-orange-200 dark:hover:bg-orange-800/50 text-orange-600 dark:text-orange-400 transition-colors"
                                    title={speakingSection === 'bruteForce' ? "Stop speaking" : "Read intuition"}
                                >
                                    {speakingSection === 'bruteForce' ? <Square size={14} /> : <Volume2 size={14} />}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                                <div className="text-xs text-slate-500 font-semibold">Time Complexity</div>
                                <div className="text-lg font-mono text-orange-600 dark:text-orange-400">{solution.bruteForceTimeComplexity || 'O(n²)'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 font-semibold">Space Complexity</div>
                                <div className="text-lg font-mono text-orange-600 dark:text-orange-400">{solution.bruteForceSpaceComplexity || 'O(1)'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Brute Force Intuition */}
                    <div className="space-y-4">
                        <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                            🔨 Brute Force Intuition
                        </h3>
                        {solution.bruteForceIntuition && solution.bruteForceIntuition.length > 0 ? (
                            <div className="space-y-3">
                                {solution.bruteForceIntuition.map((step, idx) => (
                                    <div key={idx} className="flex gap-4 p-4 bg-orange-50 dark:bg-orange-500/10 rounded-xl border border-orange-200 dark:border-orange-500/30">
                                        <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold shrink-0">
                                            {idx + 1}
                                        </div>
                                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{step}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center">
                                <p className="text-slate-600 dark:text-slate-400 mb-2">The naive approach typically involves:</p>
                                <ul className="text-left inline-block text-slate-600 dark:text-slate-300 space-y-2">
                                    <li className="flex items-start gap-2"><span className="text-orange-500">•</span> Nested loops to check all possible combinations</li>
                                    <li className="flex items-start gap-2"><span className="text-orange-500">•</span> O(n²) or O(n³) time complexity</li>
                                    <li className="flex items-start gap-2"><span className="text-orange-500">•</span> Simple but inefficient for large inputs</li>
                                </ul>
                                <p className="text-slate-500 dark:text-slate-500 text-sm mt-4">Switch to Optimal to see the efficient solution!</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Optimal Core Intuition Steps */
                <div className="space-y-4">
                    <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                        🧠 Core Intuition
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSpeak((solution.intuition || []).join('. '), 'optimal');
                            }}
                            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                            title={speakingSection === 'optimal' ? "Stop speaking" : "Read intuition"}
                        >
                            {speakingSection === 'optimal' ? <Square size={14} /> : <Volume2 size={14} />}
                        </button>
                    </h3>
                    <div className="space-y-3">
                        {(solution.intuition || []).map((step, idx) => (
                            <div key={idx} className="flex gap-4 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
                                    {idx + 1}
                                </div>
                                <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 5. Visualization */}
            {(solution.visualizationType || solution.animationSteps?.length) && (
                <div className="space-y-4">
                    <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                        🎬 Visualization
                    </h3>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800/50">
                        <SmartVisualizer solution={solution} />
                    </div>
                </div>
            )}

            {/* 6. Code Solution */}
            {(() => {
                const displayCode = (activeApproach === 'optimal' ? solution.code : solution.bruteForceCode) || solution.code || '';
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                                💻 {activeApproach === 'optimal' ? 'Optimal' : 'Brute Force'} Code
                            </h3>
                            <button
                                onClick={() => {
                                    setCode(displayCode.replace(/\\n/g, '\n'));
                                    // Only switch to playground tab on mobile (where it's a separate tab)
                                    // On desktop, the playground is always visible on the right side
                                    if (window.innerWidth < 1024) {
                                        setActiveTab('playground');
                                    }
                                }}
                                className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                <Copy size={12} /> Copy to Playground
                            </button>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                            <SyntaxHighlighter
                                language="python"
                                style={vscDarkPlus}
                                customStyle={{ margin: 0, padding: '1rem', fontSize: '0.8rem' }}
                            >
                                {displayCode}
                            </SyntaxHighlighter>
                        </div>
                    </div>
                );
            })()}

            {/* 7. External Resources (without TakeUForward) */}
            <div className="space-y-4 pt-4 border-t border-slate-700/50">
                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                    <ExternalLink size={16} /> External Resources
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {slug && (
                        <a
                            href={`https://leetcode.com/problems/${slug}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#ffa116]/10 flex items-center justify-center text-[#ffa116]">
                                    <CodeIcon size={20} />
                                </div>
                                <div>
                                    <div className="font-semibold text-white group-hover:text-indigo-400 transition-colors">LeetCode</div>
                                    <div className="text-xs text-slate-500">View Problem Statement</div>
                                </div>
                            </div>
                            <ExternalLink size={16} className="text-slate-500 group-hover:text-[#ffa116]" />
                        </a>
                    )}

                    {(solution.neetcodeLink || slug) && (
                        <a
                            href={solution.neetcodeLink || `https://neetcode.io/problems/${slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <Terminal size={20} />
                                </div>
                                <div>
                                    <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors">NeetCode.io</div>
                                    <div className="text-xs text-slate-500">Video & Solution</div>
                                </div>
                            </div>
                            <ExternalLink size={16} className="text-slate-500 group-hover:text-emerald-500" />
                        </a>
                    )}

                    {solution.videoId && (
                        <a
                            href={`https://www.youtube.com/watch?v=${solution.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-red-500/50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                    <Youtube size={20} />
                                </div>
                                <div>
                                    <div className="font-semibold text-white group-hover:text-red-400 transition-colors">Video Explanation</div>
                                    <div className="text-xs text-slate-500">Watch on YouTube</div>
                                </div>
                            </div>
                            <ExternalLink size={16} className="text-slate-500 group-hover:text-red-500" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );

    // Render Tutor Tab
    const renderTutorTab = () => (
        <div className="h-full animate-in slide-in-from-bottom-4 duration-300">
            {!isAuthenticated ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <MessageCircle size={48} className="text-slate-400 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">AI Tutor</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">Start a conversation to get hints and explanations.</p>
                    <button
                        onClick={() => openAuthModal('AI Tutor')}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                    >
                        <MessageCircle size={16} />
                        Start Chat
                    </button>
                </div>
            ) : slug && solution ? (
                <TutorChat
                    slug={slug}
                    problemTitle={solution.title}
                    messages={tutorMessages}
                    setMessages={setTutorMessages}
                />
            ) : (
                <div className="text-center text-slate-500 mt-10">Tutor unavailable without a valid problem.</div>
            )}
        </div>
    );

    // Render Playground Tab (Code Editor + Test Runner)
    const renderPlaygroundTab = () => (
        <div className="h-full min-h-[400px] flex flex-col gap-3 animate-in slide-in-from-bottom-4 duration-300">
            {/* Code Editor */}
            <div className="flex-1 bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden relative group min-h-[200px]">
                <div className="absolute top-0 left-0 right-0 px-3 sm:px-4 py-2 bg-slate-800 border-b border-slate-700 text-xs text-slate-400 font-mono flex justify-between items-center z-10">
                    <div className="flex items-center gap-4">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as 'python' | 'javascript' | 'java')}
                            className="bg-slate-700 text-slate-200 text-xs border border-slate-600 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                        >
                            <option value="python">Python</option>
                            <option value="javascript">JavaScript</option>
                            {import.meta.env.VITE_ENABLE_EXPERIMENTAL_LANGUAGES === 'true' && (
                                <>
                                    <option value="java">Java</option>
                                    <option value="go">Go</option>
                                    <option value="rust">Rust</option>
                                    <option value="cpp">C++</option>
                                </>
                            )}
                        </select>
                        <span>{language === 'python' ? 'main.py' : language === 'javascript' ? 'main.js' : language === 'java' ? 'Solution.java' : language === 'go' ? 'main.go' : language === 'rust' ? 'solution.rs' : 'solution.cpp'}</span>
                        <div id="vim-status-bar" className="flex-1 min-w-[200px]"></div>
                    </div>
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-500 hover:text-slate-300"
                        title="Editor Settings"
                    >
                        <Settings size={14} />
                    </button>
                </div>
                <div className="absolute inset-0 top-[37px] w-full">
                    <Editor
                        height="100%"
                        language={language}
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        theme={settings.theme}
                        onMount={handleEditorMount}
                        options={{
                            minimap: { enabled: false },
                            fontSize: settings.fontSize,
                            tabSize: settings.tabSize,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 10 },
                            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                            renderLineHighlight: 'none',
                            hideCursorInOverviewRuler: true,
                            overviewRulerBorder: false,
                            wordWrap: 'on',
                            scrollbar: {
                                vertical: 'auto',
                                horizontal: 'auto'
                            }
                        }}
                        loading={<div className="text-slate-500 p-4 text-sm">Loading Editor...</div>}
                    />
                </div>
            </div>

            {/* Run Button Bar */}
            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-mono pl-2">
                    {solution.testCases?.length || 0} Tests
                </span>
                <button
                    onClick={isAuthenticated ? handleRunCode : () => openAuthModal('Code Execution')}
                    disabled={isAuthenticated && isRunning}
                    className={`px-4 sm:px-6 py-2 font-semibold rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 text-sm ${isAuthenticated && isRunning ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed text-slate-300 dark:text-slate-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                >
                    <Play size={14} /> {isAuthenticated && isRunning ? 'Running...' : 'Run'}
                </button>
            </div>

            {/* Test Cases & Output Area */}
            <div className="flex-1 min-h-[150px] bg-slate-100 dark:bg-black rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                {/* Test Cases List */}
                <div className="max-h-[120px] border-b border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900 overflow-y-auto custom-scrollbar">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Test Cases</h4>

                    <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:gap-3">
                        {/* Built-in Test Cases */}
                        {solution.testCases?.map((testCase, i) => (
                            <div key={`builtin-${i}`} className="flex-shrink-0 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 min-w-[150px]">
                                <div className="text-xs text-slate-500 mb-1 font-mono">Test {i + 1}</div>
                                <div className="text-xs text-indigo-600 dark:text-indigo-300 font-mono truncate">{testCase.input}</div>
                                <div className="text-xs text-emerald-600 dark:text-emerald-300 font-mono truncate mt-1">→ {testCase.output}</div>
                            </div>
                        ))}

                        {/* Custom Test Case */}
                        <div className="flex-shrink-0 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 min-w-[150px]">
                            <div className="flex justify-between items-center mb-1">
                                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">Custom</div>
                                {customTestCase ? (
                                    <button
                                        onClick={() => setCustomTestCase(null)}
                                        className="p-0.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                        title="Remove custom test"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCustomTestCase({ input: '', output: '' })}
                                        className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                                    >
                                        <Plus size={12} />
                                    </button>
                                )}
                            </div>

                            {customTestCase && (
                                <div className="space-y-1">
                                    <input
                                        value={customTestCase.input}
                                        onChange={(e) => setCustomTestCase(prev => prev ? ({
                                            ...prev,
                                            input: e.target.value
                                        }) : null)}
                                        className="w-full bg-white dark:bg-black/50 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs font-mono text-indigo-600 dark:text-indigo-300 focus:border-indigo-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-700"
                                        placeholder="Input"
                                    />
                                    <input
                                        value={customTestCase.output}
                                        onChange={(e) => setCustomTestCase(prev => prev ? ({
                                            ...prev,
                                            output: e.target.value
                                        }) : null)}
                                        className="w-full bg-white dark:bg-black/50 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs font-mono text-emerald-600 dark:text-emerald-300 focus:border-emerald-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-700"
                                        placeholder="Expected"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Execution Results */}
                <div className="flex-1 p-3 bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar font-mono text-xs">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Output</h4>
                    {output ? (
                        <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{output}</div>
                    ) : (
                        <div className="text-slate-400 dark:text-slate-600 italic flex flex-col items-center justify-center h-20">
                            <Terminal size={24} className="mb-2 opacity-50" />
                            <span className="text-xs">Run code to see results...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // ==================== MAIN RENDER ====================

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col" style={{ width: '100vw', height: '100vh' }}>
            <div className="relative w-full h-full flex flex-col overflow-hidden">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors z-50"
                >
                    <X size={20} className="sm:w-6 sm:h-6" />
                </button>

                {/* Header */}
                <div className="px-4 sm:px-8 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pr-12">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-xl sm:text-2xl">{solution.patternEmoji || '💡'}</span>
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white line-clamp-1">{solution.title}</h2>
                        </div>
                        {solution.pattern && (
                            <span className="self-start px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded-full">
                                {solution.pattern}
                            </span>
                        )}
                        {isProblemSolved && (
                            <span className="self-start flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 rounded-full">
                                <CheckCircle2 size={14} /> Solved
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                        <div className="flex gap-1 sm:gap-2">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Time:</span> {solution.timeComplexity}
                        </div>
                        <div className="flex gap-1 sm:gap-2">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Space:</span> {solution.spaceComplexity}
                        </div>
                    </div>
                </div>

                {/* Main Content Area - Split View for Desktop, Tabs for Mobile */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">

                    {isDesktop ? (
                        /* Desktop: Static Split View - 34% tabs, 66% code */
                        <div className="flex-1 flex w-full h-full">
                            {/* LEFT SIDE - Tabs Panel (34%) */}
                            <div
                                className="flex flex-col border-r border-slate-200 dark:border-slate-700 overflow-hidden"
                                style={{ width: '34%', minWidth: '280px' }}
                            >
                                {/* Tabs */}
                                <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                    <button
                                        onClick={() => setActiveTab('problem')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'problem' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5'}`}
                                    >
                                        <FileText size={16} /> Problem
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('explanation')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'explanation' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5'}`}
                                    >
                                        <BookOpen size={16} /> Explain
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('tutor')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'tutor' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5'}`}
                                    >
                                        <MessageCircle size={16} /> Tutor
                                    </button>
                                </div>

                                {/* Tab Content */}
                                <div ref={contentRef} className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                                    {activeTab === 'problem' && renderProblemTab()}
                                    {activeTab === 'explanation' && renderExplanationTab()}
                                    {activeTab === 'tutor' && renderTutorTab()}
                                </div>
                            </div>

                            {/* RIGHT SIDE - Code Panel (66%) */}
                            <div
                                className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950 overflow-hidden"
                                style={{ width: '66%' }}
                            >
                                {renderPlaygroundTab()}
                            </div>
                        </div>
                    ) : (
                        /* Mobile: Tabbed View */
                        <div className="flex flex-col overflow-hidden h-full">
                            {/* Tabs */}
                            <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                <button
                                    onClick={() => setActiveTab('problem')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'problem' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5'}`}
                                >
                                    <FileText size={16} />
                                </button>
                                <button
                                    onClick={() => setActiveTab('explanation')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'explanation' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5'}`}
                                >
                                    <BookOpen size={16} />
                                </button>
                                <button
                                    onClick={() => setActiveTab('playground')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'playground' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5'}`}
                                >
                                    <Terminal size={16} />
                                </button>
                                <button
                                    onClick={() => setActiveTab('tutor')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'tutor' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5'}`}
                                >
                                    <MessageCircle size={16} />
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div ref={contentRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {activeTab === 'problem' && renderProblemTab()}
                                {activeTab === 'explanation' && renderExplanationTab()}
                                {activeTab === 'tutor' && renderTutorTab()}
                                {activeTab === 'playground' && renderPlaygroundTab()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Auth Unlock Modal */}
            <AuthUnlockModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onLogin={() => {
                    setShowAuthModal(false);
                    login();
                }}
                featureName={authFeatureName}
            />

            {/* Editor Settings Modal */}
            <EditorSettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                settings={settings}
                onUpdate={updateSetting}
            />
        </div>
    );
};

export default SolutionModal;
