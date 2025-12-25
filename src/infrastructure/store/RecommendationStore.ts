/**
 * RecommendationStore - Aggregate stats for hot topics/problems
 * 
 * Tracks view counts and solve counts across all users to power
 * the "Hot Right Now" recommendation engine.
 * 
 * PERSISTENCE: Data is saved to api/data/recommendation_stats.json
 * to survive server restarts.
 */
import fs from 'fs';
import path from 'path';

interface ProblemStats {
    slug: string;
    viewCount: number;
    solveCount: number;
    lastViewed: number;
    lastSolved: number;
}

interface CategoryStats {
    category: string;
    totalViews: number;
    totalSolves: number;
    problemSlugs: string[];  // Array for JSON serialization
}

interface PersistedData {
    problems: Record<string, ProblemStats>;
    categories: Record<string, CategoryStats>;
    lastUpdated: number;
}

class RecommendationStoreService {
    private problemStats: Map<string, ProblemStats> = new Map();
    private categoryStats: Map<string, CategoryStats> = new Map();
    private dataPath: string;
    private saveTimeout: NodeJS.Timeout | null = null;

    // Decay factor for time-weighted scoring (older interactions worth less)
    private readonly DECAY_HOURS = 24 * 7; // 1 week half-life
    // Debounce saves by 5 seconds to batch rapid updates
    private readonly SAVE_DEBOUNCE_MS = 5000;

    constructor() {
        // Find data directory - works for both local dev and Vercel
        const possiblePaths = [
            path.join(process.cwd(), 'api', 'data', 'recommendation_stats.json'),
            path.join(__dirname, '..', '..', '..', 'api', 'data', 'recommendation_stats.json'),
            '/var/task/api/data/recommendation_stats.json',  // Vercel serverless
        ];

        this.dataPath = possiblePaths[0];  // Default to first option

        // Try to find existing data or writable path
        for (const p of possiblePaths) {
            const dir = path.dirname(p);
            if (fs.existsSync(dir)) {
                this.dataPath = p;
                break;
            }
        }

        console.log('[RecommendationStore] Data path:', this.dataPath);
        this.load();
    }

    /**
     * Load persisted data from disk
     */
    private load(): void {
        try {
            if (fs.existsSync(this.dataPath)) {
                const raw = fs.readFileSync(this.dataPath, 'utf8');
                const data: PersistedData = JSON.parse(raw);

                // Restore problem stats
                for (const [slug, stats] of Object.entries(data.problems)) {
                    this.problemStats.set(slug, stats);
                }

                // Restore category stats (convert arrays back to Sets internally)
                for (const [category, stats] of Object.entries(data.categories)) {
                    this.categoryStats.set(category, {
                        ...stats,
                        problemSlugs: stats.problemSlugs,  // Keep as array for serialization
                    });
                }

                console.log(`[RecommendationStore] Loaded ${this.problemStats.size} problems, ${this.categoryStats.size} categories`);
            } else {
                console.log('[RecommendationStore] No existing data, seeding with demo data');
                this.seedDemoData();
                this.saveNow();
            }
        } catch (error) {
            console.error('[RecommendationStore] Error loading data:', error);
            this.seedDemoData();
        }
    }

    /**
     * Save data to disk (debounced)
     */
    private save(): void {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.saveTimeout = setTimeout(() => {
            this.saveNow();
        }, this.SAVE_DEBOUNCE_MS);
    }

