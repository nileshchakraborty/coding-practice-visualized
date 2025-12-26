/**
 * useProblemHistory - ViewModel for Problem History feature
 * 
 * MVVM Pattern:
 * - MODEL: API endpoints (/api/admin/problems/history)
 * - VIEWMODEL: This hook (state management, business logic)
 * - VIEW: ProblemHistoryTab component (pure rendering)
 */
import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

// ============================================
// TYPES (could be moved to models/types.ts)
// ============================================

export interface ProblemHistoryChange {
    field: string;
    old_value: string | null;
    new_value: string | null;
}

export interface ProblemHistoryEntry {
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

export interface HistoryStats {
    totalEntries: number;
    creates: number;
    updates: number;
    deletes: number;
    rollbacks: number;
}

// ============================================
// VIEWMODEL HOOK
// ============================================

export interface UseProblemHistoryOptions {
    adminToken: string;
    limit?: number;
}

export interface UseProblemHistoryResult {
    // State
    entries: ProblemHistoryEntry[];
    total: number;
    loading: boolean;
    error: string | null;
    page: number;
    stats: HistoryStats | null;

    // Actions
    fetchHistory: () => Promise<void>;
    fetchStats: () => Promise<void>;
    rollback: (entry: ProblemHistoryEntry) => Promise<boolean>;
    setPage: (page: number) => void;
    clearError: () => void;
}

export function useProblemHistory({
    adminToken,
    limit = 20
}: UseProblemHistoryOptions): UseProblemHistoryResult {
    // State
    const [entries, setEntries] = useState<ProblemHistoryEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [stats, setStats] = useState<HistoryStats | null>(null);

    // Actions
    const fetchHistory = useCallback(async () => {
        if (!adminToken) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `${API_BASE}/api/admin/problems/history?limit=${limit}&skip=${page * limit}`,
                { headers: { 'Authorization': `Bearer ${adminToken}` } }
            );

            if (!res.ok) {
                throw new Error(`Failed to fetch history: ${res.status}`);
            }

            const data = await res.json();
            setEntries(data.entries || []);
            setTotal(data.total || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [adminToken, page, limit]);

    const fetchStats = useCallback(async () => {
        if (!adminToken) return;

        try {
            const res = await fetch(
                `${API_BASE}/api/admin/problems/history/stats`,
                { headers: { 'Authorization': `Bearer ${adminToken}` } }
            );

            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch {
            // Stats are optional, don't set error
        }
    }, [adminToken]);

    const rollback = useCallback(async (entry: ProblemHistoryEntry): Promise<boolean> => {
        if (!adminToken) return false;

        try {
            const res = await fetch(
                `${API_BASE}/api/admin/problems/${entry.problem_slug}/rollback`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ historyId: entry._id }),
                }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Rollback failed');
            }

            // Refresh after rollback
            await fetchHistory();
            await fetchStats();
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Rollback failed');
            return false;
        }
    }, [adminToken, fetchHistory, fetchStats]);

    const clearError = useCallback(() => setError(null), []);

    // Effects
    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Return ViewModel interface
    return {
        entries,
        total,
        loading,
        error,
        page,
        stats,
        fetchHistory,
        fetchStats,
        rollback,
        setPage,
        clearError,
    };
}

export default useProblemHistory;
