/**
 * SyncService - Progress synchronization with server
 * 
 * Handles:
 * - Auto-sync on interval (default: 5 minutes)
 * - Sync on app focus
 * - Push/pull/merge with server
 */

import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const API_BASE = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || '/api');

// Create axios instance with auth
const api = axios.create({
    baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Types
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

// localStorage keys
const PROGRESS_KEY = 'codenium_user_progress';
const LAST_SYNC_KEY = 'codenium_last_sync';

// Default sync interval (5 minutes)
const DEFAULT_SYNC_INTERVAL_MS = 5 * 60 * 1000;

class SyncServiceImpl {
    private syncInterval: ReturnType<typeof setInterval> | null = null;
    private isSyncing = false;
    private onSyncCallbacks: ((progress: UserProgress) => void)[] = [];

    /**
     * Get local progress from localStorage
     */
    getLocalProgress(): UserProgress {
        try {
            const stored = localStorage.getItem(PROGRESS_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('[SyncService] Error reading local progress:', e);
        }

        // Return empty progress
        return {
            userId: '',
            lastSyncedAt: 0,
            solvedProblems: [],
            drafts: {},
        };
    }

    /**
     * Save progress to localStorage
     */
    saveLocalProgress(progress: UserProgress): void {
        try {
            localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
            localStorage.setItem(LAST_SYNC_KEY, String(progress.lastSyncedAt));

            // Notify subscribers
            this.notifySubscribers(progress);

            // Dispatch event for other components
            window.dispatchEvent(new Event('progress_updated'));
        } catch (e) {
            console.error('[SyncService] Error saving local progress:', e);
        }
    }

    /**
     * Pull progress from server
     */
    async pull(): Promise<UserProgress | null> {
        try {
            const token = getAuthToken();
            if (!token) {
                console.log('[SyncService] Not authenticated, skipping pull');
                return null;
            }

            const response = await api.get<UserProgress>('/progress');
            return response.data;
        } catch (e) {
            console.error('[SyncService] Pull error:', e);
            return null;
        }
    }

    /**
     * Push local progress to server
     */
    async push(progress: UserProgress): Promise<boolean> {
        try {
            const token = getAuthToken();
            if (!token) {
                console.log('[SyncService] Not authenticated, skipping push');
                return false;
            }

            await api.post('/progress', progress);
            return true;
        } catch (e) {
            console.error('[SyncService] Push error:', e);
            return false;
        }
    }

    /**
     * Full sync - merge local and server progress
     */
    async sync(): Promise<UserProgress | null> {
        if (this.isSyncing) {
            console.log('[SyncService] Sync already in progress');
            return null;
        }

        const token = getAuthToken();
        if (!token) {
            console.log('[SyncService] Not authenticated, skipping sync');
            return null;
        }

        this.isSyncing = true;
        console.log('[SyncService] Starting sync...');

        try {
            const localProgress = this.getLocalProgress();

            // Call server sync endpoint (bidirectional merge)
            const response = await api.post<UserProgress>('/progress/sync', localProgress);
            const mergedProgress = response.data;

            // Save merged progress locally
            this.saveLocalProgress(mergedProgress);

            console.log(`[SyncService] Sync complete. ${mergedProgress.solvedProblems.length} solved problems.`);
            return mergedProgress;
        } catch (e) {
            console.error('[SyncService] Sync error:', e);
            return null;
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Start auto-sync timer
     */
    startAutoSync(intervalMs: number = DEFAULT_SYNC_INTERVAL_MS): void {
        // Stop existing timer if any
        this.stopAutoSync();

        console.log(`[SyncService] Starting auto-sync (interval: ${intervalMs / 1000}s)`);

        // Initial sync
        this.sync();

        // Set up interval
        this.syncInterval = setInterval(() => {
            this.sync();
        }, intervalMs);

        // Sync on focus
        window.addEventListener('focus', this.handleFocus);

        // Sync before unload
        window.addEventListener('beforeunload', this.handleBeforeUnload);
    }

    /**
     * Stop auto-sync
     */
    stopAutoSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }

        window.removeEventListener('focus', this.handleFocus);
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }

    /**
     * Handle window focus - sync when user returns
     */
    private handleFocus = (): void => {
        console.log('[SyncService] Window focused, syncing...');
        this.sync();
    };

    /**
     * Handle before unload - try to sync before leaving
     */
    private handleBeforeUnload = (): void => {
        // Use sendBeacon for reliable delivery on page close
        const token = getAuthToken();
        if (token) {
            const progress = this.getLocalProgress();
            const blob = new Blob([JSON.stringify(progress)], { type: 'application/json' });
            navigator.sendBeacon(`${API_BASE}/progress`, blob);
        }
    };

    /**
     * Subscribe to sync updates
     */
    subscribe(callback: (progress: UserProgress) => void): () => void {
        this.onSyncCallbacks.push(callback);
        return () => {
            this.onSyncCallbacks = this.onSyncCallbacks.filter(cb => cb !== callback);
        };
    }

    /**
     * Notify all subscribers
     */
    private notifySubscribers(progress: UserProgress): void {
        for (const callback of this.onSyncCallbacks) {
            try {
                callback(progress);
            } catch (e) {
                console.error('[SyncService] Subscriber error:', e);
            }
        }
    }

    /**
     * Mark a problem as solved (helper)
     */
    markSolved(slug: string, code: string = ''): void {
        const progress = this.getLocalProgress();

        // Check if already solved
        if (!progress.solvedProblems.some(p => p.slug === slug)) {
            progress.solvedProblems.push({
                slug,
                timestamp: Date.now(),
                code,
            });
            progress.lastSyncedAt = Date.now();
            this.saveLocalProgress(progress);

            // Trigger immediate sync on solve
            this.sync();
        }
    }

    /**
     * Save draft code (helper)
     */
    saveDraft(slug: string, code: string): void {
        const progress = this.getLocalProgress();
        progress.drafts[slug] = {
            code,
            updatedAt: Date.now(),
        };
        this.saveLocalProgress(progress);
    }

    /**
     * Get draft code (helper)
     */
    getDraft(slug: string): string | null {
        const progress = this.getLocalProgress();
        return progress.drafts[slug]?.code || null;
    }

    /**
     * Check if problem is solved
     */
    isSolved(slug: string): boolean {
        const progress = this.getLocalProgress();
        return progress.solvedProblems.some(p => p.slug === slug);
    }

    /**
     * Get last sync timestamp
     */
    getLastSyncTime(): number {
        const stored = localStorage.getItem(LAST_SYNC_KEY);
        return stored ? parseInt(stored, 10) : 0;
    }
}

// Singleton instance
export const SyncService = new SyncServiceImpl();
export default SyncService;
