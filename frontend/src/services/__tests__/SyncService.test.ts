import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, type Mocked } from 'vitest';
import SyncService, { type UserProgress } from '../SyncService';
import axios, { type AxiosStatic, type InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import * as authUtils from '../../utils/auth';

// Mock axios (factory hoisted)
vi.mock('axios', async (importOriginal) => {
    const actual = await importOriginal<typeof import('axios')>();
    const mockAxios = {
        create: vi.fn(() => mockAxios),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() }
        },
        get: vi.fn(),
        post: vi.fn(),
        AxiosHeaders: actual.AxiosHeaders
    };
    return {
        ...actual,
        default: mockAxios,
        AxiosHeaders: actual.AxiosHeaders
    };
});

// Mock auth utils
vi.mock('../../utils/auth', () => ({
    getAuthToken: vi.fn()
}));

describe('SyncService', () => {
    const mockedAxios = axios as unknown as Mocked<AxiosStatic>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let interceptorCallback: any;

    beforeAll(() => {
        // Capture interceptor callback before mocks are cleared
        const requestUse = mockedAxios.interceptors.request.use as unknown as ReturnType<typeof vi.fn>;
        if (requestUse.mock.calls.length > 0) {
            interceptorCallback = requestUse.mock.calls[0][0];
        }
    });

    const mockProgress: UserProgress = {
        userId: 'user123',
        lastSyncedAt: 1000,
        solvedProblems: [{ slug: 'two-sum', timestamp: 100, code: 'code' }],
        attemptedProblems: [],
        drafts: { 'test-slug': { code: 'draft', updatedAt: 200 } }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        vi.mocked(authUtils.getAuthToken).mockReturnValue('fake-token');
    });




    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals(); // Important for Navigator/localStorage mocks
    });

    it('getLocalProgress returns empty structure if nothing stored', () => {
        const progress = SyncService.getLocalProgress();
        expect(progress.solvedProblems).toEqual([]);
        expect(progress.userId).toBe('');
    });

    it('getLocalProgress returns stored data', () => {
        localStorage.setItem('codenium_user_progress', JSON.stringify(mockProgress));
        const progress = SyncService.getLocalProgress();
        expect(progress).toEqual(mockProgress);
    });

    it('getLocalProgress handles JSON parse error', () => {
        localStorage.setItem('codenium_user_progress', 'invalid json');
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const progress = SyncService.getLocalProgress();

        expect(progress.userId).toBe(''); // Returns default
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error reading local progress'), expect.anything());
    });

    it('saveLocalProgress saves to localStorage and notifies', () => {
        const subscriber = vi.fn();
        const unsubscribe = SyncService.subscribe(subscriber);

        SyncService.saveLocalProgress(mockProgress);

        expect(localStorage.getItem('codenium_user_progress')).toContain('user123');
        expect(subscriber).toHaveBeenCalledWith(mockProgress);

        unsubscribe();
    });

    it('saveLocalProgress handles localStorage quota exceeded', () => {
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceeded');
        });
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        SyncService.saveLocalProgress(mockProgress);

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error saving local progress'), expect.anything());
        setItemSpy.mockRestore();
    });

    it('pull fetches from server', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: mockProgress });
        const result = await SyncService.pull();
        expect(result).toEqual(mockProgress);
        expect(mockedAxios.get).toHaveBeenCalledWith('/progress');
    });

    it('pull returns null if not authenticated', async () => {
        vi.mocked(authUtils.getAuthToken).mockReturnValue(null);
        const result = await SyncService.pull();
        expect(result).toBeNull();
        expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('pull handles error', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const result = await SyncService.pull();

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Pull error'), expect.any(Error));
    });

    it('push sends to server', async () => {
        mockedAxios.post.mockResolvedValueOnce({});
        const result = await SyncService.push(mockProgress);
        expect(result).toBe(true);
        expect(mockedAxios.post).toHaveBeenCalledWith('/progress', mockProgress);
    });

    it('push handles error', async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error('Post Error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const result = await SyncService.push(mockProgress);

        expect(result).toBe(false);
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Push error'), expect.any(Error));
    });

    it('sync merges local and server', async () => {
        localStorage.setItem('codenium_user_progress', JSON.stringify(mockProgress));
        mockedAxios.post.mockResolvedValueOnce({ data: { ...mockProgress, lastSyncedAt: 2000 } });

        const result = await SyncService.sync();

        expect(result?.lastSyncedAt).toBe(2000);
        // Should update local storage
        expect(JSON.parse(localStorage.getItem('codenium_user_progress')!).lastSyncedAt).toBe(2000);
    });

    it('sync returns null if already syncing', async () => {
        // Set private field isSyncing to true via cast (or just call sync twice?)
        // Calling sync twice quickly is better.
        // We need the first one to hang a bit.
        mockedAxios.post.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

        const p1 = SyncService.sync();
        const p2 = SyncService.sync(); // Should return null immediately

        const res2 = await p2;
        expect(res2).toBeNull();

        await p1; // Let p1 finish
    });

    it('sync handles API error', async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error('Sync Fail'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const result = await SyncService.sync();

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Sync error'), expect.any(Error));
    });

    it('markSolved adds problem and syncs', async () => {
        const syncSpy = vi.spyOn(SyncService, 'sync').mockResolvedValue(mockProgress);

        SyncService.markSolved('new-problem', 'console.log("hi")');

        const stored = JSON.parse(localStorage.getItem('codenium_user_progress')!);
        expect(stored.solvedProblems).toHaveLength(1);
        expect(stored.solvedProblems[0].slug).toBe('new-problem');

        expect(syncSpy).toHaveBeenCalled();
    });

    it('saveDraft and getDraft work correctly', () => {
        SyncService.saveDraft('draft-slug', 'draft code');
        const retrieved = SyncService.getDraft('draft-slug');
        expect(retrieved).toBe('draft code');
    });

    it('getDraft returns null if expired', () => {
        const expiredDraft = {
            drafts: {
                'expired': { code: 'old', updatedAt: Date.now() - 1000000000 } // super old
            }
        };
        localStorage.setItem('codenium_user_progress', JSON.stringify(expiredDraft));

        const retrieved = SyncService.getDraft('expired');
        expect(retrieved).toBeNull();
    });

    it('markAttempted adds attempt', () => {
        SyncService.markAttempted('attempt-1');
        const stored = JSON.parse(localStorage.getItem('codenium_user_progress')!);
        expect(stored.attemptedProblems[0].slug).toBe('attempt-1');

        // Should not duplicate
        SyncService.markAttempted('attempt-1');
        const stored2 = JSON.parse(localStorage.getItem('codenium_user_progress')!);
        expect(stored2.attemptedProblems).toHaveLength(1);
    });

    it('isSolved returns true if problem is solved', () => {
        SyncService.markSolved('solved-slug');
        expect(SyncService.isSolved('solved-slug')).toBe(true);
        expect(SyncService.isSolved('other')).toBe(false);
    });

    it('isAttempted returns true if problem attempted but not solved', () => {
        SyncService.markAttempted('attempt-slug');
        expect(SyncService.isAttempted('attempt-slug')).toBe(true);
        expect(SyncService.isAttempted('other')).toBe(false);
    });

    it('isAttempted returns false if problem is solved', () => {
        SyncService.markAttempted('slug');
        SyncService.markSolved('slug');
        expect(SyncService.isAttempted('slug')).toBe(false);
    });

    it('resetStats clears solved and drafts but keeps userId', () => {
        localStorage.setItem('codenium_user_progress', JSON.stringify({
            ...mockProgress,
            userId: 'user123',
            solvedProblems: [{ slug: 'foo', timestamp: 1, code: '' }]
        }));

        SyncService.resetStats();

        const stored = SyncService.getLocalProgress();
        expect(stored.solvedProblems).toEqual([]);
        expect(stored.drafts).toEqual({});
        expect(stored.userId).toBe('');
    });

    it('resetAll clears everything', () => {
        SyncService.resetAll();
        const stored = SyncService.getLocalProgress();
        expect(stored.solvedProblems).toEqual([]);
        expect(stored.userId).toBe('');
    });

    it('autoSync functionality and focus/unload handlers', () => {
        vi.useFakeTimers();
        const syncSpy = vi.spyOn(SyncService, 'sync').mockResolvedValue(mockProgress);

        // Mock sendBeacon
        const sendBeaconSpy = vi.fn();
        Object.defineProperty(navigator, 'sendBeacon', {
            value: sendBeaconSpy,
            writable: true
        });

        SyncService.startAutoSync(5000);
        expect(syncSpy).toHaveBeenCalledTimes(1); // Initial sync

        vi.advanceTimersByTime(5000);
        expect(syncSpy).toHaveBeenCalledTimes(2);

        // Test Handle Focus
        window.dispatchEvent(new Event('focus'));
        expect(syncSpy).toHaveBeenCalledTimes(3);

        // Test Handle BeforeUnload
        window.dispatchEvent(new Event('beforeunload'));
        expect(sendBeaconSpy).toHaveBeenCalled(); // Should assume token present from beforeEach

        SyncService.stopAutoSync();
        vi.advanceTimersByTime(5000);
        expect(syncSpy).toHaveBeenCalledTimes(3); // No new calls

        vi.useRealTimers();
    });

    it('subscriber handles error gracefully', () => {
        const errorThrowingCallback = vi.fn().mockImplementation(() => {
            throw new Error('Callback Error');
        });
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        SyncService.subscribe(errorThrowingCallback);

        // Trigger update
        SyncService.saveLocalProgress(mockProgress);

        expect(errorThrowingCallback).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Subscriber error'), expect.any(Error));
    });

    it('skips sync if not authenticated', async () => {
        vi.mocked(authUtils.getAuthToken).mockReturnValue(null);
        const result = await SyncService.sync();
        expect(result).toBeNull();
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('gets last sync time', () => {
        SyncService.saveLocalProgress({ ...mockProgress, lastSyncedAt: 123456 });
        expect(SyncService.getLastSyncTime()).toBe(123456);

        SyncService.resetAll();
        expect(SyncService.getLastSyncTime()).toBeGreaterThan(0);
    });

    it('sets auth header in interceptor', () => {
        const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;

        // With token
        vi.mocked(authUtils.getAuthToken).mockReturnValue('test-token');
        if (interceptorCallback) {
            interceptorCallback(config);
            expect(config.headers.Authorization).toBe('Bearer test-token');
        }

        // Without token
        vi.mocked(authUtils.getAuthToken).mockReturnValue(null);
        config.headers = new AxiosHeaders();
        if (interceptorCallback) {
            interceptorCallback(config);
            expect(config.headers.Authorization).toBeUndefined();
        }
    });

    it('skips push if not authenticated', async () => {
        vi.mocked(authUtils.getAuthToken).mockReturnValue(null);
        const result = await SyncService.push(mockProgress);
        expect(result).toBe(false);
    });

    it('getDraft returns null for expired draft', () => {
        // Create a draft that is 8 days old (expired - TTL is 7 days)
        const expiredDate = Date.now() - (8 * 24 * 60 * 60 * 1000);
        const progressWithExpiredDraft: UserProgress = {
            ...mockProgress,
            drafts: {
                'expired-slug': { code: 'old code', updatedAt: expiredDate }
            }
        };
        localStorage.setItem('codenium_user_progress', JSON.stringify(progressWithExpiredDraft));

        const draft = SyncService.getDraft('expired-slug');
        expect(draft).toBeNull();

        // Draft should be cleared
        const updatedProgress = SyncService.getLocalProgress();
        expect(updatedProgress.drafts['expired-slug']).toBeUndefined();
    });

    it('getDraft returns code for valid draft', () => {
        const recentDate = Date.now() - (1 * 24 * 60 * 60 * 1000); // 1 day old
        const progressWithValidDraft: UserProgress = {
            ...mockProgress,
            drafts: {
                'valid-slug': { code: 'recent code', updatedAt: recentDate }
            }
        };
        localStorage.setItem('codenium_user_progress', JSON.stringify(progressWithValidDraft));

        const draft = SyncService.getDraft('valid-slug');
        expect(draft).toBe('recent code');
    });

    it('markAttempted initializes attemptedProblems array if undefined', () => {
        // Set progress without attemptedProblems array
        const progressWithoutAttempted = {
            userId: 'user123',
            lastSyncedAt: 1000,
            solvedProblems: [],
            drafts: {}
        };
        localStorage.setItem('codenium_user_progress', JSON.stringify(progressWithoutAttempted));

        SyncService.markAttempted('new-problem');

        const updated = SyncService.getLocalProgress();
        expect(updated.attemptedProblems).toHaveLength(1);
        expect(updated.attemptedProblems[0].slug).toBe('new-problem');
    });
});
