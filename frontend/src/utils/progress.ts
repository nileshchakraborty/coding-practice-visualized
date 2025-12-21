/**
 * ProgressService - User progress tracking with sync support
 * 
 * This is a wrapper around SyncService for backward compatibility.
 * Use SyncService directly for new code.
 */

import { SyncService, type SolvedProblem, type UserProgress } from '../services/SyncService';

// Re-export types for backward compatibility
export type { SolvedProblem, UserProgress };

/**
 * ProgressService - Backward compatible API
 */
export const ProgressService = {
    /**
     * Get all solved problems
     */
    getSolvedProblems: (): SolvedProblem[] => {
        const progress = SyncService.getLocalProgress();
        return progress.solvedProblems;
    },

    /**
     * Check if a problem is solved
     */
    isSolved: (slug: string): boolean => {
        return SyncService.isSolved(slug);
    },

    /**
     * Mark a problem as solved
     */
    markAsSolved: (slug: string, code: string = '') => {
        SyncService.markSolved(slug, code);
    },

    /**
     * Save draft code for a problem
     */
    saveProgress: (slug: string, code: string) => {
        SyncService.saveDraft(slug, code);
    },

    /**
     * Get draft code for a problem
     */
    getDraft: (slug: string): string | null => {
        return SyncService.getDraft(slug);
    },

    /**
     * Manually trigger sync
     */
    sync: async (): Promise<UserProgress | null> => {
        return SyncService.sync();
    },

    /**
     * Get last sync timestamp
     */
    getLastSyncTime: (): number => {
        return SyncService.getLastSyncTime();
    },
};

export default ProgressService;
