import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface GraphNode {
    id: number | string;
    label?: string;
}

interface GraphEdge {
    from: number | string;
    to: number | string;
    weight?: number;
}

interface GraphVisualizerProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
    highlightedNodes?: (number | string)[];
    highlightedEdges?: { from: number | string; to: number | string }[];
    directed?: boolean;
}

const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
    nodes,
    edges,
    highlightedNodes = [],
    highlightedEdges = [],
    directed = true
}) => {
    if (!nodes || nodes.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-slate-500">
                Empty graph
            </div>
        );
    }

    // Calculate node positions in a circle
    const nodePositions = useMemo(() => {
        const centerX = 150;
        const centerY = 120;
        const radius = 80;

        return nodes.map((node, idx) => {
            const angle = (2 * Math.PI * idx) / nodes.length - Math.PI / 2;
            return {
                ...node,
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
            };
        });
    }, [nodes]);

    const getNodePos = (id: number | string) => {
        return nodePositions.find(n => n.id === id);
    };

    const isNodeHighlighted = (id: number | string) => {
        return highlightedNodes.includes(id);
    };

    const isEdgeHighlighted = (from: number | string, to: number | string) => {
        return highlightedEdges.some(e => e.from === from && e.to === to);
    };

    return (
        <div className="relative w-[300px] h-[240px] mx-auto">
            <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                {/* Edges */}
                {edges.map((edge, idx) => {
                    const fromPos = getNodePos(edge.from);
                    const toPos = getNodePos(edge.to);
                    if (!fromPos || !toPos) return null;

                    const highlighted = isEdgeHighlighted(edge.from, edge.to);
                    const strokeColor = highlighted ? '#10b981' : '#475569';

                    // Calculate angle for arrow
                    const dx = toPos.x - fromPos.x;
                    const dy = toPos.y - fromPos.y;
                    const angle = Math.atan2(dy, dx);

                    // Offset to not overlap with node circle (radius ~16)
                    const startX = fromPos.x + 16 * Math.cos(angle);
                    const startY = fromPos.y + 16 * Math.sin(angle);
                    const endX = toPos.x - 20 * Math.cos(angle);
                    const endY = toPos.y - 20 * Math.sin(angle);

                    return (
                        <g key={`edge-${idx}`}>
                            <motion.line
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: idx * 0.1, duration: 0.3 }}
                                x1={startX}
                                y1={startY}
                                x2={endX}
                                y2={endY}
                                stroke={strokeColor}
                                strokeWidth={highlighted ? 3 : 2}
                            />
                            {directed && (
                                <polygon
                                    points={`${endX},${endY} ${endX - 8 * Math.cos(angle - 0.4)},${endY - 8 * Math.sin(angle - 0.4)} ${endX - 8 * Math.cos(angle + 0.4)},${endY - 8 * Math.sin(angle + 0.4)}`}
                                    fill={strokeColor}
                                />
                            )}
                            {edge.weight !== undefined && (
                                <text
                                    x={(startX + endX) / 2}
                                    y={(startY + endY) / 2 - 5}
                                    textAnchor="middle"
                                    className="text-xs fill-slate-400"
                                >
                                    {edge.weight}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Nodes */}
            {nodePositions.map((node, idx) => {
                const highlighted = isNodeHighlighted(node.id);
                const bgClass = highlighted
                    ? 'border-emerald-500 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'border-slate-600 bg-slate-800';

                return (
                    <motion.div
                        key={node.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`absolute w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold text-white ${bgClass}`}
                        style={{
                            left: node.x - 16,
                            top: node.y - 16
                        }}
                    >
                        {node.label || node.id}
                    </motion.div>
                );
            })}
        </div>
    );
};

export default GraphVisualizer;
