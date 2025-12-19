import { ToolRegistry } from '../../../domain/mcp/ToolRegistry';
import { ExecutionService } from '../../../domain/ports/ExecutionService';
import { ProblemRepository } from '../../../domain/ports/ProblemRepository';

export class MCPTools {
    constructor(
        private registry: ToolRegistry,
        private executionService: ExecutionService,
        private problemRepo: ProblemRepository
    ) {
        this.registerTools();
    }

    private registerTools() {
        // Tool: run_code
        this.registry.register({
            name: "run_code",
            description: "Execute Python code against test cases",
            parameters: {
                type: "object",
                properties: {
                    code: { type: "string", description: "Python code" },
                    testCases: { type: "array", description: "Test cases" }
                },
                required: ["code", "testCases"]
            },
            handler: async (params: any) => {
                return await this.executionService.execute(params.code, params.testCases);
            }
        });

        // Tool: get_hint
        this.registry.register({
            name: "get_hint",
            description: "Get hints for a problem",
            parameters: {
                type: "object",
                properties: { slug: { type: "string" } },
                required: ["slug"]
            },
            handler: async (params: any) => {
                const solution = await this.problemRepo.getSolution(params.slug);
                if (!solution || !solution.hints) return { error: "No hints found" };
                return { hints: solution.hints };
            }
        });
    }
}
