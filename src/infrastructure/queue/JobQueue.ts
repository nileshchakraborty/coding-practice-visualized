/**
 * JobQueue - In-memory job queue with user isolation
 * 
 * Features:
 * - User-scoped job storage (only owner can access their jobs)
 * - TTL-based cleanup (jobs expire after 1 hour)
 * - Async job processing with status tracking
 */

import { v4 as uuidv4 } from 'uuid';

export type JobType = 'execute' | 'ai_tutor' | 'ai_hint' | 'ai_explain' | 'generate';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Job {
    id: string;
    userId: string;
    type: JobType;
    status: JobStatus;
    payload: Record<string, unknown>;
    result?: unknown;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface JobSubmission {
    userId: string;
    type: JobType;
    payload: Record<string, unknown>;
}

export interface JobResult {
    id: string;
    status: JobStatus;
    result?: unknown;
    error?: string;
}

// Job processor function type
export type JobProcessor = (job: Job) => Promise<unknown>;

class JobQueueService {
    private jobs: Map<string, Job> = new Map();
    private processors: Map<JobType, JobProcessor> = new Map();
    private readonly JOB_TTL_MS = 60 * 60 * 1000; // 1 hour
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Start cleanup interval
        this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
    }

    /**
     * Register a processor for a job type
     */
    registerProcessor(type: JobType, processor: JobProcessor): void {
        this.processors.set(type, processor);
        console.log(`[JobQueue] Registered processor for: ${type}`);
    }

    /**
     * Submit a new job to the queue
     */
    async submit(submission: JobSubmission): Promise<string> {
        const jobId = uuidv4();
        const now = new Date();

        const job: Job = {
            id: jobId,
            userId: submission.userId,
            type: submission.type,
            status: 'pending',
            payload: submission.payload,
            createdAt: now,
            updatedAt: now,
        };

        this.jobs.set(jobId, job);
        console.log(`[JobQueue] Job submitted: ${jobId} (type: ${job.type}, user: ${job.userId})`);

        // Process job asynchronously
        this.processJob(jobId).catch(err => {
            console.error(`[JobQueue] Job ${jobId} processing error:`, err);
        });

        return jobId;
    }

    /**
     * Get job by ID (with user validation)
     */
    getJob(jobId: string, userId: string): JobResult | null {
        const job = this.jobs.get(jobId);

        if (!job) {
            return null;
        }

        // User isolation check
        if (job.userId !== userId) {
            throw new Error('ACCESS_DENIED');
        }

        return {
            id: job.id,
            status: job.status,
            result: job.result,
            error: job.error,
        };
    }

    /**
     * Get all jobs for a user
     */
    getUserJobs(userId: string, limit: number = 10): JobResult[] {
        const userJobs: JobResult[] = [];

        for (const job of this.jobs.values()) {
            if (job.userId === userId) {
                userJobs.push({
                    id: job.id,
                    status: job.status,
                    result: job.result,
                    error: job.error,
                });
            }
        }

        // Sort by creation date (newest first) and limit
        return userJobs.slice(0, limit);
    }

    /**
     * Process a job
     */
    private async processJob(jobId: string): Promise<void> {
        const job = this.jobs.get(jobId);
        if (!job) return;

        const processor = this.processors.get(job.type);
        if (!processor) {
            this.updateJob(jobId, 'failed', undefined, `No processor registered for job type: ${job.type}`);
            return;
        }

        // Update status to processing
        this.updateJob(jobId, 'processing');

        try {
            const result = await processor(job);
            this.updateJob(jobId, 'completed', result);
            console.log(`[JobQueue] Job completed: ${jobId}`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            this.updateJob(jobId, 'failed', undefined, errorMessage);
            console.error(`[JobQueue] Job failed: ${jobId}`, errorMessage);
        }
    }

    /**
     * Update job status
     */
    private updateJob(jobId: string, status: JobStatus, result?: unknown, error?: string): void {
        const job = this.jobs.get(jobId);
        if (!job) return;

        job.status = status;
        job.updatedAt = new Date();

        if (result !== undefined) {
            job.result = result;
        }
        if (error !== undefined) {
            job.error = error;
        }

        this.jobs.set(jobId, job);
    }

    /**
     * Cleanup expired jobs
     */
    private cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [jobId, job] of this.jobs.entries()) {
            const age = now - job.createdAt.getTime();
            if (age > this.JOB_TTL_MS) {
                this.jobs.delete(jobId);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`[JobQueue] Cleaned up ${cleaned} expired jobs`);
        }
    }

    /**
     * Get queue stats
     */
    getStats(): { total: number; byStatus: Record<JobStatus, number> } {
        const byStatus: Record<JobStatus, number> = {
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0,
        };

        for (const job of this.jobs.values()) {
            byStatus[job.status]++;
        }

        return {
            total: this.jobs.size,
            byStatus,
        };
    }

    /**
     * Shutdown cleanup
     */
    shutdown(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// Singleton instance
export const jobQueue = new JobQueueService();
