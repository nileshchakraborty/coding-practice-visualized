/**
 * useSolution ViewModel
 * Manages solution modal state and tab navigation
 */
import { useState, useCallback, useEffect } from 'react';
import { SolutionsAPI } from '../models';
import type { Solution } from '../models';

export type TabType = 'problem' | 'explanation' | 'code' | 'playground' | 'tutor';

export interface SolutionState {
    solution: Solution | null;
    loading: boolean;
    error: string | null;
    activeTab: TabType;
    isGenerating: boolean;
}

export function useSolution(slug: string | null) {
    const [solution, setSolution] = useState<Solution | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('problem');
    const [isGenerating, setIsGenerating] = useState(false);

    // Fetch solution when slug changes
    useEffect(() => {
        if (slug) {
            (async () => {
                try {
                    setLoading(true);
                    setError(null);
                    const data = await SolutionsAPI.getBySlug(slug);
                    setSolution(data);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to fetch solution');
                } finally {
                    setLoading(false);
                }
            })();
        } else {
            setSolution(null);
            setError(null);
        }
    }, [slug]);

    const fetchSolution = useCallback(async (solutionSlug: string) => {
        try {
            setLoading(true);
            setError(null);
            const data = await SolutionsAPI.getBySlug(solutionSlug);
            setSolution(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch solution');
        } finally {
            setLoading(false);
        }
    }, []);

    const generateSolution = useCallback(async () => {
        if (!slug) return;

        try {
            setIsGenerating(true);
            setError(null);
            const result = await SolutionsAPI.generate(slug);

            if (result.success) {
                // Refetch the solution
                await fetchSolution(slug);
            } else {
                setError(result.error || 'Failed to generate solution');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate solution');
        } finally {
            setIsGenerating(false);
        }
    }, [slug, fetchSolution]);

    const switchTab = useCallback((tab: TabType) => {
        setActiveTab(tab);
    }, []);

    const reset = useCallback(() => {
        setSolution(null);
        setError(null);
        setActiveTab('problem');
    }, []);

    return {
        // State
        solution,
        loading,
        error,
        activeTab,
        isGenerating,

        // Derived
        hasSolution: solution !== null,

        // Actions
        fetchSolution,
        generateSolution,
        switchTab,
        reset,
    };
}

export type SolutionViewModel = ReturnType<typeof useSolution>;
