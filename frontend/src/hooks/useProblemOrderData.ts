/**
 * useProblemOrderData - Custom hook for managing problem order data
 * Extracted from ProblemOrderPage to reduce component complexity
 */
/* eslint-disable max-lines-per-function */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface Problem {
    slug: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface CategoryData {
    name: string;
    problems: Problem[];
    originalOrder: string[];
    isExpanded: boolean;
    hasChanges: boolean;
}

export function useProblemOrderData() {
    const navigate = useNavigate();
    const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingCategory, setSavingCategory] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const adminToken = sessionStorage.getItem('admin_token');

    // Check auth on mount
    useEffect(() => {
        if (!adminToken) {
            navigate('/admin');
        }
    }, [adminToken, navigate]);

    // Fetch all problems and categories
    const loadData = useCallback(async () => {
        if (!adminToken) return;

        try {
            setLoading(true);
            const problemsRes = await fetch(`${API_BASE}/api/problems`);
            const problemsData = await problemsRes.json();

            const categories: CategoryData[] = [];

            if (problemsData.categories) {
                for (const cat of problemsData.categories) {
                    const problems: Problem[] = cat.problems.map((p: { slug: string; title: string; difficulty: 'Easy' | 'Medium' | 'Hard' }) => ({
                        slug: p.slug,
                        title: p.title,
                        difficulty: p.difficulty,
                    }));

                    try {
                        const orderRes = await fetch(
                            `${API_BASE}/api/admin/problem-order/${encodeURIComponent(cat.name)}`,
                            { headers: { 'Authorization': `Bearer ${adminToken}` } }
                        );
                        const orderData = await orderRes.json();

                        if (orderData.order && orderData.order.length > 0) {
                            const ordered: Problem[] = [];
                            const remaining = [...problems];

                            for (const slug of orderData.order) {
                                const idx = remaining.findIndex(p => p.slug === slug);
                                if (idx !== -1) {
                                    ordered.push(remaining.splice(idx, 1)[0]);
                                }
                            }
                            ordered.push(...remaining);

                            categories.push({
                                name: cat.name,
                                problems: ordered,
                                originalOrder: ordered.map(p => p.slug),
                                isExpanded: false,
                                hasChanges: false,
                            });
                        } else {
                            categories.push({
                                name: cat.name,
                                problems,
                                originalOrder: problems.map(p => p.slug),
                                isExpanded: false,
                                hasChanges: false,
                            });
                        }
                    } catch {
                        categories.push({
                            name: cat.name,
                            problems,
                            originalOrder: problems.map(p => p.slug),
                            isExpanded: false,
                            hasChanges: false,
                        });
                    }
                }
            }

            setCategoryData(categories);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [adminToken]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Toggle category expansion
    const toggleCategory = (categoryName: string) => {
        setCategoryData(prev => prev.map(cat =>
            cat.name === categoryName
                ? { ...cat, isExpanded: !cat.isExpanded }
                : cat
        ));
    };

    // Handle drag end within a category
    const handleDragEnd = (categoryName: string, event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setCategoryData(prev => prev.map(cat => {
                if (cat.name !== categoryName) return cat;

                const oldIndex = cat.problems.findIndex(p => p.slug === active.id);
                const newIndex = cat.problems.findIndex(p => p.slug === over.id);
                const newProblems = arrayMove(cat.problems, oldIndex, newIndex);
                const newOrder = newProblems.map(p => p.slug);
                const hasChanges = JSON.stringify(newOrder) !== JSON.stringify(cat.originalOrder);

                return {
                    ...cat,
                    problems: newProblems,
                    hasChanges,
                };
            }));
        }
    };

    // Save order for a category
    const handleSave = async (categoryName: string) => {
        if (!adminToken) return;

        const category = categoryData.find(c => c.name === categoryName);
        if (!category) return;

        setSavingCategory(categoryName);
        setError(null);
        setSuccess(null);

        try {
            const order = category.problems.map(p => p.slug);
            const response = await fetch(
                `${API_BASE}/api/admin/problem-order/${encodeURIComponent(categoryName)}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminToken}`
                    },
                    body: JSON.stringify({ order })
                }
            );

            if (!response.ok) throw new Error('Failed to save');

            setCategoryData(prev => prev.map(cat =>
                cat.name === categoryName
                    ? { ...cat, originalOrder: order, hasChanges: false }
                    : cat
            ));
            setSuccess(`Saved order for "${categoryName}"`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSavingCategory(null);
        }
    };

    // Reset order for a category
    const handleReset = (categoryName: string) => {
        setCategoryData(prev => prev.map(cat => {
            if (cat.name !== categoryName) return cat;

            const problemMap = new Map(cat.problems.map(p => [p.slug, p]));
            const orderedProblems: Problem[] = [];

            for (const slug of cat.originalOrder) {
                const problem = problemMap.get(slug);
                if (problem) orderedProblems.push(problem);
            }

            return {
                ...cat,
                problems: orderedProblems,
                hasChanges: false,
            };
        }));
    };

    const changedCount = categoryData.filter(c => c.hasChanges).length;

    return {
        categoryData,
        loading,
        savingCategory,
        error,
        success,
        changedCount,
        toggleCategory,
        handleDragEnd,
        handleSave,
        handleReset,
    };
}
