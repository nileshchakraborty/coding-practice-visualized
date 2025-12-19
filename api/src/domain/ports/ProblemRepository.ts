import { Problem, Solution } from '../entities/Problem';

export interface ProblemRepository {
    getAllProblems(): Promise<Problem[]>;
    getProblemBySlug(slug: string): Promise<Problem | null>;
    getSolution(slug: string): Promise<Solution | null>;
}
