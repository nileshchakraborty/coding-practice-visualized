import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TieredProblemRepository } from '../TieredProblemRepository';
import { redisService } from '../../../../infrastructure/cache/RedisService';
import { supabase } from '../../../../infrastructure/db/SupabaseClient';

// Mock dependencies
vi.mock('../../../../infrastructure/cache/RedisService', () => ({
    redisService: {
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn()
    }
}));

vi.mock('../../../../infrastructure/db/SupabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(),
            upsert: vi.fn()
        }))
    }
}));

// Mock FileProblemRepository
const mockGetAllProblems = vi.fn();
const mockGetSolution = vi.fn();
const mockSaveSolution = vi.fn();

vi.mock('../../fs/FileProblemRepository', () => {
    return {
        FileProblemRepository: vi.fn(function () {
            return {
                getAllProblems: mockGetAllProblems,
                getSolution: mockGetSolution,
                saveSolution: mockSaveSolution
            };
        })
    };
});

describe('TieredProblemRepository', () => {
    let repo: TieredProblemRepository;

    beforeEach(() => {
        vi.clearAllMocks();
        repo = new TieredProblemRepository();
    });

    describe('getAllProblems', () => {
        it('should prioritize local file system over Supabase', async () => {
            // Setup: Cache miss
            vi.mocked(redisService.get).mockResolvedValue(null);

            // Setup: File repo returns data
            const fileData = {
                categories: [{ name: 'Test Cat', problems: [{ slug: 'p1', title: 'P1' }] }]
            };
            mockGetAllProblems.mockResolvedValue(fileData);

            // Execute
            const result = await repo.getAllProblems();

            // Assert
            expect(result).toEqual(fileData);
            expect(mockGetAllProblems).toHaveBeenCalled();
            expect(supabase.from).not.toHaveBeenCalled(); // Should NOT call Supabase if file works
            expect(redisService.set).toHaveBeenCalledWith(expect.any(String), fileData, expect.any(Number));
        });

        it('should fallback to Supabase if file repo fails or is empty', async () => {
            // Setup: Cache miss
            vi.mocked(redisService.get).mockResolvedValue(null);

            // Setup: File repo fails
            mockGetAllProblems.mockRejectedValue(new Error('File not found'));

            // Setup: Supabase returns data
            const dbRows = [{
                slug: 'p1', title: 'P1', difficulty: 'Easy', category: 'Test Cat',
                data: { slug: 'p1', title: 'P1', difficulty: 'Easy' }
            }];

            const mockSelect = vi.fn().mockResolvedValue({ data: dbRows, error: null });
            vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

            // Execute
            const result = await repo.getAllProblems();

            // Assert
            expect(mockGetAllProblems).toHaveBeenCalled(); // Tried file
            expect(supabase.from).toHaveBeenCalledWith('problems'); // Fell back to DB
            expect(result.categories[0].name).toBe('Test Cat');
            expect(result.categories[0].problems[0].slug).toBe('p1');
        });

        it('should return empty categories if all sources fail', async () => {
            // Cache miss
            vi.mocked(redisService.get).mockResolvedValue(null);
            // File fail
            mockGetAllProblems.mockRejectedValue(new Error('File error'));
            // DB fail
            const mockSelect = vi.fn().mockResolvedValue({ data: null, error: 'DB Error' });
            vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

            const result = await repo.getAllProblems();
            expect(result).toEqual({ categories: [] });
        });
    });

    describe('getSolution', () => {
        it('should try Redis -> Supabase -> File System', async () => {
            // Setup: Redis miss
            vi.mocked(redisService.get).mockResolvedValue(null);

            // Setup: Supabase miss/fail
            const mockSingle = vi.fn().mockResolvedValue({ data: null, error: 'Not found' });
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: mockSingle
            } as any);

            // Setup: File System success
            const fileSol = { slug: 's1', code: 'print("hello")' };
            mockGetSolution.mockResolvedValue(fileSol);

            // Execute
            const result = await repo.getSolution('s1');

            // Assert
            expect(redisService.get).toHaveBeenCalled(); // L2
            expect(supabase.from).toHaveBeenCalledWith('solutions'); // L4 (using logic from file)
            expect(mockGetSolution).toHaveBeenCalledWith('s1'); // L3 Fallback
            expect(result).toEqual(fileSol);
        });
    });
});
