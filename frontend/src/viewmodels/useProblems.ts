/**
 * useProblems ViewModel
 * Manages problem list state and filtering logic
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { ProblemsAPI } from '../models';
import type { Problem, Stats } from '../models';

export interface ProblemsFilter {
    search: string;
    difficulty: 'All' | 'Easy' | 'Medium' | 'Hard';
    hasSolution: boolean | null;
    subTopic: string | null;
}

export interface ProblemsState {
    stats: Stats | null;
    loading: boolean;
    error: string | null;
    filter: ProblemsFilter;
    selectedCategory: string | null;
}

const defaultFilter: ProblemsFilter = {
    search: '',
    difficulty: 'All',
    hasSolution: null,
    subTopic: null,
};


export function useProblems() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<ProblemsFilter>(defaultFilter);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Fetch problems on mount
    useEffect(() => {
        fetchProblems();
    }, []);

    const fetchProblems = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await ProblemsAPI.getAll();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch problems');
        } finally {
            setLoading(false);
        }
    }, []);

    // Filter problems based on current filter
    const filterProblems = useCallback((problems: Problem[]): Problem[] => {
        return problems.filter(p => {
            // Search filter
            if (filter.search && !p.title.toLowerCase().includes(filter.search.toLowerCase())) {
                return false;
            }
            // Difficulty filter
            if (filter.difficulty !== 'All' && p.difficulty !== filter.difficulty) {
                return false;
            }
            // Has solution filter
            if (filter.hasSolution !== null && p.has_solution !== filter.hasSolution) {
                return false;
            }
            // SubTopic filter
            if (filter.subTopic && p.subTopic !== filter.subTopic) {
                return false;
            }
            return true;
        });
    }, [filter]);

    // Get filtered categories
    const filteredCategories = useMemo(() => {
        if (!stats) return [];
        return stats.categories.map(cat => ({
            ...cat,
            problems: filterProblems(cat.problems),
        }));
    }, [stats, filterProblems]);

    // Get unique subtopics
    const subtopics = useMemo(() => {
        if (!stats) return [];
        const topicsSet = new Set<string>();
        stats.categories.forEach(cat => {
            cat.problems.forEach(p => {
                if (p.subTopic) topicsSet.add(p.subTopic);
            });
        });
        return Array.from(topicsSet).sort();
    }, [stats]);

    // Patterns useMemo removed

    // Actions
    const updateFilter = useCallback((updates: Partial<ProblemsFilter>) => {
        setFilter(prev => ({ ...prev, ...updates }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilter(defaultFilter);
    }, []);

    const selectCategory = useCallback((category: string | null) => {
        setSelectedCategory(category);
    }, []);

    return {
        // State
        stats,
        loading,
        error,
        filter,
        selectedCategory,
        filteredCategories,
        subtopics,

        // Actions
        fetchProblems,
        updateFilter,
        clearFilters,
        selectCategory,
    };
}

export type ProblemsViewModel = ReturnType<typeof useProblems>;
