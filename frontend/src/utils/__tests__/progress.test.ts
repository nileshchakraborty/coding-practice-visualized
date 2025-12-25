import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { ProgressService } from '../progress';
import { SyncService } from '../../services/SyncService';

// Mock SyncService
vi.mock('../../services/SyncService', () => ({
    SyncService: {
        getLocalProgress: vi.fn(),
        isSolved: vi.fn(),
        markSolved: vi.fn(),
        saveDraft: vi.fn(),
        getDraft: vi.fn(),
        sync: vi.fn(),
        getLastSyncTime: vi.fn(),
    },
}));

describe('ProgressService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getSolvedProblems delegates to SyncService', () => {
        const mockProgress = { solvedProblems: ['two-sum'] };
        (SyncService.getLocalProgress as Mock).mockReturnValue(mockProgress);

        const result = ProgressService.getSolvedProblems();
        expect(result).toEqual(['two-sum']);
        expect(SyncService.getLocalProgress).toHaveBeenCalled();
    });

    it('isSolved delegates to SyncService', () => {
        vi.mocked(SyncService.isSolved).mockReturnValue(true);

        const result = ProgressService.isSolved('two-sum');
        expect(result).toBe(true);
        expect(SyncService.isSolved).toHaveBeenCalledWith('two-sum');
    });

    it('markAsSolved delegates to SyncService', () => {
        ProgressService.markAsSolved('two-sum', 'code');
        expect(SyncService.markSolved).toHaveBeenCalledWith('two-sum', 'code');
    });

    it('saveProgress delegates to SyncService', () => {
        ProgressService.saveProgress('two-sum', 'code');
        expect(SyncService.saveDraft).toHaveBeenCalledWith('two-sum', 'code');
    });

    it('getDraft delegates to SyncService', () => {
        vi.mocked(SyncService.getDraft).mockReturnValue('draft code');

        const result = ProgressService.getDraft('two-sum');
        expect(result).toBe('draft code');
        expect(SyncService.getDraft).toHaveBeenCalledWith('two-sum');
    });

    it('sync delegates to SyncService', () => {
        ProgressService.sync();
        expect(SyncService.sync).toHaveBeenCalled();
    });

    it('getLastSyncTime delegates to SyncService', () => {
        vi.mocked(SyncService.getLastSyncTime).mockReturnValue(12345);

        const result = ProgressService.getLastSyncTime();
        expect(result).toBe(12345);
        expect(SyncService.getLastSyncTime).toHaveBeenCalled();
    });
});
