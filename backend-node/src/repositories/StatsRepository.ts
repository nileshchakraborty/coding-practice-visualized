import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { redisService } from '../services/RedisService';
import { supabase } from './SupabaseClient';
import { fileSyncService } from '../services/FileSyncService';

interface HotProblem {
    slug: string;
    score: number;
    views: number;
    solves: number;
}

interface HotTopic {
    category: string;
    engagement: number;
    problemCount: number;
}

interface StatsData {
    hotProblems: HotProblem[];
    hotTopics: HotTopic[];
}

const STATS_CACHE_KEY = 'stats:data';

class StatsRepository {
    private statsPath: string;
    private memoryCache: StatsData | null = null;

    constructor() {
        this.statsPath = path.resolve(__dirname, '../../', config.statsPath);
    }

    async loadStats(): Promise<StatsData> {
        // L1: Memory (Fastest, no CB needed)
        if (this.memoryCache) return this.memoryCache;

        // L2: Redis (Protected by CB inside wrapper)
        const cached = await redisService.get<StatsData>(STATS_CACHE_KEY);
        if (cached) {
            this.memoryCache = cached;
            return cached;
        }

        // L3: File System (Fallback)
        let localData: StatsData = { hotProblems: [], hotTopics: [] };
        if (fs.existsSync(this.statsPath)) {
            try {
                localData = JSON.parse(fs.readFileSync(this.statsPath, 'utf-8'));
            } catch (e) {
                console.error('Failed to parse local stats');
            }
        }

        // L4: Supabase (Source of Truth) -> Now with better fallback
        try {
            const { data: statsRows, error } = await supabase.from('stats').select('*');

            if (!error && statsRows && statsRows.length > 0) {
                // Transform rows to StatsData format
                const hotProblems = statsRows.map(row => ({
                    slug: row.slug,
                    views: row.views,
                    solves: row.solves,
                    score: row.score
                })).sort((a, b) => b.score - a.score).slice(0, 10);

                const mergedData = {
                    hotProblems,
                    hotTopics: localData.hotTopics
                };

                this.memoryCache = mergedData;
                await redisService.set(STATS_CACHE_KEY, mergedData);
                return mergedData;
            } else if (error) {
                return localData;
            }
        } catch (dbError) {
            console.warn('DB fetch failed (Network/CB), returning local file data');
            return localData;
        }

        // If DB empty or other case
        this.memoryCache = localData;
        return localData;
    }

    async saveStats(data: StatsData): Promise<void> {
        this.memoryCache = data;
        await redisService.set(STATS_CACHE_KEY, data);
        await fileSyncService.syncStatsToFile(data);
    }

    async updateProblemStats(updates: { slug: string; views?: number; solves?: number }[]): Promise<StatsData> {
        const stats = await this.loadStats();

        // 1. Update In-Memory Object
        const upserts: any[] = [];

        updates.forEach(update => {
            let problem = stats.hotProblems.find(p => p.slug === update.slug);
            if (!problem) {
                problem = { slug: update.slug, views: 0, solves: 0, score: 0 };
                stats.hotProblems.push(problem);
            }

            if (update.views) problem.views += update.views;
            if (update.solves) problem.solves += update.solves;
            problem.score = problem.views + (problem.solves * 2);

            upserts.push({
                slug: problem.slug,
                views: problem.views,
                solves: problem.solves,
                score: problem.score,
                last_interaction: new Date().toISOString()
            });
        });

        // Re-sort
        stats.hotProblems.sort((a, b) => b.score - a.score);

        // 2. Update L1 Memory
        this.memoryCache = stats;

        // 3. Update L2 Redis (CB Protected)
        await redisService.set(STATS_CACHE_KEY, stats);

        // 4. Update L3 File (Background)
        fileSyncService.syncStatsToFile(stats);

        // 5. Update L4 DB (Async/Background)
        (async () => {
            try {
                const { error } = await supabase.from('stats').upsert(upserts);
                if (error) console.error('Supabase stats upsert failed:', error.message);
            } catch (e) {
                console.error('Supabase stats upsert exception:', e);
            }
        })();

        return stats;
    }
}

export const statsRepository = new StatsRepository();
