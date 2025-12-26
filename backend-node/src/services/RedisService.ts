import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { CircuitBreaker } from '../utils/CircuitBreaker';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

class RedisService {
    private client: Redis | null = null;
    private isConnected: boolean = false;
    private breaker: CircuitBreaker;

    constructor() {
        this.breaker = new CircuitBreaker('Redis');

        // Only initialize if REDIS_URL is present or assume localhost default
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        try {
            this.client = new Redis(redisUrl, {
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                maxRetriesPerRequest: 3,
                lazyConnect: true
            });

            this.client.on('connect', () => {
                console.log('✅ Connected to Redis');
                this.isConnected = true;
            });

            this.client.on('error', (err) => {
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
            }, async () => {
                return null;
            });
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
            // Ignore cache write errors
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
