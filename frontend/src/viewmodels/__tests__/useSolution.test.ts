import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSolution } from '../useSolution';
import { SolutionsAPI } from '../../models';

// Mock SolutionsAPI
vi.mock('../../models', () => ({
    SolutionsAPI: {
        getBySlug: vi.fn(),
        generate: vi.fn(),
    },
}));

const mockSolution = {
    slug: 'two-sum',
    title: 'Two Sum',
    problemStatement: 'Statement',
    description: 'Description',
    code: 'def twoSum...',
    examples: [],
    approaches: [],
    videoId: '',
    hints: ['Hint'],
    relatedProblems: [],
    constraints: [],
    initialCode: 'def twoSum...',
    implementations: {},
    oneliner: 'Summary',
    bruteForceTimeComplexity: 'O(n^2)',
    bruteForceSpaceComplexity: 'O(1)',
    bruteForceIntuition: ['Intuition']
};

describe('useSolution', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes with null input', () => {
        const { result } = renderHook(() => useSolution(null));
        expect(result.current.solution).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.hasSolution).toBe(false);
    });

    it('fetches solution on mount', async () => {
        vi.mocked(SolutionsAPI.getBySlug).mockResolvedValue(mockSolution as unknown as import('../../models/types').Solution);

        const { result } = renderHook(() => useSolution('two-sum'));

        expect(result.current.loading).toBe(true);
        expect(result.current.error).toBeNull();

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.solution).toEqual(mockSolution);
        expect(result.current.hasSolution).toBe(true);
    });

    it('handles fetch error', async () => {
        vi.mocked(SolutionsAPI.getBySlug).mockRejectedValue(new Error('Fetch Failed'));

        const { result } = renderHook(() => useSolution('two-sum'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('Fetch Failed');
        expect(result.current.solution).toBeNull();
    });

    it('resets state when slug changes to null', async () => {
        vi.mocked(SolutionsAPI.getBySlug).mockResolvedValue(mockSolution as unknown as import('../../models/types').Solution);
        const { result, rerender } = renderHook(({ slug }) => useSolution(slug), {
            initialProps: { slug: 'two-sum' }
        });

        await waitFor(() => expect(result.current.solution).toEqual(mockSolution));

        rerender({ slug: null as unknown as string });

        expect(result.current.solution).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('manually fetches solution', async () => {
        vi.mocked(SolutionsAPI.getBySlug).mockResolvedValue(mockSolution as unknown as import('../../models/types').Solution);
        const { result } = renderHook(() => useSolution(null));

        await act(async () => {
            await result.current.fetchSolution('two-sum');
        });

        expect(result.current.solution).toEqual(mockSolution);
    });

    it('manually fetches error', async () => {
        vi.mocked(SolutionsAPI.getBySlug).mockRejectedValue(new Error('Manual Fail'));
        const { result } = renderHook(() => useSolution(null));

        await act(async () => {
            await result.current.fetchSolution('two-sum');
        });

        expect(result.current.error).toBe('Manual Fail');
    });

    it('generates solution successfully', async () => {
        // First setup solution state
        vi.mocked(SolutionsAPI.getBySlug).mockResolvedValue(mockSolution as unknown as import('../../models/types').Solution);
        vi.mocked(SolutionsAPI.generate).mockResolvedValue({ success: true });

        const { result } = renderHook(() => useSolution('two-sum'));
        await waitFor(() => expect(result.current.loading).toBe(false));

        // Call generate
        await act(async () => {
            await result.current.generateSolution();
        });

        expect(result.current.isGenerating).toBe(false);
        // Should refetch
        expect(SolutionsAPI.getBySlug).toHaveBeenCalledTimes(2);
    });

    it('handles generation failure (API returns success: false)', async () => {
        vi.mocked(SolutionsAPI.getBySlug).mockResolvedValue(mockSolution as unknown as import('../../models/types').Solution);
        vi.mocked(SolutionsAPI.generate).mockResolvedValue({ success: false, error: 'Gen Error' });

        const { result } = renderHook(() => useSolution('two-sum'));
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.generateSolution();
        });

        expect(result.current.error).toBe('Gen Error');
        expect(result.current.isGenerating).toBe(false);
    });

    it('handles generation exception', async () => {
        vi.mocked(SolutionsAPI.getBySlug).mockResolvedValue(mockSolution as unknown as import('../../models/types').Solution);
        vi.mocked(SolutionsAPI.generate).mockRejectedValue(new Error('Gen Exception'));

        const { result } = renderHook(() => useSolution('two-sum'));
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.generateSolution();
        });

        expect(result.current.error).toBe('Gen Exception');
    });

    // I will insert NEW tests here

    it('handles non-Error objects thrown during fetch', async () => {
        vi.mocked(SolutionsAPI.getBySlug).mockRejectedValue('String Error');
        const { result } = renderHook(() => useSolution('two-sum'));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe('Failed to fetch solution');
    });

    it('handles non-Error objects thrown during generate', async () => {
        vi.mocked(SolutionsAPI.getBySlug).mockResolvedValue(mockSolution as unknown as import('../../models/types').Solution);
        vi.mocked(SolutionsAPI.generate).mockRejectedValue('String Error');

        const { result } = renderHook(() => useSolution('two-sum'));
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.generateSolution();
        });

        expect(result.current.error).toBe('Failed to generate solution');
    });

    it('handles generation failure without specific error message', async () => {
        vi.mocked(SolutionsAPI.getBySlug).mockResolvedValue(mockSolution as unknown as import('../../models/types').Solution);
        vi.mocked(SolutionsAPI.generate).mockResolvedValue({ success: false }); // No error prop

        const { result } = renderHook(() => useSolution('two-sum'));
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.generateSolution();
        });

        expect(result.current.error).toBe('Failed to generate solution');
    });

    it('does not generate if no slug', async () => {
        const { result } = renderHook(() => useSolution(null));
        await act(async () => {
            await result.current.generateSolution();
        });
        expect(SolutionsAPI.generate).not.toHaveBeenCalled();
    });

    it('switches tabs', () => {
        const { result } = renderHook(() => useSolution(null));
        act(() => {
            result.current.switchTab('code');
        });
        expect(result.current.activeTab).toBe('code');
    });

    it('resets state manually', async () => {
        vi.mocked(SolutionsAPI.getBySlug).mockResolvedValue(mockSolution as unknown as import('../../models/types').Solution);
        const { result } = renderHook(() => useSolution('two-sum'));
        await waitFor(() => expect(result.current.solution).not.toBeNull());

        act(() => {
            result.current.switchTab('code');
            result.current.reset();
        });

        expect(result.current.solution).toBeNull();
        expect(result.current.activeTab).toBe('problem');
    });

    it('handles non-Error object thrown in fetchSolution', async () => {
        vi.mocked(SolutionsAPI.getBySlug).mockRejectedValue('string error');

        const { result } = renderHook(() => useSolution('test-slug'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('Failed to fetch solution');
    });

    it('handles non-Error object thrown in generateSolution', async () => {
        vi.mocked(SolutionsAPI.getBySlug).mockResolvedValue(null);
        vi.mocked(SolutionsAPI.generate).mockRejectedValue('string error');

        const { result } = renderHook(() => useSolution('test-slug'));
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.generateSolution();
        });

        expect(result.current.error).toBe('Failed to generate solution');
    });
});
