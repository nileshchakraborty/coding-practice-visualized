import React from 'react';
import type { Solution } from '../../types';
import { Brain, ArrowRight, Lightbulb, ChevronDown, Zap, Key, Link as LinkIcon, ExternalLink, BookOpen, Rocket } from 'lucide-react';

interface SolutionDescriptionProps {
    solution: Solution;
    onSelectProblem: (slug: string) => void;
}

export const SolutionDescription: React.FC<SolutionDescriptionProps> = ({ solution, onSelectProblem }) => {
    return (
        <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-4 duration-300 p-4 sm:p-6">
            {/* Problem Description */}
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                        <Brain size={18} />
                    </span>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Problem Description</h3>
                </div>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
                        {solution.description || "No description available."}
                    </p>
                </div>
            </div>

            {/* Examples */}
            {solution.examples && solution.examples.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Examples</h3>
                    <div className="grid gap-3 sm:gap-4">
                        {solution.examples.map((example, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700">
                                <div className="space-y-2">
                                    <div className="flex gap-2 text-xs sm:text-sm">
                                        <span className="font-semibold text-slate-500 dark:text-slate-400 w-16">Input:</span>
                                        <code className="flex-1 font-mono text-slate-800 dark:text-slate-200">{example.input}</code>
                                    </div>
                                    <div className="flex gap-2 text-xs sm:text-sm">
                                        <span className="font-semibold text-slate-500 dark:text-slate-400 w-16">Output:</span>
                                        <code className="flex-1 font-mono text-slate-800 dark:text-slate-200">{example.output}</code>
                                    </div>
                                    {example.explanation && (
                                        <div className="flex gap-2 text-xs sm:text-sm">
                                            <span className="font-semibold text-slate-500 dark:text-slate-400 w-16">Explain:</span>
                                            <span className="flex-1 text-slate-600 dark:text-slate-300">{example.explanation}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Constraints */}
            {solution.constraints && solution.constraints.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Constraints</h3>
                    <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 marker:text-slate-400">
                        {solution.constraints.map((constraint, idx) => (
                            <li key={idx} className="pl-2 relative">
                                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                                    {constraint}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Hints */}
            {solution.hints && solution.hints.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Hints</h3>
                    <div className="space-y-2">
                        {solution.hints.map((hint, idx) => (
                            <details key={idx} className="group bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 open:bg-indigo-50 dark:open:bg-indigo-900/10 open:border-indigo-200 dark:open:border-indigo-800 transition-colors">
                                <summary className="flex items-center justify-between p-3 cursor-pointer list-none text-sm font-medium text-slate-700 dark:text-slate-200">
                                    <div className="flex items-center gap-2">
                                        <Lightbulb size={16} className="text-amber-500" />
                                        <span>Hint {idx + 1}</span>
                                    </div>
                                    <ChevronDown size={16} className="text-slate-400 transition-transform group-open:rotate-180" />
                                </summary>
                                <div className="px-3 pb-3 pt-0 text-sm text-slate-600 dark:text-slate-300">
                                    {hint}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            )}

            {/* Complexity Analysis */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <span className="text-amber-500">
                        <Zap size={16} />
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Complexity Analysis</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Time Complexity</div>
                        <div className="text-xl sm:text-2xl font-mono font-bold text-slate-900 dark:text-white">
                            {solution.timeComplexity}
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Space Complexity</div>
                        <div className="text-xl sm:text-2xl font-mono font-bold text-slate-900 dark:text-white">
                            {solution.spaceComplexity}
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Insight (Dark Card) */}
            <div className="relative overflow-hidden rounded-xl bg-slate-900 dark:bg-black border border-slate-800 dark:border-slate-800 p-6 shadow-xl">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Key size={120} className="text-white transform rotate-12" />
                </div>
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 mb-2">
                        <Key size={20} />
                        <h3 className="font-bold text-lg">Key Insight</h3>
                    </div>
                    <p className="text-lg font-medium text-slate-100 leading-relaxed">
                        {solution.keyInsight}
                    </p>
                </div>
            </div>

            {/* Related Problems */}
            {solution.relatedProblems && solution.relatedProblems.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <LinkIcon size={16} className="text-slate-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Related Problems</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {solution.relatedProblems.map((slug, idx) => (
                            <span key={idx} className="px-3 py-1.5 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">
                                {slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* External Resources */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">External Resources</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                    {solution.leetcodeLink && (
                        <a href={solution.leetcodeLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#FFA116]/10 text-[#FFA116] rounded-lg border border-[#FFA116]/20 hover:bg-[#FFA116]/20 transition-colors text-sm font-medium">
                            <ExternalLink size={14} />
                            LeetCode
                        </a>
                    )}
                    {solution.neetcodeLink && (
                        <a href={solution.neetcodeLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-sm font-medium">
                            <ExternalLink size={14} />
                            NeetCode
                        </a>
                    )}
                    {solution.takeuforwardLink && (
                        <a href={solution.takeuforwardLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-500/20 hover:bg-rose-500/20 transition-colors text-sm font-medium">
                            <ExternalLink size={14} />
                            TakeUForward
                        </a>
                    )}
                </div>
            </div>

            {/* Suggested Next Question - Banner Style */}
            {solution.suggestedNextQuestion && (
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-4">
                        <Rocket size={16} className="text-indigo-500" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Next in Learning Path</h3>
                    </div>
                    <div
                        onClick={() => onSelectProblem(solution.suggestedNextQuestion!.slug)}
                        className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4">
                            <Rocket size={100} className="text-white" />
                        </div>
                        <div className="relative z-10">
                            <div className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-2"> Mastering {solution.pattern} Pattern</div>
                            <h3 className="text-xl font-bold mb-1">{solution.suggestedNextQuestion.title}</h3>
                            <div className="flex items-center gap-2 mt-4">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold bg-white/20 text-white backdrop-blur-sm`}>
                                    {solution.suggestedNextQuestion.difficulty}
                                </span>
                                <span className="text-indigo-200">•</span>
                                <span className="text-sm font-medium text-indigo-100">Click to start challenge</span>
                                <ArrowRight size={16} className="ml-auto group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
