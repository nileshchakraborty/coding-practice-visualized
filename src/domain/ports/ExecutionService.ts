export interface ExecutionResult {
    success: boolean;
    passed?: boolean;
    results?: any[];
    logs?: string;
    error?: string;
    rawOutput?: string;
    stderr?: string;
}

export interface ExecutionService {
    execute(code: string, testCases: any[], language?: string): Promise<ExecutionResult>;
}
