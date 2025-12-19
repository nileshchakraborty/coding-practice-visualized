import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { Problem, Solution } from '../types';

interface ProblemsData {
    problems: Record<string, Problem>;
}

interface SolutionsData {
    solutions: Record<string, Solution>;
}

class ProblemRepository {
    private problemsCache: ProblemsData | null = null;
    private solutionsCache: SolutionsData | null = null;
    private lastLoadTime: number = 0;
    private readonly cacheTTL = 60000; // 1 minute cache

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
        if (this.problemsCache && !this.shouldRefreshCache()) {
            return this.problemsCache;
        }

        try {
            const data = fs.readFileSync(this.getProblemsPath(), 'utf-8');
            this.problemsCache = JSON.parse(data);
            this.lastLoadTime = Date.now();
            return this.problemsCache!;
        } catch (error) {
            console.error('Failed to load problems:', error);
            return { problems: {} };
        }
    }

    async loadSolutions(): Promise<SolutionsData> {
        if (this.solutionsCache && !this.shouldRefreshCache()) {
            return this.solutionsCache;
        }

        try {
            const data = fs.readFileSync(this.getSolutionsPath(), 'utf-8');
            this.solutionsCache = JSON.parse(data);
            this.lastLoadTime = Date.now();
            return this.solutionsCache!;
        } catch (error) {
            console.error('Failed to load solutions:', error);
            return { solutions: {} };
        }
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
