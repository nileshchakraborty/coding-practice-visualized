/**
 * ProblemHistoryTab - Admin dashboard tab for viewing and managing problem history
 * Features:
 * - Timeline view of all problem changes
 * - Diff viewer for before/after comparison
 * - One-click rollback with confirmation
 */
import { useState, useEffect, useCallback } from 'react';
import {
    History,
    RotateCcw,
    Plus,
    Edit2,
    Trash2,
    Eye,
    ChevronDown,
    ChevronRight,
    Clock,
    User,
    AlertTriangle
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Types
interface ProblemHistoryChange {
    field: string;
    old_value: string | null;
    new_value: string | null;
}

interface ProblemHistoryEntry {
    _id: string;
    problem_slug: string;
    action: 'create' | 'update' | 'delete' | 'restore';
    previous_data: Record<string, unknown> | null;
    current_data: Record<string, unknown> | null;
    changes: ProblemHistoryChange[];
    changed_by: string;
    created_at: string;
    is_rollback: boolean;
    rollback_from?: string;
}

interface ProblemHistoryTabProps {
    adminToken: string;
    onRefresh?: () => void;
}

export function ProblemHistoryTab({ adminToken, onRefresh }: ProblemHistoryTabProps) {
    const [entries, setEntries] = useState<ProblemHistoryEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
    const [rollbackConfirm, setRollbackConfirm] = useState<string | null>(null);
    const [rolling, setRolling] = useState(false);

    // Pagination
    const [page, setPage] = useState(0);
    const limit = 20;

    // Fetch history
    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE}/api/admin/problems/history?limit=${limit}&skip=${page * limit}`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                },
            });

            if (!res.ok) throw new Error('Failed to fetch history');

            const data = await res.json();
            setEntries(data.entries || []);
            setTotal(data.total || 0);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load history');
        } finally {
            setLoading(false);
        }
    }, [adminToken, page]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Handle rollback
    const handleRollback = async (entry: ProblemHistoryEntry) => {
        if (rolling) return;
        setRolling(true);

        try {
            const res = await fetch(`${API_BASE}/api/admin/problems/${entry.problem_slug}/rollback`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ historyId: entry._id }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Rollback failed');
            }

            // Refresh history
            fetchHistory();
            onRefresh?.();
            setRollbackConfirm(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Rollback failed');
        } finally {
            setRolling(false);
        }
    };

    // Format timestamp
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Get action icon and color
    const getActionStyle = (action: string, isRollback: boolean) => {
        if (isRollback) return { icon: RotateCcw, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' };
        switch (action) {
            case 'create': return { icon: Plus, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
            case 'update': return { icon: Edit2, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' };
            case 'delete': return { icon: Trash2, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' };
            case 'restore': return { icon: RotateCcw, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' };
            default: return { icon: Edit2, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30' };
        }
    };

    if (loading && entries.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <History className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Problem History</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{total} total changes</p>
                    </div>
                </div>
                <button
                    onClick={fetchHistory}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    Refresh
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    {error}
                </div>
            )}

            {/* Timeline */}
            <div className="space-y-3">
                {entries.map((entry) => {
                    const style = getActionStyle(entry.action, entry.is_rollback);
                    const IconComponent = style.icon;
                    const isExpanded = expandedEntry === entry._id;

                    return (
                        <div key={entry._id} className="group">
                            {/* Entry header */}
                            <div
                                className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors cursor-pointer"
                                onClick={() => setExpandedEntry(isExpanded ? null : entry._id)}
                            >
                                {/* Action icon */}
                                <div className={`p-2 rounded-lg ${style.bg}`}>
                                    <IconComponent className={`w-4 h-4 ${style.color}`} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-slate-800 dark:text-white">
                                            {entry.problem_slug}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${style.bg} ${style.color}`}>
                                            {entry.is_rollback ? 'Rollback' : entry.action}
                                        </span>
                                        {entry.changes.length > 0 && (
                                            <span className="text-xs text-slate-400">
                                                {entry.changes.length} field{entry.changes.length !== 1 ? 's' : ''} changed
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <User size={12} />
                                            {entry.changed_by}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {formatTime(entry.created_at)}
                                        </span>
                                    </div>
                                </div>

                                {/* Expand indicator */}
                                <div className="flex items-center gap-2">
                                    {entry.action !== 'create' && !entry.is_rollback && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setRollbackConfirm(entry._id);
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <RotateCcw size={12} className="inline mr-1" />
                                            Rollback
                                        </button>
                                    )}
                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </div>
                            </div>

                            {/* Expanded details */}
                            {isExpanded && (
                                <div className="mt-2 ml-12 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
                                    <h4 className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Eye size={14} />
                                        Changes
                                    </h4>

                                    {entry.changes.length > 0 ? (
                                        <div className="space-y-2">
                                            {entry.changes.map((change, idx) => (
                                                <div key={idx} className="text-sm">
                                                    <span className="font-mono text-purple-600 dark:text-purple-400">{change.field}</span>
                                                    <div className="flex gap-2 mt-1 flex-wrap">
                                                        {change.old_value && (
                                                            <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs line-through">
                                                                {change.old_value.substring(0, 100)}
                                                            </span>
                                                        )}
                                                        {change.new_value && (
                                                            <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs">
                                                                {change.new_value.substring(0, 100)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">No field-level changes recorded.</p>
                                    )}
                                </div>
                            )}

                            {/* Rollback confirmation modal */}
                            {rollbackConfirm === entry._id && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setRollbackConfirm(null)}>
                                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                                                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Confirm Rollback</h3>
                                        </div>

                                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                                            This will restore <strong>{entry.problem_slug}</strong> to its previous state from {formatTime(entry.created_at)}. This action will be logged and can be reversed.
                                        </p>

                                        <div className="flex gap-3 justify-end">
                                            <button
                                                onClick={() => setRollbackConfirm(null)}
                                                className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleRollback(entry)}
                                                disabled={rolling}
                                                className="px-4 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 transition-colors disabled:opacity-50"
                                            >
                                                {rolling ? 'Rolling back...' : 'Confirm Rollback'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Empty state */}
            {entries.length === 0 && !loading && (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No problem history yet</p>
                </div>
            )}

            {/* Pagination */}
            {total > limit && (
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-slate-500">
                        Page {page + 1} of {Math.ceil(total / limit)}
                    </span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={(page + 1) * limit >= total}
                        className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default ProblemHistoryTab;
