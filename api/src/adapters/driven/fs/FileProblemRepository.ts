import fs from 'fs';
import path from 'path';
import { Problem, Solution } from '../../../domain/entities/Problem';
import { ProblemRepository } from '../../../domain/ports/ProblemRepository';

export class FileProblemRepository implements ProblemRepository {
    private problemsFile: string;
    private solutionsFile: string;

    constructor() {
        const DATA_DIR = path.join(process.cwd(), 'api', 'data');
        // Note: process.cwd() is used because we run from root in dev. 
        // In prod Vercel, this might need adjust, but we follow previous findings.
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
}
