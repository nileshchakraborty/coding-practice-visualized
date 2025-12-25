import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProblems } from '../useProblems';
import { ProblemsAPI } from '../../models';

vi.mock('../../models', () => ({
    ProblemsAPI: {
        getAll: vi.fn()
    }
}));

const mockStats = {
    categories: [
        {
            name: 'Linear Data Structures',
            count: 2,
            icon: 'list',
            problems: [
                {
                    slug: 'two-sum',
                    title: 'Two Sum',
                    difficulty: 'Easy' as const,
                    has_solution: true,
                    subTopic: 'Hash Map',
                    id: 1,
                    category: 'Arrays',
                    url: 'https://leetcode.com/problems/two-sum'
                },
                {
                    slug: 'add-two-numbers',
                    title: 'Add Two Numbers',
                    difficulty: 'Medium' as const,
                    has_solution: false,
                    subTopic: 'Linked List',
                    id: 2,
                    category: 'LinkedList',
                    url: 'https://leetcode.com/problems/add-two-numbers'
                }
            ]
        }
    ],
    easy: 1,
    medium: 1,
    hard: 0
};

describe('useProblems', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches problems on mount success', async () => {
        vi.mocked(ProblemsAPI.getAll).mockResolvedValue(mockStats);

        const { result } = renderHook(() => useProblems());

        expect(result.current.loading).toBe(true);

        // Wait for effect
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.stats).toEqual(mockStats);
        expect(result.current.error).toBeNull();
    });

    it('handles fetch error', async () => {
        vi.mocked(ProblemsAPI.getAll).mockRejectedValue(new Error('Fetch Failed'));

        const { result } = renderHook(() => useProblems());

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Fetch Failed');
    });

    it('filters by search', async () => {
        vi.mocked(ProblemsAPI.getAll).mockResolvedValue(mockStats);
        const { result } = renderHook(() => useProblems());

        await act(async () => { await new Promise(r => setTimeout(r, 0)); });

        // Initial check
        expect(result.current.filteredCategories[0].problems).toHaveLength(2);

        // Filter search
        act(() => {
            result.current.updateFilter({ search: 'Two Sum' });
        });

        expect(result.current.filteredCategories[0].problems).toHaveLength(1);
        expect(result.current.filteredCategories[0].problems[0].slug).toBe('two-sum');

        // Case insensitive
        act(() => {
            result.current.updateFilter({ search: 'add' });
        });
        expect(result.current.filteredCategories[0].problems).toHaveLength(1);
        expect(result.current.filteredCategories[0].problems[0].slug).toBe('add-two-numbers');
    });

    it('filters by difficulty', async () => {
        vi.mocked(ProblemsAPI.getAll).mockResolvedValue(mockStats);
        const { result } = renderHook(() => useProblems());
        await act(async () => { await new Promise(r => setTimeout(r, 0)); });

        act(() => {
            result.current.updateFilter({ difficulty: 'Medium' });
        });

        expect(result.current.filteredCategories[0].problems).toHaveLength(1);
        expect(result.current.filteredCategories[0].problems[0].difficulty).toBe('Medium');
    });

    it('filters by hasSolution', async () => {
        vi.mocked(ProblemsAPI.getAll).mockResolvedValue(mockStats);
        const { result } = renderHook(() => useProblems());
        await act(async () => { await new Promise(r => setTimeout(r, 0)); });

        act(() => {
            result.current.updateFilter({ hasSolution: true });
        });

        expect(result.current.filteredCategories[0].problems).toHaveLength(1);
        expect(result.current.filteredCategories[0].problems[0].has_solution).toBe(true);
    });

    it('filters by subTopic', async () => {
        vi.mocked(ProblemsAPI.getAll).mockResolvedValue(mockStats);
        const { result } = renderHook(() => useProblems());
        await act(async () => { await new Promise(r => setTimeout(r, 0)); });

        act(() => {
            result.current.updateFilter({ subTopic: 'Hash Map' });
        });

        expect(result.current.filteredCategories[0].problems).toHaveLength(1);
        expect(result.current.filteredCategories[0].problems[0].subTopic).toBe('Hash Map');
    });

    it('computes subtopics', async () => {
        vi.mocked(ProblemsAPI.getAll).mockResolvedValue(mockStats);
        const { result } = renderHook(() => useProblems());
        await act(async () => { await new Promise(r => setTimeout(r, 0)); });

        expect(result.current.subtopics).toEqual(['Hash Map', 'Linked List']);
    });

    it('handles empty stats safely', () => {
        const { result } = renderHook(() => useProblems());
        // default initial state before load
        expect(result.current.stats).toBeNull();
        expect(result.current.filteredCategories).toEqual([]);
        expect(result.current.subtopics).toEqual([]);
    });

    it('clears filters', async () => {
        vi.mocked(ProblemsAPI.getAll).mockResolvedValue(mockStats);
        const { result } = renderHook(() => useProblems());
        await act(async () => { await new Promise(r => setTimeout(r, 0)); });

        act(() => {
            result.current.updateFilter({ search: 'Two Sum' });
        });
        expect(result.current.filter.search).toBe('Two Sum');

        act(() => {
            result.current.clearFilters();
        });
        expect(result.current.filter.search).toBe('');
    });

    it('selects category', () => {
        const { result } = renderHook(() => useProblems());
        act(() => {
            result.current.selectCategory('Arrays');
        });
        expect(result.current.selectedCategory).toBe('Arrays');
    });
    it('handles non-Error fetch failure', async () => {
        vi.mocked(ProblemsAPI.getAll).mockRejectedValue('String Error');
        const { result } = renderHook(() => useProblems());
        await act(async () => { await new Promise(r => setTimeout(r, 0)); });
        expect(result.current.error).toBe('Failed to fetch problems');
    });

    it('handles interaction with problems missing subtopics', async () => {
        const statsWithMissingSubtopic = {
            categories: [{
                name: 'Mixed',
                count: 2,
                icon: 'mix',
                problems: [
                    { id: 1, slug: 'p1', title: 'P1', difficulty: 'Easy' as const, has_solution: true, subTopic: 'Topic A', category: 'Mixed', url: 'url1' },
                    { id: 2, slug: 'p2', title: 'P2', difficulty: 'Easy' as const, has_solution: true, category: 'Mixed', url: 'url2' } // No subTopic
                ]
            }],
            easy: 2,
            medium: 0,
            hard: 0
        };
        vi.mocked(ProblemsAPI.getAll).mockResolvedValue(statsWithMissingSubtopic);
        const { result } = renderHook(() => useProblems());
        await act(async () => { await new Promise(r => setTimeout(r, 0)); });

        // Check subtopics list (should only have Topic A)
        expect(result.current.subtopics).toEqual(['Topic A']);

        // Filter by Topic A
        act(() => { result.current.updateFilter({ subTopic: 'Topic A' }); });
        expect(result.current.filteredCategories[0].problems).toHaveLength(1);
        expect(result.current.filteredCategories[0].problems[0].slug).toBe('p1');
    });
    it('filters by hasSolution false', async () => {
        vi.mocked(ProblemsAPI.getAll).mockResolvedValue(mockStats);
        const { result } = renderHook(() => useProblems());
        await act(async () => { await new Promise(r => setTimeout(r, 0)); });

        act(() => {
            result.current.updateFilter({ hasSolution: false });
        });

        expect(result.current.filteredCategories[0].problems).toHaveLength(1);
        expect(result.current.filteredCategories[0].problems[0].slug).toBe('add-two-numbers');
    });

    it('filters by multiple criteria (search + difficulty)', async () => {
        vi.mocked(ProblemsAPI.getAll).mockResolvedValue(mockStats);
        const { result } = renderHook(() => useProblems());
        await act(async () => { await new Promise(r => setTimeout(r, 0)); });

        act(() => {
            // 'Two Sum' is Easy. 'Add Two Numbers' is Medium.
            result.current.updateFilter({ search: 'Two', difficulty: 'Easy' });
        });

        expect(result.current.filteredCategories[0].problems).toHaveLength(1);
        expect(result.current.filteredCategories[0].problems[0].slug).toBe('two-sum');
    });

    it('returns all problems when difficulty is All', async () => {
        vi.mocked(ProblemsAPI.getAll).mockResolvedValue(mockStats);
        const { result } = renderHook(() => useProblems());
        await act(async () => { await new Promise(r => setTimeout(r, 0)); });

        act(() => {
            result.current.updateFilter({ difficulty: 'All' });
        });

        expect(result.current.filteredCategories[0].problems).toHaveLength(2);
    });
});
