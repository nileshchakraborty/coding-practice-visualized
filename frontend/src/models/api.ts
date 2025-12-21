/**
 * API Client - Centralized data access layer
 * Part of MVVM Model layer
 */
import axios from 'axios';
import type { Problem, Solution, Stats, RunResponse } from './types';
import { getAuthToken } from '../utils/auth';

const API_BASE = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || '/api');

// Create axios instance with auth interceptor
const api = axios.create({
    baseURL: API_BASE,
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Problems API
 */
export const ProblemsAPI = {
    /**
     * Fetch all problems with categories
     */
    async getAll(): Promise<Stats> {
        const response = await api.get<Stats>('/problems');
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
            const response = await api.get<Solution>(`/solutions/${slug}`);
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
        const response = await api.post('/generate', { slug });
        return response.data;
    },
};

/**
 * Playground API
 */
export const PlaygroundAPI = {
    /**
     * Run code against test cases
     * Uses job queue for async execution with user isolation
     */
    async runCode(
        code: string,
        slug: string,
        testCases?: { input: string; output: string }[],
        language: string = 'python',
        options?: {
            useJobQueue?: boolean;
            onStatusUpdate?: (status: { status: string }) => void;
        }
    ): Promise<RunResponse> {
        // Default to sync execution (job queue doesn't work in serverless due to stateless instances)
        const useQueue = options?.useJobQueue ?? false;

        if (useQueue) {
            // Dynamic import to avoid circular dependencies
            const { JobService } = await import('../services/JobService');

            return JobService.submitAndPoll<RunResponse>('execute', {
                code,
                slug,
                testCases,
                language,
            }, {
                onStatusUpdate: options?.onStatusUpdate,
            });
        }

        // Direct synchronous call (legacy fallback)
        const response = await api.post<RunResponse>('/execute', {
            code,
            slug,
            testCases,
            language,
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
     * Uses job queue for async execution with user isolation
     */
    async chat(
        slug: string,
        message: string,
        history: { role: string; content: string }[],
        options?: {
            useJobQueue?: boolean;
            onStatusUpdate?: (status: { status: string }) => void;
        }
    ): Promise<{ response?: string; error?: string }> {
        const useQueue = options?.useJobQueue ?? true;  // Default to job queue

        if (useQueue) {
            const { JobService } = await import('../services/JobService');

            return JobService.submitAndPoll<{ response?: string; error?: string }>('ai_tutor', {
                slug,
                message,
                history,
            }, {
                onStatusUpdate: options?.onStatusUpdate,
            });
        }

        // Direct synchronous call (legacy fallback)
        const response = await api.post('/ai/tutor', {
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

