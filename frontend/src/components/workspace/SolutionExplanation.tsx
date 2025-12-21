import React, { useState } from 'react';
import type { Solution } from '../../types';
import { Youtube, Zap } from 'lucide-react';
import SmartVisualizer from '../SmartVisualizer';

interface SolutionExplanationProps {
    solution: Solution;
}

export const SolutionExplanation: React.FC<SolutionExplanationProps> = ({ solution }) => {
    const [activeApproach, setActiveApproach] = useState<'brute' | 'optimal'>('optimal');

    return (
        <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-4 duration-300 p-4 sm:p-6">
            {/* Approach Toggle */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                    onClick={() => setActiveApproach('brute')}
                    className={`flex-1 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${activeApproach === 'brute'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    Brute Force
                </button>
                <button
                    onClick={() => setActiveApproach('optimal')}
                    className={`flex-1 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${activeApproach === 'optimal'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    Optimal Solution
                </button>
            </div>

            {/* Visual / Video */}
            {/* Visual / Video */}
            {/* Visual */}
            {(solution.visualizationType || solution.animationSteps?.length) && (
                <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <SmartVisualizer solution={solution} />
                </div>
            )}

            {/* Video or Placeholder */}
            {solution.videoId && (
                <div className="aspect-video bg-black/5 dark:bg-black/20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center relative group">
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
            )}

            {!solution.visualizationType && !solution.animationSteps?.length && !solution.videoId && (
                <div className="aspect-video bg-black/5 dark:bg-black/20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center relative group">
                    <div className="text-center p-6">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Youtube size={24} />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Visualization coming soon</p>
                    </div>
                </div>
            )}

            {/* Explanation Content */}
            <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                        <Zap size={18} />
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        {activeApproach === 'optimal' ? 'Optimal Approach' : 'Brute Force Approach'}
                    </h3>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    {(activeApproach === 'optimal' ? solution.intuition : ["Iterate through properly."]).map((step, idx) => (
                        <div key={idx} className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 text-xs sm:text-sm font-bold border border-indigo-200 dark:border-indigo-500/30">
                                {idx + 1}
                            </div>
                            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed pt-0.5">{step}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
