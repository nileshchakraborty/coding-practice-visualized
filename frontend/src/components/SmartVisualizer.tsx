import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Solution } from '../types';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface SmartVisualizerProps {
    solution: Solution;
}

const SmartVisualizer: React.FC<SmartVisualizerProps> = ({ solution }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed] = useState(1000);
    const timerRef = useRef<number | null>(null);

    const steps = solution.animationSteps || solution.steps || [];
    const rawInitialState = solution.initialState || [];
    const initialState = typeof rawInitialState === 'string'
        ? rawInitialState.split('')
        : rawInitialState;

    const totalSteps = steps.length;

    // Helper to determine active state for rendering
    const getActiveState = () => {
        // In a real robust engine, we'd replay all steps to get current state
        // For simplicity (MVP), we treat "initialState" as base, and just highlight on top
        // Ideally, we'd support 'swap' or 'move' operations modifying the array

        // Let's support 'swap' trivially? 
        // We'll compute the array state at the current step
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const currentArray = [...initialState];

        // Replay up to current step
        for (let i = 0; i < currentStep; i++) {
            // If we had 'swap' or 'set' types, we'd apply them here
            // For now, we only have highlights, which are transient per step
        }

        return currentArray;
    };

    const currentArray = getActiveState();
    const activeStepData = currentStep > 0 ? steps[currentStep - 1] : null;

    useEffect(() => {
        if (isPlaying) {
            timerRef.current = window.setInterval(() => {
                setCurrentStep(prev => {
                    if (prev < totalSteps) return prev + 1;
                    setIsPlaying(false);
                    return prev;
                });
            }, speed);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPlaying, totalSteps, speed]);

    const handleNext = () => {
        if (currentStep < totalSteps) setCurrentStep(c => c + 1);
    };

    const handlePrev = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
    };

    return (
        <div className="flex flex-col items-center w-full">
            {/* Controls */}
            <div className="viz-controls flex gap-4 mb-6 p-2 bg-slate-800 rounded-lg border border-slate-700">
                <button onClick={handlePrev} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-300 hover:text-white">
                    <SkipBack size={20} />
                </button>
                <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-300 hover:text-white">
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button onClick={handleNext} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-300 hover:text-white">
                    <SkipForward size={20} />
                </button>
                <span className="text-sm font-mono text-slate-400 self-center min-w-[80px] text-center">
                    {currentStep} / {totalSteps}
                </span>
            </div>

            {/* Stage */}
            <div className="viz-stage relative w-full min-h-[250px] bg-[#0d0d15] rounded-xl border border-slate-700/50 flex flex-col items-center justify-center p-8 overflow-hidden">

                {/* Array Container */}
                <div className="viz-array-container flex gap-3 relative z-10">
                    <AnimatePresence>
                        {currentArray.map((val: any, idx: number) => {
                            const isHighlighted = activeStepData?.indices?.includes(idx);

                            // Determine color class based on current step
                            let colorClass = "border-slate-700 bg-slate-800";
                            if (isHighlighted) {
                                if (activeStepData?.color === 'success') colorClass = "border-emerald-500 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.4)]";
                                else if (activeStepData?.color === 'accent') colorClass = "border-indigo-500 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.4)]";
                                else colorClass = "border-slate-500 bg-slate-700";
                            }

                            return (
                                <motion.div
                                    key={`item-${idx}`}
                                    layout
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-lg border-2 text-lg font-bold transition-colors duration-300 ${colorClass}`}
                                >
                                    <span className="text-white">{val}</span>

                                    {/* Index */}
                                    <span className="absolute -bottom-6 text-xs text-slate-500 font-mono">{idx}</span>

                                    {/* Pointers */}
                                    {activeStepData?.pointers?.map((ptr, pIdx) => (
                                        ptr.index === idx && (
                                            <motion.div
                                                key={`ptr-${pIdx}`}
                                                initial={{ y: -10, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                className="absolute -top-8 text-indigo-400 text-sm font-bold flex flex-col items-center"
                                            >
                                                {ptr.label}
                                                <span>↓</span>
                                            </motion.div>
                                        )
                                    ))}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Message */}
                <AnimatePresence mode='wait'>
                    {activeStepData?.transientMessage && (
                        <motion.div
                            key={`msg-${currentStep}`}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="absolute bottom-6 bg-slate-900/90 border border-slate-700 px-4 py-2 rounded-full text-sm text-slate-200 backdrop-blur-sm"
                        >
                            {activeStepData.transientMessage}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Legacy Support: Visual & Explanation */}
                {activeStepData?.visual && (
                    <div className="mt-8 p-4 bg-slate-900/50 rounded-lg border border-slate-800 w-full max-w-lg">
                        <pre className="font-mono text-xs md:text-sm text-slate-300 overflow-x-auto whitespace-pre">
                            {activeStepData.visual}
                        </pre>
                        {activeStepData.explanation && (
                            <p className="mt-2 text-sm text-slate-400 italic border-t border-slate-800 pt-2">
                                {activeStepData.explanation}
                            </p>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default SmartVisualizer;
