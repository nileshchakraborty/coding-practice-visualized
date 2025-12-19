import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ExecutionResult, TestCase } from '../types';

class ExecutionService {
    private runnerPath: string;

    constructor() {
        // Path to the Python runner script
        this.runnerPath = path.resolve(__dirname, '../../../runner.py');
    }

    async executeCode(code: string, testCases: TestCase[]): Promise<ExecutionResult> {
        return new Promise((resolve) => {
            try {
                // Create temporary file for code execution
                const tempDir = os.tmpdir();
                const tempFile = path.join(tempDir, `leetcode_${Date.now()}.py`);

                // Build the full script with test runner
                const fullScript = this.buildScript(code, testCases);
                fs.writeFileSync(tempFile, fullScript);

                // Execute Python script
                const python = spawn('python3', [tempFile], {
                    timeout: 10000, // 10 second timeout
                    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' }
                });

                let stdout = '';
                let stderr = '';

                python.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                python.stderr.on('data', (data) => {
                    stderr += data.toString();
                });

                python.on('close', (code) => {
                    // Cleanup temp file
                    try {
                        fs.unlinkSync(tempFile);
                    } catch (e) {
                        // Ignore cleanup errors
                    }

                    if (code !== 0 && !stdout) {
                        resolve({
                            success: false,
                            error: stderr || `Process exited with code ${code}`
                        });
                        return;
                    }

                    try {
                        // Parse JSON output from runner
                        const result = JSON.parse(stdout.trim());
                        resolve({
                            success: true,
                            passed: result.passed,
                            results: result.results,
                            logs: stderr || ''
                        });
                    } catch (parseError) {
                        resolve({
                            success: false,
                            error: `Failed to parse output: ${stdout}`,
                            logs: stderr
                        });
                    }
                });

                python.on('error', (err) => {
                    resolve({
                        success: false,
                        error: `Failed to start Python: ${err.message}`
                    });
                });

            } catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }

    private buildScript(code: string, testCases: TestCase[]): string {
        // Build inline test runner (simplified version)
        const testCasesJson = JSON.stringify(testCases);

        return `
import json
import sys
import re
import ast

# User code
${code}

# Test runner
def run_tests():
    test_cases = ${testCasesJson}
    results = []
    all_passed = True
    
    # Find the solution function
    solution_func = None
    for name, obj in list(globals().items()):
        if callable(obj) and not name.startswith('_') and name not in ['run_tests', 'json', 'sys', 're', 'ast']:
            solution_func = obj
            break
    
    if not solution_func:
        print(json.dumps({"passed": False, "error": "No solution function found"}))
        return
    
    for i, test in enumerate(test_cases):
        try:
            # Parse input
            local_scope = {}
            sanitized = re.sub(r',\\s*(?=[a-zA-Z_]\\w*\\s*=)', '; ', test['input'])
            exec(sanitized, globals(), local_scope)
            
            # Get args from local scope
            args = list(local_scope.values())
            
            # Execute
            result = solution_func(*args)
            
            # Parse expected
            expected = eval(test['output'], {'null': None, 'true': True, 'false': False})
            
            passed = result == expected
            if not passed:
                all_passed = False
            
            results.append({
                "case": i + 1,
                "passed": passed,
                "input": test['input'],
                "expected": str(expected),
                "actual": str(result)
            })
        except Exception as e:
            all_passed = False
            results.append({
                "case": i + 1,
                "passed": False,
                "input": test['input'],
                "error": str(e)
            })
    
    print(json.dumps({"passed": all_passed, "results": results}))

if __name__ == "__main__":
    run_tests()
`;
    }
}

export const executionService = new ExecutionService();
