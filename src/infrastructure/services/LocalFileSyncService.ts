/**
 * LocalFileSyncService - Manages local JSON files as source of truth
 * Critical: These files are the ultimate fallback when all databases/cache fail
 * 
 * Files managed:
 * - data/solutions.json - Problem data
 * - data/categories.json - Category ordering
 */
import fs from 'fs';
import path from 'path';
import type { ProblemData } from '../database/MongoDBService';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface SolutionsFile {
    solutions: Record<string, ProblemData>;
    version: string;
    lastUpdated: string;
}

export interface Category {
    name: string;
    slug: string;
    emoji: string;
    description?: string;
    problems?: string[];
}

export interface CategoriesFile {
    categories: Category[];
    version: string;
    lastUpdated: string;
}

// ============================================
// LOCAL FILE SYNC SERVICE
// ============================================

class LocalFileSyncService {
    private readonly dataDir: string;
    private readonly solutionsPath: string;
    private readonly categoriesPath: string;
    private solutionsCache: SolutionsFile | null = null;
    private categoriesCache: CategoriesFile | null = null;

    constructor() {
        // Determine data directory based on environment
        const possiblePaths = [
            path.join(process.cwd(), 'data'),
            path.join(process.cwd(), 'api', 'data'),
            path.join(__dirname, '..', '..', '..', 'data'),
        ];

        this.dataDir = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];
        this.solutionsPath = path.join(this.dataDir, 'solutions.json');
        this.categoriesPath = path.join(this.dataDir, 'categories.json');

        console.log(`[LocalFileSync] Data directory: ${this.dataDir}`);
    }

    // ============================================
    // SOLUTIONS FILE OPERATIONS
    // ============================================

    /**
     * Read solutions file (with caching)
     */
    readSolutions(): SolutionsFile {
        if (this.solutionsCache) {
            return this.solutionsCache;
        }

        try {
            const content = fs.readFileSync(this.solutionsPath, 'utf-8');
            const data = JSON.parse(content);

            // Handle legacy format (no version/lastUpdated)
            if (!data.version) {
                this.solutionsCache = {
                    solutions: data.solutions || data,
                    version: '1.0',
                    lastUpdated: new Date().toISOString(),
                };
            } else {
                this.solutionsCache = data;
            }

            return this.solutionsCache!;
        } catch (error) {
            console.error('[LocalFileSync] Failed to read solutions:', error);
            return { solutions: {}, version: '1.0', lastUpdated: new Date().toISOString() };
        }
    }

    /**
     * Write solutions file (atomic write with backup)
     */
    writeSolutions(data: SolutionsFile): void {
        try {
            // Create backup before writing
            if (fs.existsSync(this.solutionsPath)) {
                const backupPath = `${this.solutionsPath}.backup`;
                fs.copyFileSync(this.solutionsPath, backupPath);
            }

            // Update metadata
            data.lastUpdated = new Date().toISOString();

            // Atomic write: write to temp file then rename
            const tempPath = `${this.solutionsPath}.tmp`;
            fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
            fs.renameSync(tempPath, this.solutionsPath);

            // Update cache
            this.solutionsCache = data;

            console.log(`[LocalFileSync] Solutions file updated: ${Object.keys(data.solutions).length} problems`);
        } catch (error) {
            console.error('[LocalFileSync] Failed to write solutions:', error);
            throw error;
        }
    }

    /**
     * Get a single problem by slug
     */
    getProblem(slug: string): ProblemData | null {
        const data = this.readSolutions();
        return data.solutions[slug] || null;
    }

    /**
     * Get all problems
     */
    getAllProblems(): Record<string, ProblemData> {
        return this.readSolutions().solutions;
    }

    /**
     * Create or update a problem
     */
    upsertProblem(slug: string, problem: ProblemData): void {
        const data = this.readSolutions();

        // Add metadata
        const now = new Date().toISOString();
        if (!data.solutions[slug]) {
            problem.createdAt = now;
        }
        problem.updatedAt = now;
        problem.slug = slug;

        data.solutions[slug] = problem;
        this.writeSolutions(data);
    }

    /**
     * Delete a problem
     */
    deleteProblem(slug: string): ProblemData | null {
        const data = this.readSolutions();
        const existing = data.solutions[slug];

        if (existing) {
            delete data.solutions[slug];
            this.writeSolutions(data);
        }

        return existing || null;
    }

    // ============================================
    // CATEGORIES FILE OPERATIONS
    // ============================================

    /**
     * Read categories file (with caching)
     */
    readCategories(): CategoriesFile {
        if (this.categoriesCache) {
            return this.categoriesCache;
        }

        try {
            if (!fs.existsSync(this.categoriesPath)) {
                return { categories: [], version: '1.0', lastUpdated: new Date().toISOString() };
            }

            const content = fs.readFileSync(this.categoriesPath, 'utf-8');
            const data = JSON.parse(content);

            if (!data.version) {
                this.categoriesCache = {
                    categories: data.categories || data,
                    version: '1.0',
                    lastUpdated: new Date().toISOString(),
                };
            } else {
                this.categoriesCache = data;
            }

            return this.categoriesCache!;
        } catch (error) {
            console.error('[LocalFileSync] Failed to read categories:', error);
            return { categories: [], version: '1.0', lastUpdated: new Date().toISOString() };
        }
    }

    /**
     * Write categories file
     */
    writeCategories(data: CategoriesFile): void {
        try {
            if (fs.existsSync(this.categoriesPath)) {
                const backupPath = `${this.categoriesPath}.backup`;
                fs.copyFileSync(this.categoriesPath, backupPath);
            }

            data.lastUpdated = new Date().toISOString();

            const tempPath = `${this.categoriesPath}.tmp`;
            fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
            fs.renameSync(tempPath, this.categoriesPath);

            this.categoriesCache = data;
            console.log(`[LocalFileSync] Categories file updated: ${data.categories.length} categories`);
        } catch (error) {
            console.error('[LocalFileSync] Failed to write categories:', error);
            throw error;
        }
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Clear all caches (useful for testing or forced refresh)
     */
    clearCache(): void {
        this.solutionsCache = null;
        this.categoriesCache = null;
    }

    /**
     * Check if data files exist
     */
    filesExist(): { solutions: boolean; categories: boolean } {
        return {
            solutions: fs.existsSync(this.solutionsPath),
            categories: fs.existsSync(this.categoriesPath),
        };
    }

    /**
     * Get file stats
     */
    getStats(): { solutions: number; categories: number } {
        const solutions = this.readSolutions();
        const categories = this.readCategories();
        return {
            solutions: Object.keys(solutions.solutions).length,
            categories: categories.categories.length,
        };
    }

    /**
     * Restore from backup
     */
    restoreFromBackup(file: 'solutions' | 'categories'): boolean {
        const targetPath = file === 'solutions' ? this.solutionsPath : this.categoriesPath;
        const backupPath = `${targetPath}.backup`;

        if (fs.existsSync(backupPath)) {
            fs.copyFileSync(backupPath, targetPath);
            this.clearCache();
            console.log(`[LocalFileSync] Restored ${file} from backup`);
            return true;
        }

        return false;
    }
}

// Export singleton instance
export const localFileSyncService = new LocalFileSyncService();
export default localFileSyncService;
