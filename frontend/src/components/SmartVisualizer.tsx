import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Solution } from '../types';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { TreeVisualizer, LinkedListVisualizer, MatrixVisualizer, GraphVisualizer } from './visualizers';

// Tree node interface for building trees from arrays
interface TreeNode {
    val: number | string | null;
    left?: TreeNode | null;
    right?: TreeNode | null;
}

// Build tree from level-order array (e.g., [3, 9, 20, null, null, 15, 7])
const buildTreeFromArray = (arr: (number | string | null)[]): TreeNode | null => {
    if (!arr || arr.length === 0 || arr[0] === null) return null;

    const root: TreeNode = { val: arr[0] };
    const queue: TreeNode[] = [root];
    let i = 1;

    while (queue.length > 0 && i < arr.length) {
        const node = queue.shift()!;

        // Left child
        if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
            node.left = { val: arr[i] };
            queue.push(node.left);
        }
        i++;

        // Right child
        if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
            node.right = { val: arr[i] };
            queue.push(node.right);
        }
        i++;
    }

    return root;
};

// Linked list node interface
interface ListNode {
    val: number | string;
    next?: ListNode | null;
}

// Build linked list from array
const buildListFromArray = (arr: (number | string)[]): ListNode | null => {
    if (!arr || arr.length === 0) return null;

    const head: ListNode = { val: arr[0] };
    let current = head;

    for (let i = 1; i < arr.length; i++) {
        current.next = { val: arr[i] };
        current = current.next;
    }

    return head;
};

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
    const visualizationType = solution.visualizationType || 'array';

    const totalSteps = steps.length;

    // Compute activeStepData first since getActiveState needs it
    const activeStepData = currentStep > 0 ? steps[currentStep - 1] : null;

    // Helper to determine active state for rendering
    const getActiveState = (): (number | string)[] => {
        if (currentStep === 0 || !activeStepData) {
            return [...initialState] as (number | string)[];
        }

        // Use arrayState if available
        if (activeStepData?.arrayState && activeStepData.arrayState.length > 0) {
            return [...activeStepData.arrayState];
        }

        // Try to parse array from visual field (legacy support)
        if (activeStepData?.visual) {
            // Look for patterns like [1,2,3,0,0,6] or nums1: [1,2,3,0,0,0]
            const arrayMatch = activeStepData.visual.match(/\[([^\]]+)\]/);
            if (arrayMatch) {
                try {
                    const parsed = JSON.parse('[' + arrayMatch[1] + ']');
                    if (Array.isArray(parsed) && parsed.length === initialState.length) {
                        return parsed;
                    }
                } catch {
                    // Parsing failed, use initial state
                }
            }
        }

        return [...initialState] as (number | string)[];
    };

    const currentArray = getActiveState();

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

    // Render appropriate visualizer based on type
    const renderVisualizer = () => {
        const highlightedIndices = activeStepData?.indices || [];

        switch (visualizationType) {
            case 'tree': {
                // Build tree from treeRoot or from initialState array
                const treeRoot = solution.treeRoot
                    ? solution.treeRoot
                    : buildTreeFromArray(initialState as (number | string | null)[]);
                return (
                    <TreeVisualizer
                        root={treeRoot as TreeNode}
                        highlightedNodes={highlightedIndices as (number | string)[]}
                    />
                );
            }

            case 'linkedlist': {
                // Build linked list from listHead or from initialState array
                const listHead = solution.listHead
                    ? solution.listHead
                    : buildListFromArray(initialState as (number | string)[]);
                return (
                    <LinkedListVisualizer
                        head={listHead as ListNode}
                        highlightedIndices={highlightedIndices as number[]}
                        pointers={activeStepData?.pointers || []}
                    />
                );
            }

            case 'matrix':
            case 'grid':
                return (
                    <MatrixVisualizer
                        matrix={solution.matrix || initialState as any}
                        highlightedCells={[]}
                        currentCell={undefined}
                    />
                );

            case 'graph':
                return (
                    <GraphVisualizer
                        nodes={solution.graphNodes || []}
                        edges={solution.graphEdges || []}
                        highlightedNodes={highlightedIndices as (number | string)[]}
                        highlightedEdges={[]}
                    />
                );

            case 'array':
            default:
                // Default array visualization
                return (
                    <div className="viz-array-container flex gap-3 relative z-10">
                        <AnimatePresence mode="sync">
                            {currentArray.map((val: any, idx: number) => {
                                const isHighlighted = activeStepData?.indices?.includes(idx);

                                let colorClass = "border-slate-700 bg-slate-800";
                                let glowStyle = {};
                                if (isHighlighted) {
                                    if (activeStepData?.color === 'success') {
                                        colorClass = "border-emerald-500 bg-emerald-500/20";
                                        glowStyle = { boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)' };
                                    } else if (activeStepData?.color === 'accent') {
                                        colorClass = "border-indigo-500 bg-indigo-500/20";
                                        glowStyle = { boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)' };
                                    } else {
                                        colorClass = "border-yellow-500 bg-yellow-500/20";
                                        glowStyle = { boxShadow: '0 0 20px rgba(234, 179, 8, 0.6)' };
                                    }
                                }

                                return (
                                    <motion.div
                                        key={`item-${idx}`}
                                        layout
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{
                                            scale: isHighlighted ? 1.15 : 1,
                                            opacity: 1,
                                            ...glowStyle
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 20,
                                            duration: 0.3
                                        }}
                                        className={`relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-lg border-2 text-lg font-bold ${colorClass}`}
                                    >
                                        <motion.span
                                            className="text-white"
                                            animate={{ scale: isHighlighted ? 1.2 : 1 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {val}
                                        </motion.span>
                                        <span className="absolute -bottom-6 text-xs text-slate-500 font-mono">{idx}</span>
                                        <AnimatePresence>
                                            {activeStepData?.pointers?.map((ptr, pIdx) => (
                                                ptr.index === idx && (
                                                    <motion.div
                                                        key={`ptr-${pIdx}-${currentStep}`}
                                                        initial={{ y: -15, opacity: 0, scale: 0.5 }}
                                                        animate={{ y: 0, opacity: 1, scale: 1 }}
                                                        exit={{ y: -10, opacity: 0, scale: 0.5 }}
                                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                        className="absolute -top-8 text-indigo-400 text-sm font-bold flex flex-col items-center"
                                                    >
                                                        {ptr.label}
                                                        <motion.span
                                                            animate={{ y: [0, 3, 0] }}
                                                            transition={{ repeat: Infinity, duration: 0.8 }}
                                                        >
                                                            ↓
                                                        </motion.span>
                                                    </motion.div>
                                                )
                                            ))}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                );
        }
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
            <div className="viz-stage relative w-full min-h-[250px] bg-[#0d0d15] rounded-xl border border-slate-700/50 flex flex-col items-center justify-center p-8 pt-12 overflow-visible">
                {renderVisualizer()}
            </div>

            {/* Transient Message - positioned below the stage */}
            <AnimatePresence mode='wait'>
                {activeStepData?.transientMessage && (
                    <motion.div
                        key={`msg-${currentStep}`}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        className="mt-3 bg-slate-800/90 border border-slate-700 px-4 py-2 rounded-lg text-sm text-slate-200 text-center"
                    >
                        {activeStepData.transientMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Text Visualization - Always show with any available text */}
            {(() => {
                // Use transientMessage as fallback if no visual/explanation exists
                const stepData = activeStepData as unknown as Record<string, string> | null;
                const stepText = activeStepData?.visual
                    || activeStepData?.explanation
                    || stepData?.description
                    || stepData?.title
                    || activeStepData?.transientMessage
                    || `Step ${currentStep}`;

                const explanationText = activeStepData?.explanation && activeStepData?.visual
                    ? activeStepData.explanation
                    : null;

                return (
                    <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800 w-full max-w-2xl">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400 font-bold text-sm">
                                {currentStep}
                            </div>
                            <div className="flex-1">
                                <pre className="font-mono text-sm text-slate-200 whitespace-pre-wrap break-words">
                                    {stepText}
                                </pre>
                                {explanationText && (
                                    <p className="mt-2 text-sm text-slate-400 italic border-t border-slate-800 pt-2">
                                        {explanationText}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default SmartVisualizer;
