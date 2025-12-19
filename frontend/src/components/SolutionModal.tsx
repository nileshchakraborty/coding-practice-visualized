import React, { useState } from 'react';
import type { Solution, TestCaseResult } from '../types';
import SmartVisualizer from './SmartVisualizer';
import TutorChat from './TutorChat';
import { X, Code as CodeIcon, BookOpen, Terminal, Play, ExternalLink, Youtube, FileText, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import axios from 'axios';
import Editor from '@monaco-editor/react';

interface SolutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    solution: Solution | null;
    slug: string | null;
}

const SolutionModal: React.FC<SolutionModalProps> = ({ isOpen, onClose, solution, slug }) => {
    const [activeTab, setActiveTab] = useState<'problem' | 'explanation' | 'playground' | 'tutor'>('problem');
    const [code, setCode] = useState(solution?.code || '');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    // Single Custom Test Case State (editable, temporary)
    const [customTestCase, setCustomTestCase] = useState<{ input: string; output: string } | null>(null);

    // Tutor Chat State (persisted across tab switches)
    const [tutorMessages, setTutorMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

    // Update code when solution changes if code is empty so we don't overwrite user edits unexpectedly
    // actually better to just reset on open?
    // for now let's use a key or effect
    React.useEffect(() => {
        if (solution?.code) {
            // Fix: Unescape newlines if they are literal string characters (common from some JSON sources)
            const formattedCode = solution.code.replace(/\\n/g, '\n');
            setCode(formattedCode);
            setOutput('');
        }
    }, [solution]);

    // Initialize tutor greeting when solution changes
    React.useEffect(() => {
        if (solution?.title) {
            setTutorMessages([{
                role: 'assistant',
                content: `Hi! I'm your AI Tutor. I can help you understand **${solution.title}**. Ask me about the brute force approach, time complexity, or for a hint!`
            }]);
        }
    }, [solution?.title]);

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

            const res = await axios.post('/api/run', {
                code: code,
                slug: slug,
                testCases: allTestCases.length > 0 ? allTestCases : undefined
            });

            if (res.data.success) {
                // Determine logic based on runner response structure
                // Runner returns { results: [...], success: bool }
                // Let's format it nicel
                if (res.data.results) {
                    const allPassed = res.data.results.every((r: TestCaseResult) => r.passed);
                    const outputMsg = res.data.results.map((r: TestCaseResult, i: number) => {
                        if (r.error) {
                            return `Test Case ${i + 1}: ERROR ⚠️\nInput: ${r.input}\nError: ${r.error}\n`;
                        }
                        return `Test Case ${i + 1}: ${r.passed ? 'PASSED ✅' : 'FAILED ❌'}\nInput: ${r.input}\nExpected: ${r.expected}\nActual: ${r.actual}\n`;
                    }).join('\n-------------------\n');

                    setOutput(allPassed ? `All Test Cases Passed! 🎉\n\n${outputMsg}` : `Some Tests Failed.\n\n${outputMsg}`);
                } else if (res.data.error) {
                    setOutput(`Error: ${res.data.error}`);
                } else {
                    setOutput(JSON.stringify(res.data, null, 2));
                }
            } else {
                setOutput(`Execution Failed:\n${res.data.error || 'Unknown error'}`);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setOutput(`Network Error: ${errorMessage}`);
        } finally {
            setIsRunning(false);
        }
    };



    if (!isOpen || !solution) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#1a1a2e] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors z-50"
                >
                    <X size={24} />
                </button>

                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-700 bg-[#16162a]">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{solution.patternEmoji || '💡'}</span>
                        <h2 className="text-2xl font-bold text-white">{solution.title}</h2>
                        {solution.pattern && (
                            <span className="px-3 py-1 text-sm font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                                {solution.pattern}
                            </span>
                        )}
                    </div>

                    <div className="flex gap-4 text-sm text-slate-400">
                        <div className="flex gap-2">
                            <span className="font-semibold text-emerald-400">Time:</span> {solution.timeComplexity}
                        </div>
                        <div className="flex gap-2">
                            <span className="font-semibold text-emerald-400">Space:</span> {solution.spaceComplexity}
                        </div>
                    </div>

                    {/* External Link removed - moved to bottom */}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 px-8 py-2 border-b border-slate-700 bg-[#131320]">
                    <button
                        onClick={() => setActiveTab('problem')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'problem' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <FileText size={16} /> Problem
                    </button>
                    <button
                        onClick={() => setActiveTab('explanation')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'explanation' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <BookOpen size={16} /> Explanation
                    </button>
                    <button
                        onClick={() => setActiveTab('playground')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'playground' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Terminal size={16} /> Playground
                    </button>
                    <button
                        onClick={() => setActiveTab('tutor')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'tutor' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <MessageCircle size={16} /> AI Tutor
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'problem' ? (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                            {/* Problem Description */}
                            <div className="space-y-4">
                                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                                    📋 Problem Description
                                </h3>
                                <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                    <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-line">
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
                                        <div key={i} className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="px-2 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-300 rounded">
                                                    Example {i + 1}
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                <div>
                                                    <span className="text-xs uppercase text-slate-500 font-semibold">Input:</span>
                                                    <pre className="mt-1 p-3 bg-slate-900 rounded-lg text-sm text-cyan-300 overflow-x-auto">
                                                        <code>{ex.input}</code>
                                                    </pre>
                                                </div>
                                                <div>
                                                    <span className="text-xs uppercase text-slate-500 font-semibold">Output:</span>
                                                    <pre className="mt-1 p-3 bg-slate-900 rounded-lg text-sm text-emerald-300 overflow-x-auto">
                                                        <code>{ex.output}</code>
                                                    </pre>
                                                </div>
                                                {'explanation' in ex && typeof (ex as { explanation?: string }).explanation === 'string' && (
                                                    <div>
                                                        <span className="text-xs uppercase text-slate-500 font-semibold">Explanation:</span>
                                                        <p className="mt-1 text-slate-300 text-sm">{(ex as { explanation: string }).explanation}</p>
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
                                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                        <ul className="space-y-1">
                                            {solution.constraints.map((c, i) => (
                                                <li key={i} className="text-slate-300 font-mono text-sm flex items-start gap-2">
                                                    <span className="text-indigo-400">•</span> {c}
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
                                                <summary className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 cursor-pointer hover:bg-amber-500/20 transition-colors">
                                                    <span className="ml-2 font-medium">Hint {i + 1}</span>
                                                </summary>
                                                <div className="mt-2 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300">
                                                    {hint}
                                                </div>
                                            </details>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Complexity Analysis */}
                            <div className="space-y-4">
                                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                                    ⚡ Complexity Analysis
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                                        <div className="text-sm text-emerald-400 font-semibold mb-1">Time Complexity</div>
                                        <div className="text-xl text-white font-mono">{solution.timeComplexity || 'N/A'}</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30">
                                        <div className="text-sm text-blue-400 font-semibold mb-1">Space Complexity</div>
                                        <div className="text-xl text-white font-mono">{solution.spaceComplexity || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Key Insight */}
                            {solution.keyInsight && (
                                <div className="p-6 rounded-xl border-l-4 border-amber-500 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                                    <h3 className="text-lg font-semibold text-amber-300 mb-1">🔑 Key Insight</h3>
                                    <p className="text-slate-200 text-lg leading-relaxed">{solution.keyInsight}</p>
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
                                            <span key={i} className="px-3 py-1.5 text-sm bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full hover:bg-indigo-500/30 transition-colors cursor-pointer">
                                                {related.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* External Resources */}
                            <div className="space-y-4">
                                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                                    📚 External Resources
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {slug && (
                                        <>
                                            <a
                                                href={`https://leetcode.com/problems/${slug}/`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 transition-colors"
                                            >
                                                <ExternalLink size={16} /> LeetCode
                                            </a>
                                            <a
                                                href={`https://neetcode.io/problems/${slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
                                            >
                                                <ExternalLink size={16} /> NeetCode
                                            </a>
                                            <a
                                                href={`https://takeuforward.org/plus/dsa/all-problems`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors"
                                            >
                                                <ExternalLink size={16} /> TakeUForward
                                            </a>
                                        </>
                                    )}
                                    {solution.videoId && (
                                        <a
                                            href={`https://www.youtube.com/watch?v=${solution.videoId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                                        >
                                            <Youtube size={16} /> Video Solution
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'explanation' ? (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">

                            {/* YouTube Video Player */}
                            {solution.videoId && (
                                <div className="space-y-4">
                                    <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                                        <Youtube size={16} className="text-red-500" /> Video Explanation
                                    </h3>
                                    <div className="relative w-full rounded-xl overflow-hidden border border-slate-700 shadow-2xl" style={{ paddingBottom: '56.25%' }}>
                                        <iframe
                                            className="absolute top-0 left-0 w-full h-full"
                                            src={`https://www.youtube.com/embed/${solution.videoId}`}
                                            title={`${solution.title} - Video Explanation`}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                </div>
                            )}

                            {/* One-liner */}
                            <div className="p-6 rounded-xl border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                                <h3 className="text-lg font-semibold text-indigo-300 mb-1">💡 Quick Summary</h3>
                                <p className="text-slate-200 text-lg leading-relaxed">{solution.oneliner}</p>
                            </div>

                            {/* Intuition */}
                            <div className="space-y-4">
                                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                                    🧠 Core Intuition
                                </h3>
                                <div className="grid gap-3">
                                    {solution.intuition?.map((item, i) => (
                                        <div key={i} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300">
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Visualization */}
                            <div className="space-y-4">
                                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                                    📝 Visualization
                                </h3>

                                {solution.visualizationType ? (
                                    <SmartVisualizer solution={solution} />
                                ) : (
                                    // Fallback for legacy visual/steps
                                    <div className="space-y-4">
                                        {solution.steps?.map((step) => (
                                            <div key={step.step} className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">{step.step}</span>
                                                    <h4 className="font-semibold text-white">{step.title}</h4>
                                                </div>
                                                <pre className="font-mono text-sm bg-black/30 p-4 rounded-lg text-emerald-300 overflow-x-auto mb-2 whitespace-pre-wrap leading-relaxed border border-slate-700/50">
                                                    {step.visual}
                                                </pre>
                                                <p className="text-slate-400 ml-1">{step.explanation}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Code Read-only */}
                            <div className="space-y-4">
                                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                                    <CodeIcon size={16} /> Python Code
                                </h3>
                                <div className="rounded-xl overflow-hidden border border-slate-700">
                                    <SyntaxHighlighter
                                        language="python"
                                        style={vscDarkPlus}
                                        customStyle={{ margin: 0, padding: '1.5rem', background: '#0d0d15' }}
                                    >
                                        {solution.code}
                                    </SyntaxHighlighter>
                                </div>
                            </div>

                            {/* External Resources */}
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

                                    {solution.takeuforwardLink && (
                                        <a
                                            href={solution.takeuforwardLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-pink-500/50 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-white group-hover:text-pink-400 transition-colors">TakeUForward</div>
                                                    <div className="text-xs text-slate-500">In-depth Article</div>
                                                </div>
                                            </div>
                                            <ExternalLink size={16} className="text-slate-500 group-hover:text-pink-500" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'tutor' ? (
                        <div className="h-full animate-in slide-in-from-bottom-4 duration-300">
                            {slug && solution ? (
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
                    ) : (
                        <div className="h-full min-h-[600px] flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-300">
                            <div className="flex-1 bg-[#0d0d15] rounded-xl border border-slate-700 overflow-hidden relative group min-h-[400px]">
                                <div className="absolute top-0 left-0 right-0 px-4 py-2 bg-[#1a1a2e] border-b border-slate-700 text-xs text-slate-500 font-mono flex justify-between items-center z-10">
                                    <span>main.py</span>
                                </div>
                                <div className="absolute inset-0 top-[37px] w-full">
                                    <Editor
                                        height="100%"
                                        language="python"
                                        value={code}
                                        onChange={(value) => setCode(value || '')}
                                        theme="vs-dark"
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            lineNumbers: 'on',
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                            padding: { top: 10 },
                                            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                                            renderLineHighlight: 'none',
                                            hideCursorInOverviewRuler: true,
                                            overviewRulerBorder: false,
                                            scrollbar: {
                                                vertical: 'hidden',
                                                horizontal: 'hidden'
                                            }
                                        }}
                                        loading={<div className="text-slate-500 p-4">Loading Editor...</div>}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center bg-[#16162a] p-2 rounded-lg border border-slate-700">
                                <span className="text-sm text-slate-400 font-mono pl-2">
                                    {solution.testCases?.length || 0} Test Cases Available
                                </span>
                                <button
                                    onClick={handleRunCode}
                                    disabled={isRunning}
                                    className={`px-6 py-2 font-semibold rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 ${isRunning ? 'bg-slate-700 cursor-not-allowed text-slate-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                                >
                                    <Play size={16} /> {isRunning ? 'Running...' : 'Run Code'}
                                </button>
                            </div>

                            {/* Test Cases & Output Area */}
                            <div className="flex-1 bg-black rounded-xl border border-slate-800 overflow-hidden flex flex-col md:flex-row">
                                {/* Test Cases List */}
                                <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-slate-800 p-4 bg-[#0d0d15] overflow-y-auto custom-scrollbar flex flex-col">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Test Cases</h4>

                                    <div className="space-y-3 flex-1">
                                        {/* Built-in Test Cases */}
                                        {solution.testCases?.map((testCase, i) => (
                                            <div key={`builtin-${i}`} className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                                                <div className="text-xs text-slate-500 mb-1 font-mono">Built-in {i + 1}</div>
                                                <div className="text-xs text-slate-400 mb-1 font-mono">Input:</div>
                                                <div className="text-sm text-indigo-300 font-mono break-all mb-2">{testCase.input}</div>
                                                <div className="text-xs text-slate-400 mb-1 font-mono">Expected:</div>
                                                <div className="text-sm text-emerald-300 font-mono break-all">{testCase.output}</div>
                                            </div>
                                        ))}

                                        {/* Single Editable Custom Test Case */}
                                        <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="text-xs text-indigo-400 font-mono font-bold">Custom Test</div>
                                                {customTestCase ? (
                                                    <button
                                                        onClick={() => setCustomTestCase(null)}
                                                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                                        title="Remove custom test"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setCustomTestCase({ input: '', output: '' })}
                                                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                                    >
                                                        <Plus size={14} />
                                                        <span>Add</span>
                                                    </button>
                                                )}
                                            </div>

                                            {customTestCase && (
                                                <div className="space-y-2">
                                                    <div>
                                                        <label className="text-xs text-slate-400 font-mono block mb-1">Input:</label>
                                                        <input
                                                            value={customTestCase.input}
                                                            onChange={(e) => setCustomTestCase(prev => prev ? ({
                                                                ...prev,
                                                                input: e.target.value
                                                            }) : null)}
                                                            className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-indigo-300 focus:border-indigo-500 outline-none placeholder:text-slate-700"
                                                            placeholder="hand = [1,2,3], groupSize = 3"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-400 font-mono block mb-1">Expected:</label>
                                                        <input
                                                            value={customTestCase.output}
                                                            onChange={(e) => setCustomTestCase(prev => prev ? ({
                                                                ...prev,
                                                                output: e.target.value
                                                            }) : null)}
                                                            className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-emerald-300 focus:border-emerald-500 outline-none placeholder:text-slate-700"
                                                            placeholder="True"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Execution Results */}
                                <div className="flex-1 p-4 bg-[#0a0a12] overflow-y-auto custom-scrollbar font-mono text-sm">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Output</h4>
                                    {output ? (
                                        <div className="whitespace-pre-wrap text-slate-300">{output}</div>
                                    ) : (
                                        <div className="text-slate-600 italic flex flex-col items-center justify-center h-40">
                                            <Terminal size={32} className="mb-2 opacity-50" />
                                            <span>Run code to see results...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SolutionModal;
