import { ProblemRepository } from '../domain/ports/ProblemRepository';
import { AIService } from '../domain/ports/AIService';
import { ExecutionService } from '../domain/ports/ExecutionService';
import { ToolRegistry } from '../domain/mcp/ToolRegistry';

export class ProblemService {
    constructor(
        private problemRepo: ProblemRepository,
        private aiService: AIService,
        private executionService: ExecutionService,
        private toolRegistry: ToolRegistry
    ) { }

    async getAllProblems() {
        return this.problemRepo.getAllProblems();
    }

    async getSolution(slug: string) {
        return this.problemRepo.getSolution(slug);
    }

    async executeCode(code: string, testCases: any[], language?: string) {
        // Can be routed via ToolRegistry or direct. Direct for now as it's a primary usecase.
        return this.executionService.execute(code, testCases, language);
    }

    async getAIHint(problem: string, code: string) {
        return this.aiService.generateHint(problem, code);
    }

    async getAIExplanation(code: string, title: string) {
        return this.aiService.explainSolution(code, title);
    }

    async chatWithTutor(slug: string, history: any[], message: string, code?: string) {
        // 1. Get Problem Context
        const problem = await this.problemRepo.getProblemBySlug(slug);
        const title = problem ? problem.title : "Unknown Problem";
        const desc = `LeetCode problem ${title}`;

        // 2. Pass to AI
        return this.aiService.answerQuestion(title, desc, history, message);
    }
    async generateSolution(slug: string) {
        const problem = await this.problemRepo.getProblemBySlug(slug);
        if (!problem) throw new Error("Problem not found");

        const aiResult = await this.aiService.generateSolution(problem.title, problem.description);

        if (aiResult.error) throw new Error(aiResult.error);

        // Map AI result to Solution entity
        const solution: any = {
            slug,
            title: problem.title,
            code: aiResult.code,
            testCases: [], // AI doesn't generate test cases yet, maybe keep empty or ask AI? 
            hints: [],
            generated: true,
            timeComplexity: aiResult.timeComplexity,
            spaceComplexity: aiResult.spaceComplexity,
            explanation: aiResult.explanation
        };

        await this.problemRepo.saveSolution(slug, solution);
        return { success: true, solution };
    }
}