    /**
     * Immediately save data to disk
     */
    private saveNow(): void {
        try {
            const data: PersistedData = {
                problems: Object.fromEntries(this.problemStats),
                categories: Object.fromEntries(
                    Array.from(this.categoryStats.entries()).map(([key, val]) => [
                        key,
                        { ...val, problemSlugs: Array.from(val.problemSlugs) }
                    ])
                ),
                lastUpdated: Date.now(),
            };

            const dir = path.dirname(this.dataPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
            console.log('[RecommendationStore] Saved data to disk');
        } catch (error) {
            console.error('[RecommendationStore] Error saving data:', error);
        }
    }

    /**
     * Record a view of a problem's solution
     */
    recordView(slug: string, category?: string): void {
        const now = Date.now();

        // Update problem stats
        const existing = this.problemStats.get(slug) || {
            slug,
            viewCount: 0,
            solveCount: 0,
            lastViewed: 0,
            lastSolved: 0,
        };

        this.problemStats.set(slug, {
            ...existing,
            viewCount: existing.viewCount + 1,
            lastViewed: now,
        });

        // Update category stats if provided
        if (category) {
            const catStats = this.categoryStats.get(category) || {
                category,
                totalViews: 0,
                totalSolves: 0,
                problemSlugs: [],
            };

            catStats.totalViews++;
            if (!catStats.problemSlugs.includes(slug)) {
                catStats.problemSlugs.push(slug);
            }
            this.categoryStats.set(category, catStats);
        }

        // Persist changes
        this.save();
    }

    /**
     * Record a solve of a problem
     */
    recordSolve(slug: string, category?: string): void {
        const now = Date.now();

        const existing = this.problemStats.get(slug) || {
            slug,
            viewCount: 0,
            solveCount: 0,
            lastViewed: 0,
            lastSolved: 0,
        };

        this.problemStats.set(slug, {
            ...existing,
            solveCount: existing.solveCount + 1,
            lastSolved: now,
        });

        if (category) {
            const catStats = this.categoryStats.get(category) || {
                category,
                totalViews: 0,
                totalSolves: 0,
                problemSlugs: [],
            };

            catStats.totalSolves++;
            if (!catStats.problemSlugs.includes(slug)) {
                catStats.problemSlugs.push(slug);
            }
            this.categoryStats.set(category, catStats);
        }

        // Persist changes
        this.save();
    }

    /**
     * Calculate hot score combining views and solves
     * Higher weight on recent activity
     */
    private calculateHotScore(stats: ProblemStats): number {
        const now = Date.now();
        const hourMs = 1000 * 60 * 60;

        // Time decay for views
        const viewAge = (now - stats.lastViewed) / hourMs;
        const viewDecay = Math.exp(-viewAge / this.DECAY_HOURS);

        // Time decay for solves
        const solveAge = (now - stats.lastSolved) / hourMs;
        const solveDecay = Math.exp(-solveAge / this.DECAY_HOURS);

        // Weighted score: solves worth more than views
        return (stats.viewCount * viewDecay * 1) + (stats.solveCount * solveDecay * 2);
    }

    /**
     * Get top K hot problems
     */
    getHotProblems(k: number = 10): Array<{ slug: string; score: number; views: number; solves: number }> {
        const scored = Array.from(this.problemStats.values())
            .map(stats => ({
                slug: stats.slug,
                score: this.calculateHotScore(stats),
                views: stats.viewCount,
                solves: stats.solveCount,
            }))
            .filter(p => p.score > 0);

        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, k);
    }

    /**
     * Get top K hot categories/topics
     */
    getHotTopics(k: number = 5): Array<{ category: string; engagement: number; problemCount: number }> {
        return Array.from(this.categoryStats.values())
            .map(stats => ({
                category: stats.category,
                engagement: stats.totalViews + (stats.totalSolves * 2),
                problemCount: stats.problemSlugs.length,
            }))
            .sort((a, b) => b.engagement - a.engagement)
            .slice(0, k);
    }

    /**
     * Get all stats (for debugging)
     */
    getStats(): { problems: number; categories: number } {
        return {
            problems: this.problemStats.size,
            categories: this.categoryStats.size,
        };
    }

    /**
     * Seed with some initial data (for demo purposes)
     */
    seedDemoData(): void {
        const popularProblems = [
            { slug: 'two-sum', category: 'Array / String', views: 150, solves: 45 },
            { slug: 'valid-parentheses', category: 'Stack', views: 120, solves: 38 },
            { slug: 'merge-two-sorted-lists', category: 'Linked List', views: 95, solves: 30 },
            { slug: 'binary-search', category: 'Binary Search', views: 88, solves: 35 },
            { slug: 'maximum-depth-of-binary-tree', category: 'Binary Tree General', views: 75, solves: 28 },
            { slug: 'climbing-stairs', category: '1D DP', views: 110, solves: 42 },
            { slug: 'number-of-islands', category: 'Graph General', views: 85, solves: 25 },
            { slug: 'coin-change', category: '1D DP', views: 70, solves: 20 },
            { slug: 'longest-substring-without-repeating-characters', category: 'Sliding Window', views: 92, solves: 32 },
            { slug: 'container-with-most-water', category: 'Two Pointers', views: 68, solves: 22 },
        ];

        const now = Date.now();

        for (const p of popularProblems) {
            this.problemStats.set(p.slug, {
                slug: p.slug,
                viewCount: p.views,
                solveCount: p.solves,
                lastViewed: now - Math.random() * 1000 * 60 * 60 * 24, // Random time in last 24h
                lastSolved: now - Math.random() * 1000 * 60 * 60 * 48, // Random time in last 48h
            });

            const catStats = this.categoryStats.get(p.category) || {
                category: p.category,
                totalViews: 0,
                totalSolves: 0,
                problemSlugs: [],
            };

            catStats.totalViews += p.views;
            catStats.totalSolves += p.solves;
            if (!catStats.problemSlugs.includes(p.slug)) {
                catStats.problemSlugs.push(p.slug);
            }
            this.categoryStats.set(p.category, catStats);
        }
    }
}

export const recommendationStore = new RecommendationStoreService();
