import fs from 'fs';
import path from 'path';
import { Problem, Solution } from '../../../domain/entities/Problem';
import { ProblemRepository } from '../../../domain/ports/ProblemRepository';

export class FileProblemRepository implements ProblemRepository {
    private _problemsFile: string | null = null;
    private _solutionsFile: string | null = null;

    private get problemsFile(): string {
        if (!this._problemsFile) {
            this._problemsFile = this.findFile('problems.json');
            console.log(`[FileProblemRepository] Resolved problems.json: ${this._problemsFile}`);
        }
        return this._problemsFile;
    }

    private get solutionsFile(): string {
        if (!this._solutionsFile) {
            this._solutionsFile = this.findFile('solutions.json');
            console.log(`[FileProblemRepository] Resolved solutions.json: ${this._solutionsFile}`);
        }
        return this._solutionsFile;
    }

    private findFile(filename: string): string {
        const candidates = [
            path.join(process.cwd(), 'api', 'data', filename),
            path.join(process.cwd(), 'data', filename),
            path.join(__dirname, '..', '..', '..', '..', 'api', 'data', filename),
            path.join(__dirname, 'data', filename),
            path.join('/var/task/api/data', filename),
            path.join('/var/task', filename)
        ];

        for (const p of candidates) {
            try {
                if (fs.existsSync(p)) {
                    console.log(`[FileProblemRepository] Found ${filename} at ${p}`);
                    return p;
                }
            } catch (e) {
                // Ignore errors during path checking
            }
        }

        console.error(`[FileProblemRepository] Could not find ${filename} in any candidate:`, candidates);
        return candidates[0]; // Return first candidate as default
    }

    async getAllProblems(): Promise<any> {
        try {
            if (!fs.existsSync(this.problemsFile)) {
                console.error(`[FileProblemRepository] problemsFile not found: ${this.problemsFile}`);
                return { categories: [] };
            }
            return JSON.parse(fs.readFileSync(this.problemsFile, 'utf-8'));
        } catch (e) {
            console.error(`[FileProblemRepository] Error reading problems:`, e);
            return { categories: [] };
        }
    }

    async getProblemBySlug(slug: string): Promise<Problem | null> {
        const data = await this.getAllProblems();
        if (!data.categories) return null;

        for (const category of data.categories) {
            const problem = category.problems.find((p: Problem) => p.slug === slug);
            if (problem) return problem;
        }
        return null;
    }

    async getSolution(slug: string): Promise<Solution | null> {
        try {
            if (!fs.existsSync(this.solutionsFile)) return null;
            const data = JSON.parse(fs.readFileSync(this.solutionsFile, 'utf-8'));
            return data.solutions?.[slug] || null;
        } catch (e) {
            console.error(`[FileProblemRepository] Error reading solution:`, e);
            return null;
        }
    }

    async saveSolution(slug: string, solution: Solution): Promise<void> {
        let data: { solutions: Record<string, Solution> } = { solutions: {} };
        if (fs.existsSync(this.solutionsFile)) {
            data = JSON.parse(fs.readFileSync(this.solutionsFile, 'utf-8'));
        }
        if (!data.solutions) data.solutions = {};

        data.solutions[slug] = solution;
        fs.writeFileSync(this.solutionsFile, JSON.stringify(data, null, 2));
    }
}
