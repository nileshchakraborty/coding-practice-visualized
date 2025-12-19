import React from 'react';
import { motion } from 'framer-motion';

interface MatrixVisualizerProps {
    matrix: (number | string)[][];
    highlightedCells?: { row: number; col: number; color?: string }[];
    currentCell?: { row: number; col: number };
}

const MatrixVisualizer: React.FC<MatrixVisualizerProps> = ({
    matrix,
    highlightedCells = [],
    currentCell
}) => {
    if (!matrix || matrix.length === 0) {
        return (
            <div className="flex items-center justify-center h-32 text-slate-500">
                Empty matrix
            </div>
        );
    }

    const getCellColor = (row: number, col: number) => {
        // Current cell
        if (currentCell?.row === row && currentCell?.col === col) {
            return 'border-yellow-500 bg-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.4)]';
        }

        // Highlighted cells
        const highlighted = highlightedCells.find(c => c.row === row && c.col === col);
        if (highlighted) {
            if (highlighted.color === 'success') {
                return 'border-emerald-500 bg-emerald-500/20';
            }
            if (highlighted.color === 'accent') {
                return 'border-indigo-500 bg-indigo-500/20';
            }
            return 'border-blue-500 bg-blue-500/20';
        }

        return 'border-slate-700 bg-slate-800';
    };

    const rows = matrix.length;
    const cols = matrix[0]?.length || 0;
    const cellSize = rows > 6 || cols > 8 ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';

    return (
        <div className="flex flex-col items-center gap-1 overflow-auto p-4">
            {matrix.map((row, rowIdx) => (
                <div key={rowIdx} className="flex gap-1">
                    {row.map((cell, colIdx) => (
                        <motion.div
                            key={`${rowIdx}-${colIdx}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: (rowIdx * cols + colIdx) * 0.02 }}
                            className={`${cellSize} flex items-center justify-center border-2 rounded font-mono font-bold text-white ${getCellColor(rowIdx, colIdx)}`}
                        >
                            {cell}
                        </motion.div>
                    ))}
                </div>
            ))}

            {/* Row/Col indicators */}
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
                <span>Rows: {rows}</span>
                <span>Cols: {cols}</span>
            </div>
        </div>
    );
};

export default MatrixVisualizer;
