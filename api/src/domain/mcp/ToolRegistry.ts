export interface Tool {
    name: string;
    description: string;
    parameters: any;
    handler: (params: any) => Promise<any>;
}

export class ToolRegistry {
    private tools: Map<string, Tool> = new Map();

    register(tool: Tool) {
        this.tools.set(tool.name, tool);
    }

    get(name: string): Tool | undefined {
        return this.tools.get(name);
    }

    listTools(): string[] {
        return Array.from(this.tools.keys());
    }

    getSchemas(): any[] {
        return Array.from(this.tools.values()).map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters
        }));
    }

    async execute(name: string, params: any): Promise<any> {
        const tool = this.get(name);
        if (!tool) {
            return { error: `Tool '${name}' not found` };
        }
        try {
            return await tool.handler(params);
        } catch (e: any) {
            return { error: e.message };
        }
    }
}
