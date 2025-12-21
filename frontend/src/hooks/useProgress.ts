/**
 * useProgress - React hook for user progress
 * 
 * Provides reactive access to progress state and sync status
 */

import { useState, useEffect, useCallback } from 'react';
import { SyncService, type UserProgress } from '../services/SyncService';
import { useAuth } from './useAuth';

export interface UseProgressReturn {
    progress: UserProgress;
    isSyncing: boolean;
    lastSyncedAt: number;
    markSolved: (slug: string, code?: string) => void;
    saveDraft: (slug: string, code: string) => void;
    getDraft: (slug: string) => string | null;
    isSolved: (slug: string) => boolean;
    sync: () => Promise<void>;
    solvedCount: number;
}

export function useProgress(): UseProgressReturn {
    const { isAuthenticated } = useAuth();
    const [progress, setProgress] = useState<UserProgress>(SyncService.getLocalProgress);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncedAt, setLastSyncedAt] = useState(SyncService.getLastSyncTime);

    // Subscribe to progress updates
    useEffect(() => {
        const unsubscribe = SyncService.subscribe((newProgress) => {
            setProgress(newProgress);
            setLastSyncedAt(newProgress.lastSyncedAt);
        });

        // Listen for progress_updated events
        const handleProgressUpdate = () => {
            setProgress(SyncService.getLocalProgress());
        };
        window.addEventListener('progress_updated', handleProgressUpdate);

        return () => {
            unsubscribe();
            window.removeEventListener('progress_updated', handleProgressUpdate);
        };
    }, []);

    // Start auto-sync when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            SyncService.startAutoSync();
        } else {
            SyncService.stopAutoSync();
        }

        return () => {
            SyncService.stopAutoSync();
        };
    }, [isAuthenticated]);

    const markSolved = useCallback((slug: string, code: string = '') => {
        SyncService.markSolved(slug, code);
        setProgress(SyncService.getLocalProgress());
    }, []);

    const saveDraft = useCallback((slug: string, code: string) => {
        SyncService.saveDraft(slug, code);
    }, []);

    const getDraft = useCallback((slug: string): string | null => {
        return SyncService.getDraft(slug);
    }, []);

    const isSolved = useCallback((slug: string): boolean => {
        return SyncService.isSolved(slug);
    }, []);

    const sync = useCallback(async () => {
        setIsSyncing(true);
        try {
            await SyncService.sync();
            setProgress(SyncService.getLocalProgress());
            setLastSyncedAt(SyncService.getLastSyncTime());
        } finally {
            setIsSyncing(false);
        }
    }, []);

    return {
        progress,
        isSyncing,
        lastSyncedAt,
        markSolved,
        saveDraft,
        getDraft,
        isSolved,
        sync,
        solvedCount: progress.solvedProblems.length,
    };
}

export default useProgress;
