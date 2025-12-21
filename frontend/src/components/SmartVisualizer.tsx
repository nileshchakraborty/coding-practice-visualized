import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Solution } from '../types';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
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
    const [speed, setSpeed] = useState(1); // 1x speed (1000ms base)
    const timerRef = useRef<number | null>(null);
    const stepDescriptionRef = useRef<HTMLDivElement>(null);
    const arrayContainerRef = useRef<HTMLDivElement>(null);

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

    // Calculate actual interval based on speed multiplier
    const interval = Math.round(1000 / speed);

    useEffect(() => {
        if (isPlaying) {
            timerRef.current = window.setInterval(() => {
                setCurrentStep(prev => {
                    if (prev < totalSteps) return prev + 1;
                    setIsPlaying(false);
                    return prev;
                });
            }, interval);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPlaying, totalSteps, interval]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    setIsPlaying(prev => !prev);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (currentStep < totalSteps) setCurrentStep(c => c + 1);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (currentStep > 0) setCurrentStep(c => c - 1);
                    break;
                case 'KeyR':
                    e.preventDefault();
                    setCurrentStep(0);
                    setIsPlaying(true);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentStep, totalSteps]);

    // Auto-scroll step description into view
    useEffect(() => {
        stepDescriptionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [currentStep]);

    // Auto-scroll array to show pointers when step changes
    useEffect(() => {
        if (visualizationType !== 'array' || !arrayContainerRef.current) return;
        if (!activeStepData?.pointers?.length) return;

        const container = arrayContainerRef.current;
        // Filter to pointers with valid indices
        const pointerIndices = activeStepData.pointers
            .filter(p => typeof p.index === 'number')
            .map(p => p.index as number);
        if (pointerIndices.length === 0) return;

        const minIdx = Math.min(...pointerIndices);
        const maxIdx = Math.max(...pointerIndices);

        // Find elements at these indices and scroll to center between them
        const elements = container.querySelectorAll('[data-array-idx]');
        const minEl = elements[minIdx] as HTMLElement;
        const maxEl = elements[maxIdx] as HTMLElement;

        if (minEl && maxEl) {
            const containerRect = container.getBoundingClientRect();
            const minRect = minEl.getBoundingClientRect();
            const maxRect = maxEl.getBoundingClientRect();

            // Calculate center point between the two pointers
            const centerX = (minRect.left + maxRect.right) / 2 - containerRect.left + container.scrollLeft;
            const targetScroll = centerX - containerRect.width / 2;

            container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
        }
    }, [currentStep, activeStepData, visualizationType]);

    const handleNext = useCallback(() => {
        if (currentStep < totalSteps) setCurrentStep(c => c + 1);
    }, [currentStep, totalSteps]);

    const handlePrev = useCallback(() => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
    }, [currentStep]);

    const handleReplay = useCallback(() => {
        setCurrentStep(0);
        setIsPlaying(true);
    }, []);

    const handleScrub = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newStep = Math.round(percentage * totalSteps);
        setCurrentStep(Math.max(0, Math.min(totalSteps, newStep)));
    }, [totalSteps]);

    const speedOptions = [0.5, 1, 1.5, 2, 3];

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
                        matrix={
                            (activeStepData?.arrayState as unknown as (number | string)[][]) ||
                            solution.matrix ||
                            (initialState as unknown as (number | string)[][])
                        }
                        highlightedCells={(highlightedIndices as unknown as [number, number][]).map(([r, c]) => ({
                            row: r,
                            col: c,
                            color: activeStepData?.color || 'accent'
                        }))}
                        currentCell={undefined}
                    />
                );

            case 'graph': {
                // Use graphState from step data if available (for animated graphs)
                const graphData = activeStepData?.graphState;
                if (graphData && graphData.nodes && graphData.nodes.length > 0) {
                    const nodes = graphData.nodes;
                    // Calculate bounds
                    const minX = Math.min(...nodes.map((n: { x: number }) => n.x)) - 60;
                    const maxX = Math.max(...nodes.map((n: { x: number }) => n.x)) + 60;
                    const minY = Math.min(...nodes.map((n: { y: number }) => n.y)) - 50;
                    const maxY = Math.max(...nodes.map((n: { y: number }) => n.y)) + 60;
                    const svgWidth = maxX - minX;
                    const svgHeight = maxY - minY;

                    // Handle bidirectional edges - group by node pair and offset
                    const edges = graphData.edges || [];
                    type EdgeType = { from: string; to: string; weight?: number; highlight?: boolean };
                    const edgePairs = new Map<string, EdgeType[]>();
                    edges.forEach((e: EdgeType) => {
                        const key = [e.from, e.to].sort().join('-');
                        if (!edgePairs.has(key)) edgePairs.set(key, []);
                        edgePairs.get(key)!.push(e);
                    });

                    const displayEdges: (EdgeType & { offset: number })[] = [];
                    edgePairs.forEach((pair) => {
                        if (pair.length === 1) {
                            displayEdges.push({ ...pair[0], offset: 0 });
                        } else {
                            displayEdges.push({ ...pair[0], offset: -10 });
                            displayEdges.push({ ...pair[1], offset: 10 });
                        }
                    });

                    return (
                        <div className="w-full flex justify-center py-4">
                            <svg
                                width={Math.min(svgWidth, 550)}
                                height={Math.min(svgHeight, 280)}
                                viewBox={`${minX} ${minY} ${svgWidth} ${svgHeight}`}
                                className="overflow-visible"
                            >
                                {/* Edges */}
                                {displayEdges.map((edge, idx) => {
                                    const fromNode = nodes.find((n: { id: string }) => n.id === edge.from);
                                    const toNode = nodes.find((n: { id: string }) => n.id === edge.to);
                                    if (!fromNode || !toNode) return null;

                                    const highlighted = edge.highlight;
                                    const strokeColor = highlighted ? '#10b981' : '#64748b';
                                    const dx = toNode.x - fromNode.x;
                                    const dy = toNode.y - fromNode.y;
                                    const angle = Math.atan2(dy, dx);
                                    const perpX = -Math.sin(angle) * edge.offset;
                                    const perpY = Math.cos(angle) * edge.offset;
                                    const startX = fromNode.x + 24 * Math.cos(angle) + perpX;
                                    const startY = fromNode.y + 24 * Math.sin(angle) + perpY;
                                    const endX = toNode.x - 28 * Math.cos(angle) + perpX;
                                    const endY = toNode.y - 28 * Math.sin(angle) + perpY;

                                    return (
                                        <g key={`edge-${idx}`}>
                                            <motion.line
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                animate={{ pathLength: 1, opacity: 1 }}
                                                transition={{ delay: idx * 0.05, duration: 0.2 }}
                                                x1={startX} y1={startY} x2={endX} y2={endY}
                                                stroke={strokeColor}
                                                strokeWidth={highlighted ? 3 : 2}
                                            />
                                            <polygon
                                                points={`${endX},${endY} ${endX - 10 * Math.cos(angle - 0.35)},${endY - 10 * Math.sin(angle - 0.35)} ${endX - 10 * Math.cos(angle + 0.35)},${endY - 10 * Math.sin(angle + 0.35)}`}
                                                fill={strokeColor}
                                            />
                                            {edge.weight !== undefined && (
                                                <g>
                                                    <rect
                                                        x={(startX + endX) / 2 - 16}
                                                        y={(startY + endY) / 2 - 10}
                                                        width={32}
                                                        height={16}
                                                        rx={3}
                                                        fill={highlighted ? '#064e3b' : '#1e293b'}
                                                        stroke={highlighted ? '#10b981' : '#475569'}
                                                        strokeWidth={1}
                                                    />
                                                    <text
                                                        x={(startX + endX) / 2}
                                                        y={(startY + endY) / 2 + 3}
                                                        textAnchor="middle"
                                                        className={`text-xs font-bold ${highlighted ? 'fill-emerald-300' : 'fill-slate-200'}`}
                                                    >
                                                        {edge.weight}
                                                    </text>
                                                </g>
                                            )}
                                        </g>
                                    );
                                })}

                                {/* Nodes */}
                                {nodes.map((node: { id: string; label: string; x: number; y: number; visited?: boolean; highlight?: boolean }, idx: number) => {
                                    const isHighlighted = node.highlight;
                                    const isVisited = node.visited;
                                    const labelMatch = node.label.match(/^(\S+)\s*(.*)$/);
                                    const displayId = labelMatch ? labelMatch[1] : node.label;
                                    const extraInfo = labelMatch && labelMatch[2] ? labelMatch[2] : '';

                                    let fillColor = '#1e293b';
                                    let strokeColor = '#475569';
                                    if (isHighlighted) {
                                        fillColor = 'rgba(234, 179, 8, 0.3)';
                                        strokeColor = '#eab308';
                                    } else if (isVisited) {
                                        fillColor = 'rgba(16, 185, 129, 0.2)';
                                        strokeColor = '#10b981';
                                    }

                                    return (
                                        <g key={node.id}>
                                            <motion.circle
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: isHighlighted ? 1.1 : 1, opacity: 1 }}
                                                transition={{ delay: idx * 0.03, type: 'spring', stiffness: 300 }}
                                                cx={node.x}
                                                cy={node.y}
                                                r={22}
                                                fill={fillColor}
                                                stroke={strokeColor}
                                                strokeWidth={isHighlighted ? 3 : 2}
                                                style={isHighlighted ? { filter: 'drop-shadow(0 0 10px rgba(234, 179, 8, 0.5))' } : {}}
                                            />
                                            <text
                                                x={node.x}
                                                y={node.y + 5}
                                                textAnchor="middle"
                                                className="fill-white text-base font-bold"
                                            >
                                                {displayId}
                                            </text>
                                            {extraInfo && (
                                                <text
                                                    x={node.x}
                                                    y={node.y + 38}
                                                    textAnchor="middle"
                                                    className="fill-slate-400 text-xs"
                                                >
                                                    {extraInfo}
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    );
                }
                // Fallback to static GraphVisualizer
                return (
                    <GraphVisualizer
                        nodes={solution.graphNodes || []}
                        edges={solution.graphEdges || []}
                        highlightedNodes={highlightedIndices as (number | string)[]}
                        highlightedEdges={[]}
                    />
                );
            }

            case 'array':
            default:
                // Default array visualization with horizontal scroll support
                return (
                    <div ref={arrayContainerRef} className="viz-array-container w-full overflow-x-auto pb-4 pt-10 custom-scrollbar">
                        <div className="flex gap-2 sm:gap-3 justify-center min-w-max px-4">
                            <AnimatePresence mode="sync">
                                {currentArray.map((val: number | string, idx: number) => {
                                    const isHighlighted = activeStepData?.indices?.includes(idx);
                                    const hasPointer = activeStepData?.pointers?.some(ptr => ptr.index === idx);

                                    let colorClass = "border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-800";
                                    let glowStyle = {};
                                    if (isHighlighted || hasPointer) {
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
                                                scale: (isHighlighted || hasPointer) ? 1.1 : 1,
                                                opacity: 1,
                                                ...glowStyle
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 300,
                                                damping: 20,
                                                duration: 0.3
                                            }}
                                            className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center rounded-lg border-2 text-base sm:text-lg font-bold flex-shrink-0 ${colorClass}`}
                                            data-array-idx={idx}
                                        >
                                            <motion.span
                                                className="text-slate-800 dark:text-white"
                                                animate={{ scale: (isHighlighted || hasPointer) ? 1.1 : 1 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {val}
                                            </motion.span>
                                            <span className="absolute -bottom-5 text-[10px] sm:text-xs text-slate-500 font-mono">{idx}</span>

                                            {/* Pointer labels above the element */}
                                            {activeStepData?.pointers?.filter(ptr => ptr.index === idx).map((ptr, pIdx) => (
                                                <motion.div
                                                    key={`ptr-${pIdx}-${ptr.label}`}
                                                    initial={{ y: -10, opacity: 0, scale: 0.5 }}
                                                    animate={{ y: 0, opacity: 1, scale: 1 }}
                                                    exit={{ y: -10, opacity: 0, scale: 0.5 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                    className="absolute -top-8 text-indigo-400 text-xs sm:text-sm font-bold flex flex-col items-center z-20"
                                                >
                                                    <span className="bg-indigo-500 text-white px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold shadow-md">
                                                        {ptr.label}
                                                    </span>
                                                    <motion.span
                                                        animate={{ y: [0, 2, 0] }}
                                                        transition={{ repeat: Infinity, duration: 0.6 }}
                                                        className="text-indigo-400"
                                                    >
                                                        ▼
                                                    </motion.span>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col items-center w-full">
            {/* Enhanced Controls */}
            <div className="viz-controls w-full max-w-2xl mb-6 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                {/* Playback Controls Row */}
                {/* Playback Controls Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                    {/* Left: Playback buttons */}
                    <div className="flex items-center gap-1 order-1">
                        <button
                            onClick={handlePrev}
                            disabled={currentStep === 0}
                            className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Previous (←)"
                        >
                            <SkipBack size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="p-2 sm:p-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors text-white shadow-lg shadow-indigo-500/25"
                            title="Play/Pause (Space)"
                        >
                            {isPlaying ? <Pause size={18} className="sm:w-5 sm:h-5" /> : <Play size={18} className="sm:w-5 sm:h-5" />}
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentStep >= totalSteps}
                            className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Next (→)"
                        >
                            <SkipForward size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                        <button
                            onClick={handleReplay}
                            className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                            title="Replay (R)"
                        >
                            <RotateCcw size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                    </div>

                    {/* Center: Step counter - Order 2 on mobile (right side), Order 2 on desktop (center) */}
                    <span className="order-2 sm:order-2 text-xs sm:text-sm font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 sm:px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                        {currentStep} / {totalSteps}
                    </span>

                    {/* Right: Speed control - Order 3 (new row on mobile potentially) */}
                    <div className="flex items-center gap-1.5 order-3 w-full sm:w-auto justify-center sm:justify-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700">
                        <span className="text-xs text-slate-500 dark:text-slate-400">🐢</span>
                        <div className="flex bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                            {speedOptions.map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSpeed(s)}
                                    className={`px-2 py-1 text-[10px] sm:text-xs font-medium transition-colors ${speed === s
                                        ? 'bg-indigo-500 text-white'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    {s}x
                                </button>
                            ))}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">🐇</span>
                    </div>
                </div>

                {/* Timeline Scrub Bar */}
                <div
                    className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer group"
                    onClick={handleScrub}
                    title="Click to jump to step"
                >
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-150"
                        style={{ width: `${totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0}%` }}
                    />
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow-md transition-all duration-150 group-hover:scale-110"
                        style={{ left: `calc(${totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0}% - 8px)` }}
                    />
                </div>

                {/* Keyboard shortcuts hint */}
                <div className="flex justify-center gap-4 text-[10px] text-slate-400 dark:text-slate-500">
                    <span>Space: Play/Pause</span>
                    <span>←/→: Step</span>
                    <span>R: Replay</span>
                </div>
            </div>

            {/* Stage */}
            <div className="viz-stage relative w-full min-h-[250px] bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 flex flex-col items-center justify-center p-8 pt-12 overflow-visible">
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
                        className="mt-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 text-center shadow-sm"
                    >
                        {activeStepData.transientMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Variable State Panel - Shows values for active pointers */}
            {activeStepData?.pointers && activeStepData.pointers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    <AnimatePresence>
                        {activeStepData.pointers.map((p, idx: number) => {
                            // Support both index-based (arrays) and value-based (graphs) pointers
                            const hasIndex = typeof p.index === 'number';
                            const val = hasIndex ? getActiveState()[p.index!] : p.value;
                            const displayVal = val !== undefined ? String(val) : (p.node || '∅');
                            return (
                                <motion.div
                                    key={`${p.label}-${idx}`}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm"
                                >
                                    <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">{p.label}</span>
                                    <span className="text-xs text-slate-300 dark:text-slate-600">→</span>
                                    <span className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                        {displayVal}
                                    </span>
                                    {hasIndex && (
                                        <span className="text-[10px] text-slate-400 ml-0.5 opacity-75">
                                            [{p.index}]
                                        </span>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

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
                    <div ref={stepDescriptionRef} className="mt-4 p-4 bg-white dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                {currentStep}
                            </div>
                            <div className="flex-1">
                                <pre className="font-mono text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words">
                                    {stepText}
                                </pre>
                                {explanationText && (
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic border-t border-slate-200 dark:border-slate-800 pt-2">
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
