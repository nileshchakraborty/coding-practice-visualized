import React from 'react';
import { motion } from 'framer-motion';

interface TreeNode {
    val: number | string | null;
    left?: TreeNode | null;
    right?: TreeNode | null;
}

interface TreeVisualizerProps {
    root: TreeNode | null;
    highlightedNodes?: (number | string)[];
}

// Calculate tree dimensions
const getTreeDepth = (node: TreeNode | null): number => {
    if (!node || node.val === null) return 0;
    return 1 + Math.max(getTreeDepth(node.left || null), getTreeDepth(node.right || null));
};

const TreeVisualizer: React.FC<TreeVisualizerProps> = ({
    root,
    highlightedNodes = []
}) => {
    if (!root) {
        return (
            <div className="flex items-center justify-center h-48 text-slate-500">
                Empty tree
            </div>
        );
    }

    const depth = getTreeDepth(root);
    const nodeSize = 40;
    const verticalGap = 60;
    const baseWidth = Math.pow(2, depth) * (nodeSize + 20);

    // Render tree using recursion with position tracking
    const renderTree = (
        node: TreeNode | null | undefined,
        level: number,
        left: number,
        right: number,
        parentX?: number,
        parentY?: number
    ): React.ReactNode[] => {
        if (!node || node.val === null || node.val === undefined) return [];

        const x = (left + right) / 2;
        const y = level * verticalGap + nodeSize / 2;
        const elements: React.ReactNode[] = [];

        // Draw line from parent
        if (parentX !== undefined && parentY !== undefined) {
            elements.push(
                <motion.line
                    key={`line-${level}-${x}`}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: level * 0.1, duration: 0.3 }}
                    x1={parentX}
                    y1={parentY + nodeSize / 2}
                    x2={x}
                    y2={y - nodeSize / 2 + 4}
                    stroke="#475569"
                    strokeWidth="2"
                />
            );
        }

        // Draw node
        elements.push(
            <motion.g
                key={`node-${node.val}-${level}-${x}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: level * 0.1 + 0.1, type: 'spring', stiffness: 300 }}
            >
                <circle
                    cx={x}
                    cy={y}
                    r={nodeSize / 2 - 2}
                    className={highlightedNodes.includes(node.val as number | string)
                        ? 'fill-emerald-500/20 stroke-emerald-500'
                        : 'fill-slate-800 stroke-slate-600'
                    }
                    strokeWidth="2"
                />
                <text
                    x={x}
                    y={y + 5}
                    textAnchor="middle"
                    className="fill-white text-sm font-bold"
                    style={{ fontSize: '14px' }}
                >
                    {node.val}
                </text>
            </motion.g>
        );

        // Recurse to children
        if (node.left) {
            elements.push(...renderTree(node.left, level + 1, left, x, x, y));
        }
        if (node.right) {
            elements.push(...renderTree(node.right, level + 1, x, right, x, y));
        }

        return elements;
    };

    const height = depth * verticalGap + nodeSize;

    return (
        <div className="overflow-x-auto p-4">
            <svg
                width={Math.max(baseWidth, 300)}
                height={height}
                className="mx-auto"
                style={{ minWidth: '300px' }}
            >
                {renderTree(root, 0, 0, baseWidth)}
            </svg>
        </div>
    );
};

export default TreeVisualizer;
