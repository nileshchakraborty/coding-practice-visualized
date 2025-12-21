/**
 * ProgressStore - In-memory progress storage with user isolation
 * 
 * Stores user progress data (solved problems, drafts) with support for:
 * - User-scoped storage (by userId)
 * - Merge functionality for sync
 * - TTL-based cleanup for inactive users
 */

export interface SolvedProblem {
    slug: string;
    timestamp: number;
    code: string;
    attempts?: number;
    bestRuntime?: number;
}

export interface Draft {
    code: string;
    updatedAt: number;
}

export interface UserProgress {
    userId: string;
    lastSyncedAt: number;
    solvedProblems: SolvedProblem[];
    drafts: Record<string, Draft>;
}

class ProgressStoreService {
    private store: Map<string, UserProgress> = new Map();
    private readonly TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Cleanup stale entries every hour
        this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 60 * 1000);
    }

    /**
     * Get user's progress
     */
    get(userId: string): UserProgress | null {
        return this.store.get(userId) || null;
    }

    /**
     * Set user's progress (full replace)
     */
    set(userId: string, progress: UserProgress): void {
        this.store.set(userId, {
            ...progress,
            userId,
            lastSyncedAt: Date.now(),
        });
        console.log(`[ProgressStore] Saved progress for user: ${userId}`);
    }

    /**
     * Merge client progress with server progress
     * Strategy: Combine solved problems, keep most recent drafts
     */
    merge(userId: string, clientProgress: UserProgress): UserProgress {
        const serverProgress = this.store.get(userId);

        if (!serverProgress) {
            // No server data, use client data
            const merged: UserProgress = {
                ...clientProgress,
                userId,
                lastSyncedAt: Date.now(),
            };
            this.store.set(userId, merged);
            return merged;
        }

        // Merge solved problems (union by slug, keep earliest timestamp)
        const solvedMap = new Map<string, SolvedProblem>();

        // Add server problems first
        for (const problem of serverProgress.solvedProblems) {
            solvedMap.set(problem.slug, problem);
        }

        // Merge client problems (keep earliest timestamp)
        for (const problem of clientProgress.solvedProblems) {
            const existing = solvedMap.get(problem.slug);
            if (!existing || problem.timestamp < existing.timestamp) {
                solvedMap.set(problem.slug, problem);
            }
        }

        // Merge drafts (keep most recent)
        const mergedDrafts: Record<string, Draft> = { ...serverProgress.drafts };
        for (const [slug, draft] of Object.entries(clientProgress.drafts || {})) {
            const existing = mergedDrafts[slug];
            if (!existing || draft.updatedAt > existing.updatedAt) {
                mergedDrafts[slug] = draft;
            }
        }

        const merged: UserProgress = {
            userId,
            lastSyncedAt: Date.now(),
            solvedProblems: Array.from(solvedMap.values()),
            drafts: mergedDrafts,
        };

        this.store.set(userId, merged);
        console.log(`[ProgressStore] Merged progress for user: ${userId} (${merged.solvedProblems.length} solved)`);

        return merged;
    }

    /**
     * Get stats
     */
    getStats(): { totalUsers: number; totalSolved: number } {
        let totalSolved = 0;
        for (const progress of this.store.values()) {
            totalSolved += progress.solvedProblems.length;
        }
        return {
            totalUsers: this.store.size,
            totalSolved,
        };
    }

    /**
     * Cleanup stale entries
     */
    private cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [userId, progress] of this.store.entries()) {
            const age = now - progress.lastSyncedAt;
            if (age > this.TTL_MS) {
                this.store.delete(userId);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`[ProgressStore] Cleaned up ${cleaned} stale entries`);
        }
    }

    /**
     * Shutdown
     */
    shutdown(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// Singleton instance
export const progressStore = new ProgressStoreService();
