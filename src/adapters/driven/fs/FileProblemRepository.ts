import fs from 'fs';
import path from 'path';
import { Problem, Solution } from '../../../domain/entities/Problem';
import { ProblemRepository } from '../../../domain/ports/ProblemRepository';

export class FileProblemRepository implements ProblemRepository {
    private problemsFile: string;
    private solutionsFile: string;

    constructor() {
        // Try to find data relative to current file first (prod), then fallback to root (dev)
        const prodPath = path.join(__dirname, '..', '..', '..', '..', 'api', 'data');
        const devPath = path.join(process.cwd(), 'api', 'data');

        const DATA_DIR = fs.existsSync(prodPath) ? prodPath : devPath;
        console.log(`FileProblemRepository initialized with DATA_DIR: ${DATA_DIR}`);

        this.problemsFile = path.join(DATA_DIR, 'problems.json');
        this.solutionsFile = path.join(DATA_DIR, 'solutions.json');
    }

    async getAllProblems(): Promise<Problem[]> {
        if (!fs.existsSync(this.problemsFile)) return [];
        return JSON.parse(fs.readFileSync(this.problemsFile, 'utf-8'));
    }

    async getProblemBySlug(slug: string): Promise<Problem | null> {
        const problems = await this.getAllProblems();
        return problems.find(p => p.slug === slug) || null;
    }

    async getSolution(slug: string): Promise<Solution | null> {
        if (!fs.existsSync(this.solutionsFile)) return null;
        const solutions = JSON.parse(fs.readFileSync(this.solutionsFile, 'utf-8'));
        return solutions[slug] || null;
    }

    async saveSolution(slug: string, solution: Solution): Promise<void> {
        let solutions: Record<string, Solution> = {};
        if (fs.existsSync(this.solutionsFile)) {
            solutions = JSON.parse(fs.readFileSync(this.solutionsFile, 'utf-8'));
        }
        solutions[slug] = solution;
        fs.writeFileSync(this.solutionsFile, JSON.stringify(solutions, null, 2));
    }
}
