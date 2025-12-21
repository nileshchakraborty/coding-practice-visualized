import React, { useState } from 'react';
import type { Solution, TestCaseResult } from '../../types';
import { Play, CheckCircle2, XCircle, Plus, Trash2, Terminal } from 'lucide-react';

interface SolutionTestRunnerProps {
    solution: Solution;
    isRunning: boolean;
    onRun: (customCases?: { input: string; expected: string }[]) => void;
    output: string[] | null;
    testResults: TestCaseResult[] | null;
}

export const SolutionTestRunner: React.FC<SolutionTestRunnerProps> = ({ solution, isRunning, onRun, output, testResults }) => {
    const [activeTab, setActiveTab] = useState<'cases' | 'results' | 'console'>('cases');
    const [customCases, setCustomCases] = useState<{ input: string; expected: string }[]>([]);

    const handleAddCase = () => {
        setCustomCases([...customCases, { input: '', expected: '' }]);
    };

    const handleRemoveCase = (index: number) => {
        setCustomCases(customCases.filter((_, i) => i !== index));
    };

    const handleCaseChange = (index: number, field: 'input' | 'expected', value: string) => {
        const newCases = [...customCases];
        newCases[index][field] = value;
        setCustomCases(newCases);
    };

    const handleRun = () => {
        setActiveTab('results');
        onRun(customCases.length > 0 ? customCases : undefined);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setActiveTab('cases')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'cases' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Test Cases
                    </button>
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'results' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Test Results
                    </button>
                    <button
                        onClick={() => setActiveTab('console')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'console' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Console
                    </button>
                </div>
                <button
                    onClick={handleRun}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    {isRunning ? (
                        <>Running...</>
                    ) : (
                        <>
                            <Play size={14} fill="currentColor" /> Run Code
                        </>
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'cases' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Default Examples */}
                            {(solution.examples || []).map((example, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase">Case {idx + 1}</h4>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Input</span>
                                            <div className="mt-1 p-2 bg-slate-50 dark:bg-slate-800 rounded font-mono text-xs text-slate-700 dark:text-slate-300 break-all border border-slate-100 dark:border-slate-700">
                                                {example.input}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Expected</span>
                                            <div className="mt-1 p-2 bg-slate-50 dark:bg-slate-800 rounded font-mono text-xs text-slate-700 dark:text-slate-300 break-all border border-slate-100 dark:border-slate-700">
                                                {example.output}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Custom Cases */}
                            {customCases.map((customCase, idx) => (
                                <div key={`custom-${idx}`} className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-dashed border-indigo-300 dark:border-indigo-700 shadow-sm relative group">
                                    <button
                                        onClick={() => handleRemoveCase(idx)}
                                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-bold text-indigo-500 uppercase">Custom Case {idx + 1}</h4>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Input</span>
                                            <input
                                                type="text"
                                                value={customCase.input}
                                                onChange={(e) => handleCaseChange(idx, 'input', e.target.value)}
                                                className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 rounded font-mono text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none"
                                                placeholder="e.g. nums = [1,2]"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Expected</span>
                                            <input
                                                type="text"
                                                value={customCase.expected}
                                                onChange={(e) => handleCaseChange(idx, 'expected', e.target.value)}
                                                className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 rounded font-mono text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none"
                                                placeholder="e.g. 3"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add Case Button */}
                            <button
                                onClick={handleAddCase}
                                className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-colors">
                                    <Plus size={20} />
                                </div>
                                <span className="text-sm font-medium text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Add Case</span>
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'results' && (
                    <div className="space-y-4">
                        {!testResults ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <Play size={32} className="mb-2 opacity-50" />
                                <p className="text-sm">Run code to see results</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {testResults.map((result, idx) => (
                                    <div key={idx} className={`rounded-xl border p-4 ${result.passed ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20' : 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/20'}`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            {result.passed ? (
                                                <CheckCircle2 size={18} className="text-emerald-500" />
                                            ) : (
                                                <XCircle size={18} className="text-rose-500" />
                                            )}
                                            <span className={`text-sm font-bold ${result.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                                Case {idx + 1} {result.passed ? 'Passed' : 'Failed'}
                                            </span>
                                        </div>
                                        <div className="space-y-2 text-xs font-mono">
                                            <div className="flex gap-2">
                                                <span className="text-slate-500 w-16">Input:</span>
                                                <span className="text-slate-700 dark:text-slate-300">{result.input}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="text-slate-500 w-16">Expected:</span>
                                                <span className="text-slate-700 dark:text-slate-300">{result.expected}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="text-slate-500 w-16">Actual:</span>
                                                <span className={`${result.passed ? 'text-emerald-600' : 'text-rose-600'}`}>{result.actual}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'console' && (
                    <div className="font-mono text-xs sm:text-sm">
                        {!output || output.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <Terminal size={32} className="mb-2 opacity-50" />
                                <p className="text-sm">No console output</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {output.map((line, idx) => (
                                    <div key={idx} className="border-b border-slate-100 dark:border-slate-800 last:border-0 py-1 text-slate-600 dark:text-slate-300">
                                        <span className="text-slate-400 mr-2 select-none">$</span>
                                        {line}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
