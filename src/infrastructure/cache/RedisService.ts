import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { CircuitBreaker } from '../resilience/CircuitBreaker';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

class RedisService {
    private client: Redis | null = null;
    private isConnected: boolean = false;
    private breaker: CircuitBreaker;

    constructor() {
        this.breaker = new CircuitBreaker('Redis');

        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        try {
            this.client = new Redis(redisUrl, {
                retryStrategy: (times) => {
                    return Math.min(times * 50, 2000);
                },
                maxRetriesPerRequest: 3,
                lazyConnect: true
            });

            this.client.on('connect', () => {
                console.log('✅ Connected to Redis (L2 Cache)');
                this.isConnected = true;
            });

            this.client.on('error', (err) => {
                // Log only if was connected to avoid spam on startup if missing
                if (this.isConnected) {
                    console.error('Redis disconnected:', err.message);
                }
                this.isConnected = false;
            });

            this.client.connect().catch(() => { });
        } catch (error) {
            console.warn('Failed to initialize Redis client:', error);
        }
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.client) return null;

        try {
            return await this.breaker.execute(async () => {
                if (!this.client) throw new Error('No client');
                const data = await this.client.get(key);
                return data ? JSON.parse(data) : null;
            }, async () => null); // Fallback: cache miss
        } catch (e) {
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        if (!this.client) return;

        try {
            await this.breaker.execute(async () => {
                if (!this.client) throw new Error('No client');
                const serialized = JSON.stringify(value);
                if (ttlSeconds) {
                    await this.client.set(key, serialized, 'EX', ttlSeconds);
                } else {
                    await this.client.set(key, serialized);
                }
            });
        } catch (e) {
            // Ignore write errors
        }
    }

    async del(key: string): Promise<void> {
        if (!this.client) return;
        try {
            await this.breaker.execute(async () => {
                if (!this.client) throw new Error('No client');
                await this.client.del(key);
            });
        } catch (e) { }
    }
}

export const redisService = new RedisService();
