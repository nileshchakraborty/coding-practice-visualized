import React from 'react';
import { motion } from 'framer-motion';

interface ListNode {
    val: number | string;
    next?: ListNode | null;
    highlighted?: boolean;
}

interface LinkedListVisualizerProps {
    head: ListNode | null;
    highlightedIndices?: number[];
    pointers?: { index?: number; label: string }[];
}

const LinkedListVisualizer: React.FC<LinkedListVisualizerProps> = ({
    head,
    highlightedIndices = [],
    pointers = []
}) => {
    if (!head) {
        return (
            <div className="flex items-center justify-center h-32 text-slate-500">
                Empty list
            </div>
        );
    }

    // Convert linked list to array for rendering
    const nodes: { val: number | string; index: number }[] = [];
    let current: ListNode | null | undefined = head;
    let index = 0;
    const seen = new Set<ListNode>();

    while (current && !seen.has(current)) {
        seen.add(current);
        nodes.push({ val: current.val, index });
        current = current.next;
        index++;
        if (index > 50) break; // Safety limit
    }

    const getNodeColor = (idx: number) => {
        if (highlightedIndices.includes(idx)) {
            return 'border-emerald-500 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.4)]';
        }
        return 'border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-800';
    };

    const getPointerBadge = (label: string) => {
        if (label === 'slow') return 'bg-emerald-500 text-white';
        if (label === 'fast') return 'bg-indigo-500 text-white';
        if (label === 'prev') return 'bg-orange-500 text-white';
        if (label === 'curr') return 'bg-cyan-500 text-white';
        return 'bg-yellow-500 text-white';
    };

    return (
        <div className="flex flex-col items-center gap-4 overflow-x-auto py-4 px-2">
            {/* Pointer labels row - positioned ABOVE the linked list */}
            <div className="flex items-end gap-1" style={{ minHeight: '32px' }}>
                {nodes.map((_node, idx) => {
                    const nodePointers = pointers.filter(p => p.index === idx);
                    const nodeWidth = 56; // w-14 = 56px
                    const arrowWidth = 24;

                    return (
                        <React.Fragment key={`pointer-${idx}`}>
                            <div
                                className="flex flex-col items-center justify-end"
                                style={{ width: `${nodeWidth}px` }}
                            >
                                {nodePointers.length > 0 && (
                                    <motion.div
                                        initial={{ y: -10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="flex flex-col items-center"
                                    >
                                        <div className="flex gap-0.5 mb-0.5">
                                            {nodePointers.map((p, pIdx) => (
                                                <span
                                                    key={pIdx}
                                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getPointerBadge(p.label)}`}
                                                >
                                                    {p.label}
                                                </span>
                                            ))}
                                        </div>
                                        <span className="text-slate-400 text-xs leading-none">↓</span>
                                    </motion.div>
                                )}
                            </div>
                            {/* Spacer for arrow */}
                            {idx < nodes.length - 1 && (
                                <div style={{ width: `${arrowWidth}px` }} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Linked list nodes row */}
            <div className="flex items-center gap-1">
                {nodes.map((node, idx) => (
                    <React.Fragment key={idx}>
                        {/* Node */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex flex-col items-center"
                        >
                            {/* Node box */}
                            <div
                                className={`flex items-center rounded-lg border-2 overflow-hidden ${getNodeColor(idx)}`}
                            >
                                {/* Value */}
                                <div className="w-10 h-10 flex items-center justify-center text-slate-800 dark:text-white font-bold">
                                    {node.val}
                                </div>
                                {/* Next pointer area */}
                                <div className="w-4 h-10 border-l-2 border-slate-400 dark:border-slate-600 bg-slate-300/50 dark:bg-slate-900/50" />
                            </div>

                            {/* Index below */}
                            <div className="text-center text-xs text-slate-500 mt-1 font-mono">
                                {idx}
                            </div>
                        </motion.div>

                        {/* Arrow to next */}
                        {idx < nodes.length - 1 && (
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: idx * 0.05 + 0.025 }}
                                className="origin-left self-start mt-3"
                            >
                                <svg width="24" height="16" className="text-slate-500">
                                    <line x1="0" y1="8" x2="18" y2="8" stroke="currentColor" strokeWidth="2" />
                                    <polygon points="16,4 24,8 16,12" fill="currentColor" />
                                </svg>
                            </motion.div>
                        )}
                    </React.Fragment>
                ))}

                {/* Null terminator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: nodes.length * 0.05 }}
                    className="text-slate-500 font-mono text-sm ml-2 self-start mt-3"
                >
                    null
                </motion.div>
            </div>
        </div>
    );
};

export default LinkedListVisualizer;
