/* eslint-disable max-lines, max-lines-per-function */
import React, { useState, useRef, useEffect } from 'react';
import type { Solution } from '../types';
import { PlaygroundAPI } from '../models/api';
import SmartVisualizer from './SmartVisualizer';
import TutorChat from './TutorChat';
import { AuthUnlockModal } from './AuthUnlockModal';
import { SignInGate } from './SignInGate';
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
    Plus,
    Settings,
    RotateCcw,
    Clock,
    Database,
    Loader2,
    Lightbulb
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import type { editor } from 'monaco-editor';
import Editor from '@monaco-editor/react';
import { useAuth } from '../hooks/useAuth';
import { useProgress } from '../hooks/useProgress';
import { useActivityTracking } from '../hooks/useActivityTracking';
import { YouTubePlayer } from './YouTubePlayer';
import { useEditorSettings } from '../hooks/useEditorSettings';
import { EditorSettingsModal } from './EditorSettingsModal';
import { initVimMode, type VimMode } from 'monaco-vim';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import { useTheme } from '../context/useTheme';
import { ConstraintValidator } from '../utils/ConstraintValidator';
import { browserJSRunner } from '../utils/BrowserJSRunner';
import { ComplexityAnalyzer, type ComplexityResult } from '../utils/ComplexityAnalyzer';
import { registerCompleters } from '../utils/monacoCompleters';

interface SolutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    solution: Solution | null;
    slug: string | null;
    problemStatus?: 'solved' | 'in-progress' | null;
}

const TABS = {
    PROBLEM: 'problem',
    EXPLANATION: 'explanation',
    PLAYGROUND: 'playground',
    TUTOR: 'tutor'
} as const;

type TabType = typeof TABS[keyof typeof TABS];

const TAB_STYLES = {
    ACTIVE: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25',
    INACTIVE: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5'
} as const;

