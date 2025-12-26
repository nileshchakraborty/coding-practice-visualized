import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { Problem, Solution } from '../types';
import { redisService } from '../services/RedisService';
import { supabase } from './SupabaseClient';
import { fileSyncService } from '../services/FileSyncService';

interface ProblemsData {
    problems: Record<string, Problem>;
}

interface SolutionsData {
    solutions: Record<string, Solution>;
}

const PROBLEMS_CACHE_KEY = 'cache:problems';
const SOLUTIONS_CACHE_KEY = 'cache:solutions';

class ProblemRepository {
    private problemsCache: ProblemsData | null = null;
    private solutionsCache: SolutionsData | null = null;
    private lastLoadTime: number = 0;
    private readonly cacheTTL = 60000;

    private getProblemsPath(): string {
        return path.resolve(__dirname, '../../', config.problemsPath);
    }

    private getSolutionsPath(): string {
        return path.resolve(__dirname, '../../', config.solutionsPath);
    }

    private shouldRefreshCache(): boolean {
        return Date.now() - this.lastLoadTime > this.cacheTTL;
    }

    async loadProblems(): Promise<ProblemsData> {
        // L1: Memory
        if (this.problemsCache && !this.shouldRefreshCache()) {
            return this.problemsCache;
        }

        // L2: Redis (Circuit Breaker Protected)
        const cached = await redisService.get<ProblemsData>(PROBLEMS_CACHE_KEY);
        if (cached && !this.shouldRefreshCache()) {
            this.problemsCache = cached;
            return cached;
        }

        // L3: File System (Fallback/Offline)
        let localData: ProblemsData = { problems: {} };
        if (fs.existsSync(this.getProblemsPath())) {
            try {
                const raw = fs.readFileSync(this.getProblemsPath(), 'utf-8');
                localData = JSON.parse(raw);
            } catch (e) {
                console.error('Failed to parse local problems');
            }
        }

        // L4: Supabase (Source of Truth)
        try {
            const { data: rows, error } = await supabase.from('problems').select('*');
            if (!error && rows && rows.length > 0) {
                const problemsMap: Record<string, Problem> = {};
                rows.forEach(row => {
                    if (row.data) {
                        problemsMap[row.slug] = { ...row.data, slug: row.slug };
                    } else {
                        problemsMap[row.slug] = {
                            title: row.title,
                            difficulty: row.difficulty as any,
                            category: row.category,
                            slug: row.slug
                        } as any;
                    }
                });

                const result = { problems: problemsMap };
                this.problemsCache = result;
                this.lastLoadTime = Date.now();

                await redisService.set(PROBLEMS_CACHE_KEY, result, 300);

                return result;
            } else if (error) {
                // DB Error -> Use fallback
                // console.warn('Supabase problems fetch error:', error.message);
                return localData;
            }
        } catch (dbError) {
            console.warn('DB fetch problems failed (Network/CB), using local');
            return localData;
        }

        this.problemsCache = localData;
        return localData;
    }

    async loadSolutions(): Promise<SolutionsData> {
        // L1
        if (this.solutionsCache && !this.shouldRefreshCache()) {
            return this.solutionsCache;
        }

        // L2
        const cached = await redisService.get<SolutionsData>(SOLUTIONS_CACHE_KEY);
        if (cached && !this.shouldRefreshCache()) {
            this.solutionsCache = cached;
            return cached;
        }

        // L3
        let localData: SolutionsData = { solutions: {} };
        if (fs.existsSync(this.getSolutionsPath())) {
            try {
                const raw = fs.readFileSync(this.getSolutionsPath(), 'utf-8');
                localData = JSON.parse(raw);
            } catch (e) { console.error('Failed parse solutions local'); }
        }

        // L4
        try {
            const { data: rows, error } = await supabase.from('solutions').select('*');
            if (!error && rows && rows.length > 0) {
                const solutionsMap: Record<string, Solution> = {};
                rows.forEach(row => {
                    if (row.data) {
                        solutionsMap[row.slug] = row.data;
                    } else {
                        solutionsMap[row.slug] = {
                            slug: row.slug,
                            code: row.code,
                            language: row.language,
                            // ...
                        } as any;
                    }
                });

                const result = { solutions: solutionsMap };
                this.solutionsCache = result;
                this.lastLoadTime = Date.now();
                await redisService.set(SOLUTIONS_CACHE_KEY, result, 300);
                return result;
            }
        } catch (e) {
            console.warn('DB fetch solutions failed, using local');
        }

        this.solutionsCache = localData;
        return localData;
    }

    async getAllProblems(): Promise<Problem[]> {
        const data = await this.loadProblems();
        return Object.entries(data.problems).map(([slug, problem]) => ({
            ...problem,
            slug
        }));
    }

    async getProblemBySlug(slug: string): Promise<Problem | null> {
        const data = await this.loadProblems();
        const problem = data.problems[slug];
        return problem ? { ...problem, slug } : null;
    }

    async getSolutionBySlug(slug: string): Promise<Solution | null> {
        const data = await this.loadSolutions();
        return data.solutions[slug] || null;
    }

    async getProblemWithSolution(slug: string): Promise<{ problem: Problem; solution: Solution } | null> {
        const problem = await this.getProblemBySlug(slug);
        const solution = await this.getSolutionBySlug(slug);

        if (!problem || !solution) {
            return null;
        }

        return { problem, solution };
    }

    async searchProblems(query: string): Promise<Problem[]> {
        const problems = await this.getAllProblems();
        const lowerQuery = query.toLowerCase();

        return problems.filter(p =>
            p.title.toLowerCase().includes(lowerQuery) ||
            p.description?.toLowerCase().includes(lowerQuery) ||
            p.topics?.some(t => t.toLowerCase().includes(lowerQuery))
        );
    }

    async getProblemsByCategory(category: string): Promise<Problem[]> {
        const problems = await this.getAllProblems();
        return problems.filter(p => p.category === category);
    }

    async getProblemsByDifficulty(difficulty: string): Promise<Problem[]> {
        const problems = await this.getAllProblems();
        return problems.filter(p => p.difficulty === difficulty);
    }
}

export const problemRepository = new ProblemRepository();
