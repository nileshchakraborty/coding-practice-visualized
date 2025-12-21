/**
 * JobService - Frontend service for job queue operations
 * 
 * Provides async job submission and polling with user isolation
 */

import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const API_BASE = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || '/api');

// Create axios instance with auth
const api = axios.create({
    baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export type JobType = 'execute' | 'ai_tutor' | 'ai_hint' | 'ai_explain' | 'generate';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface JobResult {
    id: string;
    status: JobStatus;
    result?: unknown;
    error?: string;
}

export interface JobSubmitResponse {
    jobId: string;
    status: 'pending';
}

export interface JobPollingOptions {
    maxAttempts?: number;      // Default: 120 (2 minutes with 1s interval)
    pollInterval?: number;     // Default: 1000ms
    onStatusUpdate?: (status: JobResult) => void;
}

/**
 * JobService - Async job submission and polling
 */
export const JobService = {
    /**
     * Submit a job to the queue
     */
    async submit(type: JobType, payload: Record<string, unknown>): Promise<JobSubmitResponse> {
        const response = await api.post<JobSubmitResponse>('/jobs/submit', {
            type,
            payload,
        });
        return response.data;
    },

    /**
     * Get job status
     */
    async getStatus(jobId: string): Promise<JobResult> {
        const response = await api.get<JobResult>(`/jobs/${jobId}`);
        return response.data;
    },

    /**
     * Poll a job until completion or failure
     */
    async poll<T = unknown>(
        jobId: string,
        options: JobPollingOptions = {}
    ): Promise<T> {
        const {
            maxAttempts = 120,
            pollInterval = 1000,
            onStatusUpdate,
        } = options;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const status = await this.getStatus(jobId);

            if (onStatusUpdate) {
                onStatusUpdate(status);
            }

            if (status.status === 'completed') {
                return status.result as T;
            }

            if (status.status === 'failed') {
                throw new Error(status.error || 'Job failed');
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        throw new Error('Job timed out - please try again');
    },

    /**
     * Submit and poll in one call (convenience method)
     */
    async submitAndPoll<T = unknown>(
        type: JobType,
        payload: Record<string, unknown>,
        options: JobPollingOptions = {}
    ): Promise<T> {
        const { jobId } = await this.submit(type, payload);
        return this.poll<T>(jobId, options);
    },

    /**
     * Get list of user's recent jobs
     */
    async list(limit: number = 10): Promise<{ jobs: JobResult[] }> {
        const response = await api.get<{ jobs: JobResult[] }>('/jobs', {
            params: { limit },
        });
        return response.data;
    },

    /**
     * Get queue stats (for debugging)
     */
    async getStats(): Promise<{ total: number; byStatus: Record<JobStatus, number> }> {
        const response = await api.get('/jobs/stats');
        return response.data;
    },
};

export default JobService;