/* eslint-disable complexity */
const SolutionModal: React.FC<SolutionModalProps> = ({ isOpen, onClose, solution, slug, problemStatus }) => {
    const { isAuthenticated, login } = useAuth();
    const { isSolved, markSolved, saveDraft, getDraft, clearDraft, sync } = useProgress();
    const { settings, updateSetting } = useEditorSettings();
    const { logEvent } = useActivityTracking();
    const { theme: appTheme } = useTheme();

    const [activeTab, setActiveTab] = useState<TabType>(TABS.PROBLEM);
    const [activeApproach, setActiveApproach] = useState<'bruteforce' | 'optimal'>('optimal');
    const [language, setLanguage] = useState<'python' | 'javascript' | 'typescript' | 'java' | 'go' | 'rust' | 'cpp'>('python');
    const [code, setCode] = useState(solution?.code || '');

    // Track if problem is solved locally for immediate UI update
    const [isProblemSolved, setIsProblemSolved] = useState(false);

    // Complexity Analysis
    const [complexity, setComplexity] = useState<ComplexityResult | null>(null);

    // Hints progressive reveal
    const [revealedHints, setRevealedHints] = useState(0);

    // Analyze complexity on code change (debounced)
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (code) {
                const result = ComplexityAnalyzer.analyze(code);
                setComplexity(result);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [code, language]);

    // Reset revealed hints when solution changes
    React.useEffect(() => {
        setRevealedHints(0);
    }, [slug]);



    // Ref for scrollable content container
    const contentRef = useRef<HTMLDivElement>(null);
    const [output, setOutput] = useState<string>('');
    const [debugLogs, setDebugLogs] = useState<string>('');
    const [runResults, setRunResults] = useState<{ passed: boolean; input: string; expected: string; actual: string; error?: string }[]>([]);
    const [allTestsPassed, setAllTestsPassed] = useState<boolean | null>(null);
    const [activeBottomTab, setActiveBottomTab] = useState<'testcases' | 'result' | 'logs'>('testcases'); // NEW: Tabs state
    const [isRunning, setIsRunning] = useState(false);

    // Reset confirmation modal state
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Single Custom Test Case State (editable, temporary)
    const [customTestCase, setCustomTestCase] = useState<{ input: string; output: string } | null>(null);

    // Selected test case index for tabbed view
    const [selectedCaseIndex, setSelectedCaseIndex] = useState<number>(0);

    // Test results for each case (after running) - will be used when integrating run results
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [testResults, _setTestResults] = useState<{ passed: boolean; actualOutput: string }[]>([]);

    // Run custom only toggle
    const [runOnlyCustom, setRunOnlyCustom] = useState(false);

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
        // Handle both standalone functions and class methods
        const defMatch = pythonCode.match(/def\s+(\w+)\s*\(([^)]*)\)/);
        if (!defMatch) return pythonCode;

        const funcName = defMatch[1];
        let params = defMatch[2].split(',').map(p => p.trim().split(':')[0].trim()).filter(Boolean);

        // Filter out 'self' for class methods
        params = params.filter(p => p !== 'self');

        switch (targetLang) {
            case 'typescript':
                return `function ${funcName}(${params.map(p => `${p}: any`).join(', ')}): any {\n    // Your code here\n};`;
            case 'javascript':
                return `/**\n * @param {${params.map(() => 'any').join(', ')}} ${params.join(', ')}\n * @return {any}\n */\nvar ${funcName} = function(${params.join(', ')}) {\n    // Your code here\n};`;
            case 'java':
                return `class Solution {\n    public int ${funcName}(${params.map(p => `int ${p}`).join(', ')}) {\n        // Your code here\n        return 0;\n    }\n}`;
            case 'cpp':
                return `class Solution {\npublic:\n    int ${funcName}(${params.map(p => `int ${p}`).join(', ')}) {\n        // Your code here\n        return 0;\n    }\n}`;
            case 'go':
                return `func ${funcName}(${params.map(p => `${p} int`).join(', ')}) int {\n    // Your code here\n    return 0\n}`;
            case 'rust':
                return `impl Solution {\n    pub fn ${funcName.replace(/([A-Z])/g, '_$1').toLowerCase()}(${params.map(p => `${p}: i32`).join(', ')}) -> i32 {\n        // Your code here\n        0\n    }\n}`;
            default:
                return pythonCode;
        }
    };

    // Ref to track if we're loading a new language (to prevent saving stale code)
    const isLoadingNewLanguageRef = React.useRef(false);
    const previousLanguageRef = React.useRef(language);

    // Update code when language changes (only if no user edits / draft exists)
    React.useEffect(() => {
        if (!solution || !slug) return;

        // Check if language actually changed
        const languageChanged = previousLanguageRef.current !== language;
        previousLanguageRef.current = language;

        // Set flag to prevent saving old code to new language's draft key
        if (languageChanged) {
            isLoadingNewLanguageRef.current = true;
        }

        // Try to load saved draft first
        const draftKey = language === 'python' ? slug : `${slug}_${language}`;
        const savedDraft = getDraft(draftKey);

        if (savedDraft) {
            setCode(savedDraft);
        } else {
            // Check for pre-generated implementation for target language
            const implData = solution.implementations?.[language];
            if (implData?.initialCode) {
                setCode(implData.initialCode.replace(/\\n/g, '\n'));
            } else if (language === 'python') {
                // Fallback for Python (should ideally be in implementations map too now)
                const rawCode = solution.initialCode || solution.code || '';
                setCode(rawCode.replace(/\\n/g, '\n'));
            } else {
                // Fallback: Convert Python template to target language (legacy path)
                const rawCode = solution.initialCode || solution.code || '';
                const converted = convertToLanguage(rawCode.replace(/\\n/g, '\n'), language);
                setCode(converted);
            }
        }

        // Clear the loading flag after a short delay to allow the new code to be set
        if (languageChanged) {
            setTimeout(() => {
                isLoadingNewLanguageRef.current = false;
            }, 100);
        }
    }, [language, solution, slug, getDraft]);

    // Initial load logic handles by the above effect mainly, but keeping this for robustness if needed or merging
    // Actually, we can simplfy: The above effect covers both language changes and initial load if we include 'solution' dependency.
    // However, the original code had two effects. Let's merge/simplify.

    // We'll keep the second effect just for setting isProblemSolved and clearing output on new problem load
    React.useEffect(() => {
        if (solution && slug) {
            setOutput('');
            setDebugLogs('');
            setActiveBottomTab('testcases');
            setIsProblemSolved(isSolved(slug));
        }
    }, [solution, slug, isSolved]);

    // Persist code changes as draft (Debounced)
    React.useEffect(() => {
        if (!slug) return;

        // Skip saving if we're in the middle of loading a new language
        if (isLoadingNewLanguageRef.current) return;

        const timer = setTimeout(() => {
            // Double-check we're not loading
            if (isLoadingNewLanguageRef.current) return;

            // Use same key format as the load logic
            const draftKey = language === 'python' ? slug : `${slug}_${language}`;
            saveDraft(draftKey, code);
        }, 10000); // Save draft after 10 seconds of inactivity

        return () => clearTimeout(timer);
    }, [code, slug, language, saveDraft]);

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
        window.speechSynthesis?.cancel();
    }, [slug]);

    // Reset scroll position when tab changes
    useEffect(() => {
        // Log tab view
        if (isOpen && slug) {
            logEvent('view_tab', { slug, tab: activeTab });
            if (activeTab === 'explanation') {
                logEvent('view_solution', { slug });
            }
        }

        // Use requestAnimationFrame to ensure DOM is updated before scrolling
        requestAnimationFrame(() => {
            if (contentRef.current) {
                contentRef.current.scrollTop = 0;
            }
        });
    }, [activeTab, isOpen, slug, logEvent]);

    // eslint-disable-next-line sonarjs/cognitive-complexity
    const handleRunCode = async () => {
        if (!slug) return;

        // Log practice event
        logEvent('practice_run', {
            slug,
            language,
            isCustom: !!(customTestCase && customTestCase.input && runOnlyCustom)
        });

        setIsRunning(true);
        setOutput('Running code...');
        setDebugLogs(''); // Clear previous debug logs
        setActiveBottomTab('result'); // Default to showing results

        try {
            // Use examples as primary source (has proper input), fallback to testCases
            const builtInCases = (solution?.examples?.length ? solution.examples : solution?.testCases) || [];
            const allTestCases = [...builtInCases];
            const hasCustomCase = customTestCase && customTestCase.input;

            // Client-side constraint validation for custom test cases
            if (hasCustomCase && solution?.constraints && solution.constraints.length > 0) {
                const validation = ConstraintValidator.validate(customTestCase.input, solution.constraints);
                if (!validation.valid) {
                    // Show validation error immediately without calling server
                    setRunResults([{
                        passed: false,
                        input: customTestCase.input,
                        expected: '',
                        actual: '',
                        error: `Input violates problem constraints:\n\n${validation.errors.join('\n')}`
                    }]);
                    setAllTestsPassed(false);
                    setOutput('');
                    setIsRunning(false);
                    setActiveBottomTab('result');
                    return;
                }
            }

            if (hasCustomCase) {
                // Custom test case - mark with empty output so reference solution computes it
                if (runOnlyCustom) {
                    allTestCases.length = 0; // Clear built-in cases if running only custom
                }
                allTestCases.push({ input: customTestCase.input, output: '' });
            }

            // Get reference code and constraints for custom test cases
            // Fix: Only use solution.code as fallback if it's the right language (Python)
            const referenceCode = hasCustomCase ? (solution?.implementations?.[language]?.code || (language === 'python' ? solution?.code : '') || '') : undefined;
            const constraints = solution?.constraints || [];

            // Check if we can execute client-side (JavaScript/TypeScript)
            const isClientSideLanguage = language === 'javascript' || language === 'typescript';

            let res;
            if (isClientSideLanguage) {
                // Client-side execution for JavaScript/TypeScript
                res = await browserJSRunner.execute(
                    code,
                    allTestCases,
                    language,
                    referenceCode,
                    constraints
                );
            } else {
                // Server-side execution for Python and other languages
                res = await PlaygroundAPI.runCode(code, slug, allTestCases.length > 0 ? allTestCases : undefined, language, { referenceCode, constraints });
            }

            // Handle results uniformly for both client-side and server-side execution
            if (res.success) {
                setDebugLogs(res.logs || 'No output recorded.');

                if (res.results) {
                    const allPassed = res.results.every((r) => r.passed);

                    // Store structured results for beautiful UI rendering
                    const structuredResults = res.results.map((r) => ({
                        passed: r.passed,
                        input: r.input || '',
                        expected: r.expected || '',
                        actual: r.actual || '',
                        error: r.error
                    }));
                    setRunResults(structuredResults);
                    setAllTestsPassed(allPassed);

                    if (allPassed) {
                        if (slug) {
                            markSolved(slug, code);
                            setIsProblemSolved(true);
                            sync();
                        }
                        setOutput('');
                        setActiveBottomTab('result');
                    } else {
                        setOutput('Some test cases failed. Check logs for details.');
                        setActiveBottomTab('logs');
                    }
                }
            } else {
                // Execution failed or crash
                setOutput(`Execution Failed:\n${res.error || 'Unknown error'}`);
                setDebugLogs(res.logs || res.error || 'Execution failed');
                setActiveBottomTab('logs');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setOutput(`Error: ${errorMessage}`);
            setDebugLogs(`Error: ${errorMessage}\n\nPlease check your code or try again.`);
            setActiveBottomTab('logs');
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

    const handleResetCode = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!solution || !slug) return;
        setShowResetConfirm(true);
    };

    const confirmReset = () => {
        if (!solution || !slug) return;
        // Clear saved draft for this problem + language
        const draftKey = language === 'python' ? slug : `${slug}_${language}`;
        clearDraft(draftKey);

        // Check for pre-generated implementation for target language
        const implData = solution.implementations?.[language];
        let resetCode = '';

        if (implData?.initialCode) {
            resetCode = implData.initialCode.replace(/\\n/g, '\n');
        } else {
            // Fallback legacy conversion
            const rawCode = solution.initialCode || solution.code || '';
            resetCode = rawCode.replace(/\\n/g, '\n');

            if (language !== 'python') {
                resetCode = convertToLanguage(resetCode, language);
            }
        }

        setCode(resetCode);
        setShowResetConfirm(false);
    };

    const handleEditorMount = (editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
        editorRef.current = editor;

        // Register custom autocomplete providers
        const disposables = registerCompleters(monaco);

        // Cleanup when component unmounts
        // Note: In strict mode, mount might happen twice, but Monaco handles provider registration reasonably well.
        // Ideally we store disposables ref to clear them, but Monaco's lifetime here is bound to app session mostly.
        return () => {
            disposables.forEach(d => d.dispose());
        };
    };
    React.useEffect(() => {
        return () => {
            window.speechSynthesis?.cancel();
            setSpeakingSection(null);
        };
    }, [activeTab, isOpen]);

    const handleSpeak = (text: string, section: string) => {
        if (!solution || !text) return;

        if (speakingSection === section) {
            window.speechSynthesis?.cancel();
            setSpeakingSection(null);
            return;
        }

        window.speechSynthesis?.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => setSpeakingSection(null);
        utterance.onerror = () => setSpeakingSection(null);

        window.speechSynthesis?.speak(utterance);
        setSpeakingSection(section);
    };

    if (!isOpen || !solution) return null;

    // ==================== RENDER FUNCTIONS ====================

    // Render the Problem Tab Content
    const renderProblemTab = () => (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300 pb-8">
            {/* Problem Description */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <FileText size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                        Problem Description
                    </h3>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-lg">
                    <p className="text-slate-700 dark:text-slate-300 text-base sm:text-lg leading-8 whitespace-pre-line">
                        {solution.problemStatement || solution.description || 'No description available.'}
                    </p>
                </div>
            </div>

            {/* Examples */}
            <div className="space-y-4">
                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                    Examples
                </h3>
                <div className="grid gap-4">
                    {(solution.examples || solution.testCases || []).map((example, i) => (
                        <div key={i} className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50 group-hover:bg-indigo-500 transition-colors" />
                            <div className="p-4 pl-6 space-y-3">
                                <div className="font-mono text-sm">
                                    <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs block mb-1">Input</span>
                                    <div className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 px-3 py-2 rounded border border-slate-100 dark:border-slate-800 overflow-x-auto">
                                        {example.input}
                                    </div>
                                </div>
                                <div className="font-mono text-sm">
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider text-xs block mb-1">Output</span>
                                    <div className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 px-3 py-2 rounded border border-slate-100 dark:border-slate-800 overflow-x-auto">
                                        {example.output}
                                    </div>
                                </div>
                                {(example as { explanation?: string }).explanation && (
                                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-2 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                                        <span className="font-semibold mr-1">Explanation:</span>
                                        {(example as { explanation?: string }).explanation}
                                    </div>
                                )}
                            </div>
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-500">
                                Example {i + 1}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Constraints */}
            {solution.constraints && solution.constraints.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                        Constraints
                    </h3>
                    <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/50">
                        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                            {solution.constraints.map((c, i) => (
                                <li key={i} className="p-3 text-slate-600 dark:text-slate-300 font-mono text-sm flex items-start gap-3 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors">
                                    <span className="text-indigo-400 mt-1">•</span>
                                    <span>{c}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Hints - Progressive Reveal */}
            {solution.hints && solution.hints.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold flex items-center gap-2">
                            💡 Hints ({revealedHints}/{solution.hints.length})
                        </h3>
                        {revealedHints < solution.hints.length && (
                            <button
                                onClick={() => setRevealedHints(prev => Math.min(prev + 1, solution.hints?.length || 0))}
                                className="px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-all flex items-center gap-1.5"
                            >
                                <Lightbulb size={14} />
                                Show Hint {revealedHints + 1}
                            </button>
                        )}
                    </div>
                    {revealedHints > 0 && (
                        <div className="space-y-2">
                            {solution.hints.slice(0, revealedHints).map((hint, i) => (
                                <div
                                    key={i}
                                    className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200 text-sm animate-in fade-in slide-in-from-top-2 duration-300"
                                >
                                    <span className="font-semibold text-amber-600 dark:text-amber-400 mr-2">Hint {i + 1}:</span>
                                    {hint}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Related Problems - Rounded Rectangle Cards */}
            {solution.relatedProblems && solution.relatedProblems.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold flex items-center gap-2">
                        🔗 Related Problems
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {solution.relatedProblems.map((related, i) => {
                            const title = related.split('-').map(word =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ');

                            return (
                                <button
                                    key={i}
                                    onClick={() => {
                                        onClose();
                                        window.location.href = `/problem/${related}`;
                                    }}
                                    className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all duration-200 text-left"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:bg-violet-200 dark:group-hover:bg-violet-800/60 transition-colors">
                                        <ExternalLink size={14} />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors truncate">
                                        {title}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* External Resources */}
            <div className="space-y-3">
                <h3 className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold flex items-center gap-2">
                    📚 External Resources
                </h3>
                <div className="flex flex-wrap gap-3">
                    {slug && (
                        <a
                            href={`https://leetcode.com/problems/${slug}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm font-medium hover:bg-orange-100 dark:hover:bg-orange-800/40 transition-all duration-200"
                        >
                            <CodeIcon size={16} />
                            LeetCode
                        </a>
                    )}
                    {slug && (
                        <a
                            href={`https://neetcode.io/problems/${slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-800/40 transition-all duration-200"
                        >
                            <Terminal size={16} />
                            NeetCode
                        </a>
                    )}
                    {solution.videoId && (
                        <a
                            href={`https://www.youtube.com/watch?v=${solution.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-800/40 transition-all duration-200"
                        >
                            <Youtube size={16} />
                            Video
                        </a>
                    )}
                </div>
            </div>
        </div>
    );

    // Render the Explanation Tab Content
    const renderExplanationTab = () => {
        const bfApproach = solution.approaches?.find(a => a.name === 'bruteforce' || a.label === 'Brute Force');
        const bfTime = solution.bruteForceTimeComplexity || bfApproach?.timeComplexity || 'O(n²)';
        const bfSpace = solution.bruteForceSpaceComplexity || bfApproach?.spaceComplexity || 'O(1)';
        const bfIntuition = (solution.bruteForceIntuition?.length ? solution.bruteForceIntuition : undefined) || bfApproach?.intuition || [];

        return (
            <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-4 duration-300">


                {/* 1. YouTube Video (First) */}
                {solution.videoId && (
                    <div className="space-y-4">
                        <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                            <Youtube size={16} /> Video Explanation
                        </h3>
                        <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                            <YouTubePlayer videoId={solution.videoId} />
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
                                            handleSpeak(bfIntuition.join('. '), 'bruteForce');
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
                                    <div className="text-lg font-mono text-orange-600 dark:text-orange-400">{bfTime}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 font-semibold">Space Complexity</div>
                                    <div className="text-lg font-mono text-orange-600 dark:text-orange-400">{bfSpace}</div>
                                </div>
                            </div>
                        </div>

                        {/* Brute Force Intuition */}
                        <div className="space-y-4">
                            <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                                🔨 Brute Force Intuition
                            </h3>
                            {bfIntuition && bfIntuition.length > 0 ? (
                                <div className="space-y-3">
                                    {bfIntuition.map((step, idx) => (
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
                    <div className="space-y-6">
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

                        {/* Mental Model */}
                        {solution.mentalModel && (
                            <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                                    🧠 Mental Model
                                </h3>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                                    {solution.mentalModel}
                                </p>
                            </div>
                        )}

                        {/* Walkthrough */}
                        {solution.walkthrough && solution.walkthrough.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                                    👣 Walkthrough
                                </h3>
                                <div className="space-y-2">
                                    {solution.walkthrough.map((step, i) => (
                                        <div key={i} className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold">
                                                {i + 1}
                                            </span>
                                            <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Interview Tip */}
                        {solution.interviewTip && (
                            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-200">
                                <h3 className="flex items-center gap-2 font-bold mb-1 text-blue-700 dark:text-blue-300 text-sm uppercase tracking-wider">
                                    💡 Interview Tip
                                </h3>
                                <p className="text-sm leading-relaxed opacity-90">{solution.interviewTip}</p>
                            </div>
                        )}

                        {/* Common Mistakes */}
                        {solution.commonMistakes && solution.commonMistakes.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm uppercase tracking-wider text-red-500 font-bold flex items-center gap-2">
                                    ⚠️ Common Mistakes
                                </h3>
                                <ul className="space-y-2 bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                                    {solution.commonMistakes.map((mistake, i) => (
                                        <li key={i} className="flex gap-2 text-slate-700 dark:text-slate-300 text-sm">
                                            <span className="text-red-500 font-bold">•</span>
                                            {mistake}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Hints (Collapsible) moved here */}
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
                    </div>
                )
                }

                {/* 5. Visualization */}
                {
                    (solution.visualizationType || solution.animationSteps?.length) && (
                        <div className="space-y-4">
                            <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                                🎬 Visualization
                            </h3>
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800/50">
                                <SmartVisualizer solution={solution} />
                            </div>
                        </div>
                    )
                }

                {/* 6. Code Solution */}
                {/* 6. Code Solution */}
                {
                    (() => {
                        // Determine display code based on active approach and selected language
                        // Note: Brute force is currently Python-only usually, so we default to Python for it
                        // For Optimal, we check if the selected language has an implementation
                        let displayCode = '';
                        let displayLang = language;

                        if (activeApproach === 'optimal') {
                            if (language === 'python') {
                                displayCode = solution.code;
                            } else {
                                displayCode = solution.implementations?.[language]?.code || solution.code;
                                // If fallback to python happened, set display lag to python
                                if (!solution.implementations?.[language]?.code) {
                                    displayLang = 'python';
                                }
                            }
                        } else {
                            displayCode = solution.bruteForceCode ||
                                solution.approaches?.find(a => a.name === 'bruteforce')?.code ||
                                '';
                            displayLang = 'python'; // Brute force is usually python only
                        }

                        // Fallback
                        displayCode = displayCode || '';

                        return (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                                        💻 {activeApproach === 'optimal' ? 'Optimal' : 'Brute Force'} Code
                                        {displayLang !== language && activeApproach === 'optimal' && (
                                            <span className="text-xs font-normal normal-case text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                                                ({language} not available, showing Python)
                                            </span>
                                        )}
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
                                        language={displayLang}
                                        style={vscDarkPlus}
                                        customStyle={{ margin: 0, padding: '1rem', fontSize: '0.8rem' }}
                                    >
                                        {displayCode}
                                    </SyntaxHighlighter>
                                </div>
                            </div>
                        );
                    })()
                }

                {/* Related Problems */}
                {solution.relatedProblems && solution.relatedProblems.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-700/50">
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
            </div >
        );
    };

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
    // eslint-disable-next-line sonarjs/cognitive-complexity
    const renderPlaygroundTab = () => (
        <ResizablePanelGroup direction="vertical" className="h-full min-h-[400px]">
            {/* Code Editor */}
            <ResizablePanel defaultSize={70} minSize={20} className="bg-white dark:bg-[#1e1e1e] border-b border-slate-200 dark:border-slate-800 relative group flex flex-col">
                <div className="flex-none px-4 py-2 bg-slate-50 dark:bg-[#252526] border-b border-slate-200 dark:border-[#333333] text-xs text-slate-500 dark:text-slate-400 font-mono flex justify-between items-center z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-indigo-500 dark:text-indigo-400 font-bold">Language:</span>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as 'python' | 'javascript' | 'typescript' | 'java' | 'go' | 'rust' | 'cpp')}
                                className="bg-white dark:bg-[#3c3c3c] text-slate-700 dark:text-slate-200 text-xs border border-slate-200 dark:border-[#3c3c3c] rounded px-2 py-0.5 focus:outline-none focus:border-indigo-500 hover:bg-slate-100 dark:hover:bg-[#4a4a4a] transition-colors"
                            >
                                <option value="python">Python</option>
                                <option value="javascript">JavaScript</option>
                                <option value="typescript">TypeScript</option>
                                {import.meta.env.VITE_ENABLE_EXPERIMENTAL_LANGUAGES === 'true' && (
                                    <>
                                        <option value="java">Java</option>
                                        <option value="go">Go</option>
                                        <option value="rust">Rust</option>
                                        <option value="cpp">C++</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <span className="opacity-50">|</span>
                        <span>{language === 'python' ? 'main.py' : language === 'javascript' ? 'main.js' : language === 'typescript' ? 'main.ts' : language === 'java' ? 'Solution.java' : language === 'go' ? 'main.go' : language === 'rust' ? 'solution.rs' : 'solution.cpp'}</span>

                        {complexity && (
                            <div className="flex items-center gap-2 sm:gap-4 text-xs text-slate-500 dark:text-slate-500 ml-2 sm:ml-4 pl-2 sm:pl-4 border-l border-slate-200 dark:border-[#444] overflow-hidden">
                                <div className="flex items-center gap-1.5 shrink-0" title={complexity.explanation.join('\n')}>
                                    <Clock size={12} className="text-blue-500 dark:text-blue-400" />
                                    <span className="font-mono">{complexity.time}</span>
                                </div>
                                <div className="hidden xs:flex items-center gap-1.5 shrink-0" title="Estimated Space Complexity">
                                    <Database size={12} className="text-purple-500 dark:text-purple-400" />
                                    <span className="font-mono">{complexity.space}</span>
                                </div>
                            </div>
                        )}

                        <div id="vim-status-bar" className="flex-1 min-w-[200px]"></div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => handleResetCode(e)}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-[#4a4a4a] rounded transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-white"
                            title="Reset Code"
                        >
                            <RotateCcw size={14} />
                        </button>
                        <button
                            onClick={() => setShowSettingsModal(true)}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-[#4a4a4a] rounded transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-white"
                            title="Editor Settings"
                        >
                            <Settings size={14} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 relative w-full overflow-hidden">
                    <Editor
                        height="100%"
                        language={language}
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        theme={appTheme === 'dark' ? 'vs-dark' : 'light'}
                        onMount={handleEditorMount}
                        options={{
                            minimap: { enabled: false },
                            fontSize: settings.fontSize,
                            tabSize: settings.tabSize,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 16, bottom: 16 },
                            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                            renderLineHighlight: 'all',
                            lineDecorationsWidth: 16,
                            lineNumbersMinChars: 4,
                            cursorBlinking: 'smooth',
                            smoothScrolling: true,
                            contextmenu: true,
                            wordWrap: 'on',
                            scrollbar: {
                                vertical: 'auto',
                                horizontal: 'auto',
                                verticalScrollbarSize: 10,
                                horizontalScrollbarSize: 10,
                            }
                        }}
                        loading={<div className="text-slate-500 p-8 text-sm">Loading Editor...</div>}
                    />
                </div>
            </ResizablePanel>

            <ResizableHandle className="h-2 w-full bg-slate-100 dark:bg-[#1e1e1e] hover:bg-indigo-500/10 dark:hover:bg-indigo-600/20 transition-colors cursor-row-resize flex items-center justify-center group border-y border-slate-200 dark:border-[#333]">
                <div className="w-12 h-1 rounded-full bg-slate-300 dark:bg-[#444] group-hover:bg-indigo-500 dark:group-hover:bg-white transition-colors" />
            </ResizableHandle>

            {/* Run Button Bar & Test Output */}
            <ResizablePanel defaultSize={30} minSize={10} className="flex flex-col bg-white dark:bg-[#1e1e1e] text-slate-700 dark:text-slate-300">
                {/* Tabs Header */}
                <div className="flex items-center px-4 bg-slate-50 dark:bg-[#252526] border-b border-slate-200 dark:border-[#333] h-10 shrink-0">
                    <div className="flex items-center gap-6 h-full">
                        <button
                            onClick={() => setActiveBottomTab('testcases')}
                            className={`h-full text-xs font-bold uppercase tracking-wider border-b-2 transition-all px-1 ${activeBottomTab === 'testcases'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Test Cases
                        </button>
                        <button
                            onClick={() => setActiveBottomTab('result')}
                            className={`h-full text-xs font-bold uppercase tracking-wider border-b-2 transition-all px-1 ${activeBottomTab === 'result'
                                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Test Result
                        </button>
                        <button
                            onClick={() => setActiveBottomTab('logs')}
                            className={`h-full text-xs font-bold uppercase tracking-wider border-b-2 transition-all px-1 ${activeBottomTab === 'logs'
                                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Debug Log
                        </button>
                    </div>

                    <div className="flex-1" />

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-600 hidden sm:inline tracking-wider">
                            {solution.testCases?.length || 0} Test Cases
                        </span>
                        <div className="flex items-center gap-4">
                            {customTestCase && customTestCase.input && (
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={runOnlyCustom}
                                        onChange={(e) => setRunOnlyCustom(e.target.checked)}
                                        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                                    />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-500 transition-colors hidden xs:inline">Run Custom Only</span>
                                </label>
                            )}
                            <button
                                onClick={isAuthenticated ? handleRunCode : () => openAuthModal('Code Execution')}
                                disabled={isAuthenticated && isRunning}
                                className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded transition-all flex items-center gap-2 ${isAuthenticated && isRunning
                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20'}`}
                            >
                                {isAuthenticated && isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={10} fill="currentColor" />}
                                {isAuthenticated && isRunning ? 'Running...' : 'Run Code'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 min-h-0 bg-white dark:bg-[#1e1e1e] overflow-hidden flex flex-col relative">

                    {/* Test Cases Tab */}
                    {activeBottomTab === 'testcases' && (() => {
                        const allCases = (solution.examples?.length ? solution.examples : solution.testCases) || [];
                        const currentCase = selectedCaseIndex === -1 ? customTestCase : allCases[selectedCaseIndex];
                        const currentResult = testResults[selectedCaseIndex];

                        return (
                            <div className="absolute inset-0 flex flex-col">
                                {/* Case Tabs */}
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-[#333] overflow-x-auto bg-slate-50 dark:bg-[#1e1e1e]">
                                    {allCases.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedCaseIndex(i)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-2 ${selectedCaseIndex === i
                                                ? 'bg-white dark:bg-[#333] text-slate-800 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-[#444]'
                                                : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-[#2a2a2a] hover:text-slate-700 dark:hover:text-slate-300'
                                                }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${testResults[i]?.passed === true ? 'bg-emerald-500' : testResults[i]?.passed === false ? 'bg-red-500' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
                                            Case {i + 1}
                                        </button>
                                    ))}
                                    <div className="w-px h-4 bg-slate-300 dark:bg-[#333] mx-1"></div>
                                    <button
                                        onClick={() => {
                                            if (!customTestCase) setCustomTestCase({ input: '', output: '' });
                                            setSelectedCaseIndex(-1);
                                        }}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${selectedCaseIndex === -1
                                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/30'
                                            : 'text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/5'
                                            }`}
                                    >
                                        <Plus size={12} /> Custom Case
                                    </button>

                                    {/* runOnlyCustom toggle removed from here */}
                                </div>

                                {/* Case Content */}
                                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white dark:bg-[#1e1e1e]">
                                    {selectedCaseIndex === -1 && customTestCase ? (
                                        <div className="space-y-4 max-w-2xl">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Input</label>
                                                    <button onClick={() => { setCustomTestCase(null); setSelectedCaseIndex(0); }} className="text-[10px] text-red-500 hover:text-red-400 transition-colors">Clear Custom Case</button>
                                                </div>
                                                <div className="relative group">
                                                    <textarea
                                                        className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-lg p-4 font-mono text-sm text-slate-800 dark:text-slate-300 outline-none focus:border-indigo-500/50 transition-colors resize-none leading-relaxed"
                                                        rows={4}
                                                        value={customTestCase.input}
                                                        onChange={(e) => setCustomTestCase(prev => prev ? ({ ...prev, input: e.target.value }) : null)}
                                                        placeholder="Enter input here..."
                                                        spellCheck={false}
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-500">Enter input values exactly as they appear in the problem description.</p>
                                            </div>
                                        </div>
                                    ) : currentCase ? (
                                        <div className="space-y-6 max-w-2xl">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Input</label>
                                                <div className="bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-lg p-4 font-mono text-sm text-slate-800 dark:text-slate-300 leading-relaxed min-h-[50px]">
                                                    {currentCase.input || <span className="text-slate-400 dark:text-slate-600 italic">No input</span>}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expected Output</label>
                                                <div className="bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-lg p-4 font-mono text-sm text-emerald-600 dark:text-emerald-400/90 leading-relaxed min-h-[40px]">
                                                    {currentCase.output}
                                                </div>
                                            </div>

                                            {currentResult && (
                                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <label className={`text-[10px] font-bold uppercase tracking-widest ${currentResult.passed ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        Your Output {currentResult.passed ? '✓' : '✗'}
                                                    </label>
                                                    <div className={`rounded-lg p-4 font-mono text-sm border bg-slate-50 dark:bg-[#111] leading-relaxed ${currentResult.passed
                                                        ? 'border-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                                                        : 'border-red-500/20 text-red-600 dark:text-red-300'
                                                        }`}>
                                                        {currentResult.actualOutput}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center text-slate-500 dark:text-slate-600 py-12 flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#252526] flex items-center justify-center text-slate-400 dark:text-slate-500">
                                                <FileText size={20} />
                                            </div>
                                            <p>No test cases selected</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Test Result Tab */}
                    {activeBottomTab === 'result' && (
                        <div className="absolute inset-0 p-4 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-[#1e1e1e]">
                            {runResults.length > 0 ? (
                                <div className="space-y-4 max-w-3xl">
                                    {/* Summary Header */}
                                    {(() => {
                                        const passedCount = runResults.filter(r => r.passed).length;

                                        return (
                                            <div className={`p-4 rounded-xl border ${allTestsPassed
                                                ? 'bg-emerald-500/10 border-emerald-500/20'
                                                : 'bg-red-500/10 border-red-500/20'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${allTestsPassed ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400' : 'bg-red-500/20 text-red-500 dark:text-red-400'}`}>
                                                        {allTestsPassed ? '✓' : '✗'}
                                                    </div>
                                                    <div>
                                                        <h4 className={`font-bold ${allTestsPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            {allTestsPassed ? 'All Test Cases Passed' : 'Some Tests Failed'}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            {passedCount} of {runResults.length} cases passed
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Test Case Cards */}
                                    <div className="grid gap-3">
                                        {runResults.map((result, idx) => (
                                            <div key={idx} className={`rounded-lg border overflow-hidden transition-all ${result.passed
                                                ? 'border-slate-200 dark:border-[#333] hover:border-emerald-500/30'
                                                : 'border-red-500/20 bg-red-500/5'}`}>
                                                {/* Card Header */}
                                                <div className="px-4 py-2.5 flex items-center justify-between bg-slate-100 dark:bg-[#252526] border-b border-slate-200 dark:border-[#333]">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-bold ${result.passed ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                                                            Case {idx + 1}
                                                        </span>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${result.passed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                                            {result.passed ? 'PASSED' : 'FAILED'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* Card Body */}
                                                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono bg-white dark:bg-[#1e1e1e]">
                                                    <div className="space-y-1">
                                                        <span className="text-slate-500 uppercase text-[10px] tracking-wider font-bold">Input</span>
                                                        <div className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#111] p-2 rounded border border-slate-200 dark:border-[#333] overflow-x-auto">{result.input}</div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-slate-500 uppercase text-[10px] tracking-wider font-bold">Expected</span>
                                                        <div className="text-emerald-600 dark:text-emerald-400/80 bg-slate-50 dark:bg-[#111] p-2 rounded border border-slate-200 dark:border-[#333] overflow-x-auto">{result.expected}</div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-slate-500 uppercase text-[10px] tracking-wider font-bold">Output</span>
                                                        <div className={`${result.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} bg-slate-50 dark:bg-[#111] p-2 rounded border border-slate-200 dark:border-[#333] overflow-x-auto`}>
                                                            {result.actual}
                                                        </div>
                                                    </div>
                                                    {result.error && (
                                                        <div className="col-span-full mt-2 p-3 bg-red-500/10 text-red-600 dark:text-red-300 rounded border border-red-500/20">
                                                            {result.error}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : output ? (
                                <div className="font-mono text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-w-3xl">{output}</div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-600 gap-3">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#252526] flex items-center justify-center">
                                        <Play size={20} className="ml-1 opacity-50" />
                                    </div>
                                    <p>Run code to see results</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Debug Log Tab */}
                    {activeBottomTab === 'logs' && (
                        <div className="absolute inset-0 bg-slate-900 overflow-hidden flex flex-col font-mono">
                            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                                {debugLogs ? (
                                    <div className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">
                                        {debugLogs.split('\n').map((line, i) => (
                                            <div key={i} className="flex group hover:bg-white/5 mx-[-1rem] px-[1rem]">
                                                <span className="text-slate-500 select-none mr-4 text-xs w-6 text-right pt-0.5">{i + 1}</span>
                                                <span className="break-all">{line}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                                        <span className="text-sm">No output logs</span>
                                        <span className="text-xs opacity-60">Print debugging available</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
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
                        {isProblemSolved ? (
                            <span className="self-start flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 rounded-full">
                                <CheckCircle2 size={14} /> Solved
                            </span>
                        ) : problemStatus === 'in-progress' ? (
                            <span className="self-start flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 rounded-full">
                                ✏️ In Progress
                            </span>
                        ) : null}
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
                        /* Desktop: Resizable Split View */
                        <ResizablePanelGroup direction="horizontal" className="flex-1 w-full h-full rounded-b-lg border-t border-slate-200 dark:border-slate-700">
                            {/* LEFT SIDE - Content Panel */}
                            <ResizablePanel defaultSize={34} minSize={20} className="bg-slate-100 dark:bg-slate-800">
                                <div className="flex flex-col h-full overflow-hidden">
                                    {/* Tabs */}
                                    <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                        <button
                                            onClick={() => setActiveTab(TABS.PROBLEM)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === TABS.PROBLEM ? TAB_STYLES.ACTIVE : TAB_STYLES.INACTIVE}`}
                                        >
                                            <FileText size={16} /> Problem
                                        </button>
                                        <button
                                            onClick={() => setActiveTab(TABS.EXPLANATION)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === TABS.EXPLANATION ? TAB_STYLES.ACTIVE : TAB_STYLES.INACTIVE}`}
                                        >
                                            <BookOpen size={16} /> Explain
                                        </button>
                                        <button
                                            onClick={() => setActiveTab(TABS.TUTOR)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === TABS.TUTOR ? TAB_STYLES.ACTIVE : TAB_STYLES.INACTIVE}`}
                                        >
                                            <MessageCircle size={16} /> Tutor
                                        </button>
                                    </div>

                                    {/* Tab Content */}
                                    <div ref={contentRef} className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50 dark:bg-slate-800/50">
                                        {activeTab === TABS.PROBLEM && renderProblemTab()}
                                        {activeTab === TABS.EXPLANATION && (
                                            <SignInGate feature="solutions" description="Sign in to view detailed explanations, code solutions, and video walkthroughs.">
                                                {renderExplanationTab()}
                                            </SignInGate>
                                        )}
                                        {activeTab === TABS.TUTOR && renderTutorTab()}
                                    </div>
                                </div>
                            </ResizablePanel>

                            <ResizableHandle withHandle />

                            {/* RIGHT SIDE - Code Panel */}
                            <ResizablePanel defaultSize={66} minSize={30} className="bg-slate-50 dark:bg-slate-950">
                                <div className="flex flex-col h-full p-4 overflow-hidden">
                                    {renderPlaygroundTab()}
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    ) : (
                        /* Mobile: Tabbed View */
                        <div className="flex flex-col overflow-hidden h-full">
                            {/* Tabs */}
                            <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                <button
                                    onClick={() => setActiveTab(TABS.PROBLEM)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === TABS.PROBLEM ? TAB_STYLES.ACTIVE : TAB_STYLES.INACTIVE}`}
                                >
                                    <FileText size={16} /> Problem
                                </button>
                                <button
                                    onClick={() => setActiveTab(TABS.EXPLANATION)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === TABS.EXPLANATION ? TAB_STYLES.ACTIVE : TAB_STYLES.INACTIVE}`}
                                >
                                    <BookOpen size={16} /> Explain
                                </button>
                                <button
                                    onClick={() => setActiveTab(TABS.PLAYGROUND)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === TABS.PLAYGROUND ? TAB_STYLES.ACTIVE : TAB_STYLES.INACTIVE}`}
                                >
                                    <Terminal size={16} /> Code
                                </button>
                                <button
                                    onClick={() => setActiveTab(TABS.TUTOR)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === TABS.TUTOR ? TAB_STYLES.ACTIVE : TAB_STYLES.INACTIVE}`}
                                >
                                    <MessageCircle size={16} /> Tutor
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div ref={contentRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {activeTab === TABS.PROBLEM && renderProblemTab()}
                                {activeTab === TABS.EXPLANATION && (
                                    <SignInGate feature="solutions" description="Sign in to view detailed explanations, code solutions, and video walkthroughs.">
                                        {renderExplanationTab()}
                                    </SignInGate>
                                )}
                                {activeTab === TABS.TUTOR && renderTutorTab()}
                                {activeTab === TABS.PLAYGROUND && renderPlaygroundTab()}
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

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <AlertTriangle size={24} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Reset Code?</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                                Are you sure you want to reset your code? This will discard all your current changes.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowResetConfirm(false)}
                                    className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmReset}
                                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 transition-colors"
                                >
                                    Reset Code
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
