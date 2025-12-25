import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import useProgress from '../useProgress';
import { SyncService } from '../../services/SyncService';

// Mock SyncService
vi.mock('../../services/SyncService', () => ({
    SyncService: {
        getLocalProgress: vi.fn(),
        getLastSyncTime: vi.fn(),
        subscribe: vi.fn(),
        startAutoSync: vi.fn(),
        stopAutoSync: vi.fn(),
        markSolved: vi.fn(),
        markAttempted: vi.fn(),
        saveDraft: vi.fn(),
        getDraft: vi.fn(),
        clearDraft: vi.fn(),
        isSolved: vi.fn(),
        isAttempted: vi.fn(),
        sync: vi.fn(),
    }
}));

// Mock useAuth
vi.mock('../useAuth', () => ({
    useAuth: vi.fn()
}));

import { useAuth } from '../useAuth';

describe('useProgress', () => {
    const mockProgress = {
        solvedProblems: [{ slug: 'two-sum', timestamp: 1000, code: 'code' }],
        attemptedProblems: [{ slug: 'three-sum', openedAt: 2000 }],
        lastSyncedAt: 1000,
        userId: 'test-user',
        drafts: {}
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(SyncService.getLocalProgress).mockReturnValue(mockProgress);
        vi.mocked(SyncService.getLastSyncTime).mockReturnValue(1000);
        vi.mocked(SyncService.subscribe).mockReturnValue(vi.fn());
        vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, login: vi.fn(), user: null, logout: vi.fn(), isLoading: false, accessToken: null });
    });

    it('initializes with local progress', () => {
        const { result } = renderHook(() => useProgress());

        expect(result.current.progress).toEqual(mockProgress);
        expect(result.current.lastSyncedAt).toBe(1000);
        expect(result.current.solvedCount).toBe(1);
        expect(result.current.attemptedCount).toBe(1);
    });

    it('subscribes to SyncService updates', () => {
        const { result } = renderHook(() => useProgress());
        expect(SyncService.subscribe).toHaveBeenCalled();

        // Simulate update
        const newProgress = { ...mockProgress, solvedProblems: [{ slug: 'two-sum', timestamp: 1000, code: 'code' }, { slug: 'new-prob', timestamp: 3000, code: 'new-code' }], lastSyncedAt: 2000 };
        const callback = vi.mocked(SyncService.subscribe).mock.calls[0][0];

        act(() => {
            callback(newProgress);
        });

        expect(result.current.progress).toEqual(newProgress);
        expect(result.current.lastSyncedAt).toBe(2000);
    });

    it('starts auto-sync when authenticated', () => {
        vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, login: vi.fn(), user: null, logout: vi.fn(), isLoading: false, accessToken: null });
        renderHook(() => useProgress());
        expect(SyncService.startAutoSync).toHaveBeenCalled();
    });

    it('stops auto-sync when not authenticated', () => {
        vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, login: vi.fn(), user: null, logout: vi.fn(), isLoading: false, accessToken: null });
        const { unmount } = renderHook(() => useProgress());
        expect(SyncService.stopAutoSync).toHaveBeenCalled();
        unmount();
        // Should stop on unmount too (though already stopped)
        // Check calls
    });

    it('stops auto-sync on unmount', () => {
        vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, login: vi.fn(), user: null, logout: vi.fn(), isLoading: false, accessToken: null });
        const { unmount } = renderHook(() => useProgress());
        unmount();
        expect(SyncService.stopAutoSync).toHaveBeenCalled();
    });

    it('calls markSolved', () => {
        const { result } = renderHook(() => useProgress());
        act(() => {
            result.current.markSolved('slug', 'code');
        });
        expect(SyncService.markSolved).toHaveBeenCalledWith('slug', 'code');
    });

    it('calls markAttempted', () => {
        const { result } = renderHook(() => useProgress());
        act(() => {
            result.current.markAttempted('slug');
        });
        expect(SyncService.markAttempted).toHaveBeenCalledWith('slug');
    });

    it('calls sync', async () => {
        const { result } = renderHook(() => useProgress());
        vi.mocked(SyncService.sync).mockResolvedValue(null);

        await act(async () => {
            await result.current.sync();
        });

        expect(SyncService.sync).toHaveBeenCalled();
        expect(result.current.isSyncing).toBe(false);
    });

    it('handles sync error', async () => {
        const { result } = renderHook(() => useProgress());
        vi.mocked(SyncService.sync).mockRejectedValue(new Error('fail'));

        await expect(act(async () => {
            await result.current.sync();
        })).rejects.toThrow('fail');

        expect(result.current.isSyncing).toBe(false);
    });

    it('calls saveDraft', () => {
        const { result } = renderHook(() => useProgress());
        act(() => {
            result.current.saveDraft('slug', 'code');
        });
        expect(SyncService.saveDraft).toHaveBeenCalledWith('slug', 'code');
    });

    it('calls getDraft', () => {
        vi.mocked(SyncService.getDraft).mockReturnValue('saved-code');
        const { result } = renderHook(() => useProgress());
        const draft = result.current.getDraft('slug');
        expect(SyncService.getDraft).toHaveBeenCalledWith('slug');
        expect(draft).toBe('saved-code');
    });

    it('calls clearDraft', () => {
        const { result } = renderHook(() => useProgress());
        act(() => {
            result.current.clearDraft('slug');
        });
        expect(SyncService.clearDraft).toHaveBeenCalledWith('slug');
    });

    it('calls isSolved', () => {
        vi.mocked(SyncService.isSolved).mockReturnValue(true);
        const { result } = renderHook(() => useProgress());
        const solved = result.current.isSolved('two-sum');
        expect(SyncService.isSolved).toHaveBeenCalledWith('two-sum');
        expect(solved).toBe(true);
    });

    it('calls isAttempted', () => {
        vi.mocked(SyncService.isAttempted).mockReturnValue(true);
        const { result } = renderHook(() => useProgress());
        const attempted = result.current.isAttempted('two-sum');
        expect(SyncService.isAttempted).toHaveBeenCalledWith('two-sum');
        expect(attempted).toBe(true);
    });

    it('listens for progress_updated window event', () => {
        const { result } = renderHook(() => useProgress());
        const newProgress = { ...mockProgress, solvedProblems: [{ slug: 'new', timestamp: 5000, code: 'x' }] };
        vi.mocked(SyncService.getLocalProgress).mockReturnValue(newProgress);

        act(() => {
            window.dispatchEvent(new Event('progress_updated'));
        });

        expect(result.current.progress).toEqual(newProgress);
    });

    it('handles null attemptedProblems', () => {
        const progressWithNullAttempted = {
            ...mockProgress,
            attemptedProblems: undefined
        };
        vi.mocked(SyncService.getLocalProgress).mockReturnValue(progressWithNullAttempted as unknown as typeof mockProgress);

        const { result } = renderHook(() => useProgress());
        expect(result.current.attemptedCount).toBe(0);
    });
});
