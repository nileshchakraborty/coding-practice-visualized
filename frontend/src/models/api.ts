/**
 * API Client - Centralized data access layer
 * Part of MVVM Model layer
 */
import axios from 'axios';
import type { Problem, Solution, Stats, RunResponse } from './types';

const API_BASE = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || '/api');

/**
 * Problems API
 */
export const ProblemsAPI = {
    /**
     * Fetch all problems with categories
     */
    async getAll(): Promise<Stats> {
        const response = await axios.get<Stats>(`${API_BASE}/problems`);
        return response.data;
    },

    /**
     * Get problem by slug
     */
    async getBySlug(slug: string): Promise<Problem | null> {
        const stats = await this.getAll();
        for (const category of stats.categories) {
            const problem = category.problems.find(p => p.slug === slug);
            if (problem) return problem;
        }
        return null;
    },
};

/**
 * Solutions API
 */
export const SolutionsAPI = {
    /**
     * Fetch solution by slug
     */
    async getBySlug(slug: string): Promise<Solution | null> {
        try {
            const response = await axios.get<Solution>(`${API_BASE}/solutions/${slug}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    /**
     * Generate solution using AI
     */
    async generate(slug: string): Promise<{ success: boolean; cached?: boolean; error?: string }> {
        const response = await axios.post(`${API_BASE}/generate`, { slug });
        return response.data;
    },
};

/**
 * Playground API
 */
export const PlaygroundAPI = {
    /**
     * Run code against test cases
     */
    async runCode(
        code: string,
        slug: string,
        testCases?: { input: string; output: string }[]
    ): Promise<RunResponse> {
        const response = await axios.post<RunResponse>(`${API_BASE}/execute`, {
            code,
            slug,
            testCases,
        });
        return response.data;
    },
};

/**
 * Tutor API
 */
export const TutorAPI = {
    /**
     * Send message to AI tutor
     */
    async chat(
        slug: string,
        message: string,
        history: { role: string; content: string }[]
    ): Promise<{ response?: string; error?: string }> {
        const response = await axios.post(`${API_BASE}/ai/tutor`, {
            slug,
            message,
            history,
        });
        return response.data;
    },
};

// Default export for convenience
export default {
    problems: ProblemsAPI,
    solutions: SolutionsAPI,
    playground: PlaygroundAPI,
    tutor: TutorAPI,
};
