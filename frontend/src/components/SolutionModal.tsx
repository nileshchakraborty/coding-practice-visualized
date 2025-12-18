import React, { useState } from 'react';
import type { Solution, TestCaseResult } from '../types';
import SmartVisualizer from './SmartVisualizer';
import { X, Code as CodeIcon, BookOpen, Terminal, Play } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import axios from 'axios';

interface SolutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    solution: Solution | null;
    slug: string | null;
}

const SolutionModal: React.FC<SolutionModalProps> = ({ isOpen, onClose, solution, slug }) => {
    const [activeTab, setActiveTab] = useState<'explanation' | 'playground'>('explanation');
    const [code, setCode] = useState(solution?.code || '');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);

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

    const handleRunCode = async () => {
        if (!slug) return;
        setIsRunning(true);
        setOutput('Running code...');
        try {
            const res = await axios.post('/api/run', {
                code: code,
                slug: slug
            });

            if (res.data.success) {
                // Determine logic based on runner response structure
                // Runner returns { results: [...], success: bool }
                // Let's format it nicel
                if (res.data.results) {
                    const allPassed = res.data.results.every((r: TestCaseResult) => r.passed);
                    const outputMsg = res.data.results.map((r: TestCaseResult, i: number) =>
                        `Test Case ${i + 1}: ${r.passed ? 'PASSED ✅' : 'FAILED ❌'}\nInput: ${r.input}\nExpected: ${r.expected}\nActual: ${r.actual}\n`
                    ).join('\n-------------------\n');

                    setOutput(allPassed ? `All Test Cases Passed! 🎉\n\n${outputMsg}` : `Some Tests Failed.\n\n${outputMsg}`);
                } else if (res.data.error) {
                    setOutput(`Error: ${res.data.error}`);
                } else {
                    setOutput(JSON.stringify(res.data, null, 2));
                }
            } else {
                setOutput(`Execution Failed:\n${res.data.error || 'Unknown error'}`);
            }
        } catch (err: any) {
            setOutput(`Network Error: ${err.message}`);
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
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 px-8 py-2 border-b border-slate-700 bg-[#131320]">
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
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'explanation' ? (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">

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
                                    {solution.intuition.map((item, i) => (
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
                        </div>
                    ) : (
                        <div className="h-full flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-300">
                            <div className="flex-1 bg-[#0d0d15] rounded-xl border border-slate-700 overflow-hidden relative group">
                                <div className="absolute top-0 left-0 right-0 px-4 py-2 bg-[#1a1a2e] border-b border-slate-700 text-xs text-slate-500 font-mono flex justify-between items-center">
                                    <span>main.py</span>
                                </div>
                                <textarea
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full h-full p-4 pt-12 bg-transparent text-slate-200 font-mono text-sm resize-none focus:outline-none"
                                    spellCheck={false}
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleRunCode}
                                    disabled={isRunning}
                                    className={`px-6 py-2 font-semibold rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 ${isRunning ? 'bg-slate-700 cursor-not-allowed text-slate-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                                >
                                    <Play size={16} /> {isRunning ? 'Running...' : 'Run Code'}
                                </button>
                            </div>
                            {/* Output console */}
                            <div className="h-48 bg-black rounded-xl border border-slate-800 p-4 font-mono text-sm text-slate-400 overflow-y-auto whitespace-pre-wrap">
                                {output || 'Run the code to see output...'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SolutionModal;
