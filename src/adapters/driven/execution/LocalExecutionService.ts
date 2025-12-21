import { spawn } from 'child_process';
import path from 'path';
import { ExecutionResult, ExecutionService } from '../../../domain/ports/ExecutionService';

import fs from 'fs';

import { JavascriptRunner } from './runners/JavascriptRunner';
import { PythonRunner } from './runners/PythonRunner';
import { JavaRunner } from './runners/JavaRunner';
import { GoRunner } from './runners/GoRunner';
import { RustRunner } from './runners/RustRunner';
import { CppRunner } from './runners/CppRunner';

export class LocalExecutionService implements ExecutionService {
    private runners: Record<string, any> = {
        'python': new PythonRunner(),
        'javascript': new JavascriptRunner(),
        'typescript': new JavascriptRunner(), // Reuse JS runner for now
        'java': new JavaRunner(),
        'go': new GoRunner(),
        'golang': new GoRunner(),
        'rust': new RustRunner(),
        'rs': new RustRunner(),
        'cpp': new CppRunner(),
        'c++': new CppRunner(),
        'c': new CppRunner(), // For now treat C as C++ (g++ compiles c fine mostly)
    };

    async execute(code: string, testCases: any[], language: string = 'python'): Promise<ExecutionResult> {
        const runner = this.runners[language.toLowerCase()];
        if (!runner) {
            return {
                success: false,
                error: `Language '${language}' not supported yet. Supported: ${Object.keys(this.runners).join(', ')}`
            };
        }
        return runner.execute(code, testCases);
    }
}
