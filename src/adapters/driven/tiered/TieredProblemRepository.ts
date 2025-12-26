import { Problem, Solution } from '../../../domain/entities/Problem';
import { ProblemRepository } from '../../../domain/ports/ProblemRepository';
import { FileProblemRepository } from '../fs/FileProblemRepository';
import { redisService } from '../../../infrastructure/cache/RedisService';
import { supabase } from '../../../infrastructure/db/SupabaseClient';

const PROBLEMS_CACHE_KEY = 'cache:problems:v4'; // v4 for file-first priority fix
const SOLUTIONS_CACHE_PREFIX = 'cache:solutions:';
const CACHE_TTL = 3600; // 1 hour

export class TieredProblemRepository implements ProblemRepository {
    private fileRepo: FileProblemRepository;
    private memoryCache: any = null;
    private lastCacheTime: number = 0;

    constructor() {
        this.fileRepo = new FileProblemRepository();
    }

    /**
     * Invalidate all problems caches (memory + Redis).
     * Forces next getAllProblems() call to reload from file.
     */
    async invalidateCache(): Promise<{ success: boolean; message: string }> {
        try {
            // Clear memory cache
            this.memoryCache = null;
            this.lastCacheTime = 0;

            // Clear Redis cache
            await redisService.del(PROBLEMS_CACHE_KEY);

            console.log('[TieredRepo] Cache invalidated successfully');
            return { success: true, message: 'Problems cache invalidated successfully' };
        } catch (e) {
            console.error('[TieredRepo] Failed to invalidate cache:', e);
            return { success: false, message: 'Failed to invalidate cache' };
        }
    }

    async getAllProblems(): Promise<any> {
        // L1: Memory
        if (this.memoryCache && (Date.now() - this.lastCacheTime < CACHE_TTL * 1000)) {
            return this.memoryCache;
        }

        // L2: Redis
        const cached = await redisService.get<any>(PROBLEMS_CACHE_KEY);
        if (cached) {
            this.memoryCache = cached;
            this.lastCacheTime = Date.now();
            return cached;
        }

        // PRIORITY: File System (Source of Truth for hierarchical category structure)
        // The problems.json file maintains the correct category hierarchy with parent
        // categories containing problems organized by learning flow order.
        // Supabase may have flattened categories from normalization, so we use file first.
        try {
            const fileData = await this.fileRepo.getAllProblems();
            if (fileData && fileData.categories && fileData.categories.length > 0) {
                console.log('[TieredRepo] Using File System for correct category hierarchy');

                // Update Caches with file data
                this.memoryCache = fileData;
                this.lastCacheTime = Date.now();
                await redisService.set(PROBLEMS_CACHE_KEY, fileData, CACHE_TTL);

                return fileData;
            }
        } catch (e) {
            console.warn('[TieredRepo] File System fetch failed, trying Supabase');
        }

        // FALLBACK: Supabase (if file not available)
        try {
            const { data: rows, error } = await supabase.from('problems').select('*');

            if (!error && rows && rows.length > 0) {
                // Reconstruct categories structure
                const categoriesMap: Record<string, Problem[]> = {};

                rows.forEach(row => {
                    const cat = row.category || 'General';
                    if (!categoriesMap[cat]) categoriesMap[cat] = [];

                    // Use stored data blob if available, else construct from fields
                    const problem = row.data || {
                        slug: row.slug,
                        title: row.title,
                        difficulty: row.difficulty,
                        category: cat
                    };
                    categoriesMap[cat].push(problem);
                });

                const ICONS: Record<string, string> = {
                    'Array / String': '📝',
                    'Two Pointers': '👆',
                    'Sliding Window': '🪟',
                    'Matrix': '🔢',
                    'Hashmap': '🗂️',
                    'Intervals': '⏰',
                    'Stack': '📚',
                    'Linked List': '🔗',
                    'Binary Tree General': '🌳',
                    'Binary Tree BFS': '🌊',
                    'Binary Search Tree': '🔍',
                    'Graph General': '🕸️',
                    'Graph BFS': '📡',
                    'Trie': '🌲',
                    'Backtracking': '🔙',
                    'Divide & Conquer': '➗',
                    'Kadane\'s Algorithm': '📈',
                    'Binary Search': '🔎',
                    'Heap / Priority Queue': '🏔️',
                    'Bit Manipulation': '0️⃣',
                    'Math': '🧮',
                    '1D DP': '📝',
                    'Multidimensional DP': '📊'
                };

                const result = {
                    categories: Object.entries(categoriesMap).map(([category, problems]) => ({
                        name: category, // Frontend expects 'name', not 'category'
                        icon: ICONS[category] || '📝',
                        problems
                    }))
                };

                // Update Caches
                this.memoryCache = result;
                this.lastCacheTime = Date.now();
                await redisService.set(PROBLEMS_CACHE_KEY, result, CACHE_TTL);

                return result;
            }
        } catch (e) {
            console.warn('[TieredRepo] Supabase fetch failed');
        }

        // Final fallback: empty categories
        console.error('[TieredRepo] No data source available for problems');
        return { categories: [] };
    }

    async getProblemBySlug(slug: string): Promise<Problem | null> {
        // Use getAllProblems (cached) to find slug, as Supabase single fetch might not match nested structure needs efficiently
        // OR fetch directly from Supabase for freshness if needed, but sticking to cache-first for speed
        const data = await this.getAllProblems();
        if (!data.categories) return null;

        for (const cat of data.categories) {
            const p = cat.problems.find((x: Problem) => x.slug === slug);
            if (p) return p;
        }
        return null;
    }

    async getSolution(slug: string): Promise<Solution | null> {
        const cacheKey = SOLUTIONS_CACHE_PREFIX + slug;

        // L2: Redis
        const cached = await redisService.get<Solution>(cacheKey);
        if (cached) return cached;

        // L4: Supabase
        try {
            const { data, error } = await supabase
                .from('solutions')
                .select('*')
                .eq('slug', slug)
                .single();

            if (!error && data) {
                const solution = data.data || {
                    slug: data.slug,
                    code: data.code,
                    language: data.language
                };
                await redisService.set(cacheKey, solution, CACHE_TTL);
                return solution;
            }
        } catch (e) {
            // ignore
        }

        // L3: File Fallback
        console.warn(`[TieredRepo] Falling back to File System for Solution: ${slug}`);
        return this.fileRepo.getSolution(slug);
    }

    async saveSolution(slug: string, solution: Solution): Promise<void> {
        // Update L1/L2
        const cacheKey = SOLUTIONS_CACHE_PREFIX + slug;
        await redisService.set(cacheKey, solution, CACHE_TTL);

        // Update L4: Supabase
        const row = {
            slug,
            code: solution.code,
            language: solution.language || 'python',
            data: solution
        };
        const { error } = await supabase.from('solutions').upsert(row);
        if (error) console.error('Failed to save to Supabase:', error);

        // Update L3: File (Async)
        this.fileRepo.saveSolution(slug, solution).catch(e => console.error('File save failed', e));
    }
}
