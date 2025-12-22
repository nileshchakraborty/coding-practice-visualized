import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { ExecutionResult } from '../../../../domain/ports/ExecutionService';

export class GoRunner {
    async execute(code: string, testCases: any[]): Promise<ExecutionResult> {
        return new Promise(async (resolve) => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'leetcode-go-'));
            const mainPath = path.join(tmpDir, 'main.go');

            try {
                // Go requires the code to be in a package main
                let userCode = code;
                if (userCode.includes('package ')) {
                    userCode = userCode.replace(/package\s+\w+/, 'package main');
                } else {
                    userCode = 'package main\n\n' + userCode;
                }

                // Detect function name and if it's a method
                let funcName = '';
                let isMethod = false;

                // Check for method: func (s *Solution) Name(...)
                const methodMatch = userCode.match(/func\s+\(\w+\s*\*?Solution\)\s+(\w+)\s*\(/);
                if (methodMatch) {
                    funcName = methodMatch[1];
                    isMethod = true;
                } else {
                    // Fallback to standalone function
                    const funcMatch = userCode.match(/func\s+(\w+)\s*\(/);
                    if (!funcMatch) {
                        resolve({ success: false, error: 'Could not detect function in Go code.' });
                        return;
                    }
                    funcName = funcMatch[1];
                }

                const imports = `
import (
    "encoding/json"
    "fmt"
    "reflect"
    "strings"
    "time"
)
`;
                // Add imports if missing? No, Go is strict. 
                // We rely on user providing imports or we implement a smart injector later.
                // For now: Do NOT inject imports into output file to avoid unused import errors.

                // Write user code to solution.go
                fs.writeFileSync(path.join(tmpDir, 'solution.go'), userCode);

                const testCalls = testCases.map(tc => {
                    return generateGoCall(funcName, tc.input, tc.output, isMethod);
                }).join('\n');

                const mainGo = `
package main

import (
    "encoding/json"
    "fmt"
    "time"
    "strings"
)

func main() {
    fmt.Println("---BEGIN_RESULTS---")
    ${testCalls}
    fmt.Println("---END_RESULTS---")
}

func toJson(v interface{}) string {
    b, _ := json.Marshal(v)
    return string(b)
}

func compare(actual interface{}, expectedJson string) bool {
    actJson := toJson(actual)
    return strings.ReplaceAll(actJson, " ", "") == strings.ReplaceAll(expectedJson, " ", "")
}
`;
                fs.writeFileSync(mainPath, mainGo);

                // Initialize Go Module
                const initProc = spawn('go', ['mod', 'init', 'leetcode'], { cwd: tmpDir });
                await new Promise((res) => initProc.on('close', res));

                // Run
                const runProc = spawn('go', ['run', '.'], { cwd: tmpDir });

                const cleanup = () => {
                    clearTimeout(id);
                    if (!runProc.killed) runProc.kill();
                };

                const id = setTimeout(() => {
                    cleanup();
                    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
                    resolve({ success: false, error: 'Execution timed out (5s limit)' });
                }, 5000);

                let output = '';
                runProc.stdout.on('data', d => output += d.toString());
                runProc.stderr.on('data', d => output += d.toString());

                runProc.on('close', (code) => {
                    clearTimeout(id);
                    if (code !== 0) {
                        console.error('Go Execution Failed:', output);
                        resolve({ success: false, error: 'Go Compilation/Execution failed', logs: output });
                        return;
                    }
                    const lines = output.split('\n');
                    const results = [];
                    let capturing = false;
                    for (const line of lines) {
                        if (line.trim() === '---BEGIN_RESULTS---') { capturing = true; continue; }
                        if (line.trim() === '---END_RESULTS---') { capturing = false; continue; }
                        if (capturing && line.trim().startsWith('{')) {
                            try { results.push(JSON.parse(line)); } catch (e) { }
                        }
                    }

                    fs.rmSync(tmpDir, { recursive: true, force: true });
                    resolve({ success: true, results });
                });

            } catch (e: any) {
                if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
                resolve({ success: false, error: e.message });
            }
        });
    }
}

function generateGoCall(funcName: string, inputJson: string, expectedJson: string, isMethod: boolean): string {
    let argsStr = "";
    try {
        const args = JSON.parse(inputJson);
        let argLiterals = args.map((arg: any) => toGoLiteral(arg));
        argsStr = argLiterals.join(", ");
    } catch (e) {
        argsStr = toGoLiteral(inputJson);
    }

    const callStr = isMethod ?
        `sol := Solution{}; res := sol.${funcName}(${argsStr})` :
        `res := ${funcName}(${argsStr})`;

    return `
    {
        start := time.Now()
        ${callStr}
        elapsed := time.Since(start).Seconds() * 1000 
        
        pass := compare(res, \`${expectedJson}\`)
        
        jsonStr := fmt.Sprintf(\`{ "passed": %t, "input": "%s", "expected": "%s", "actual": %s, "runtime": %.2f }\`,
            pass, 
            \`${inputJson.replace(/"/g, '\\"')}\`, 
            \`${expectedJson.replace(/"/g, '\\"')}\`, 
            toJson(res), 
            elapsed) 
            
        fmt.Println(jsonStr)
    }
    `;
}

function toGoLiteral(v: any): string {
    if (Array.isArray(v)) {
        if (v.length === 0) return "[]int{}";
        if (typeof v[0] === 'number') return `[]int{${v.join(',')}}`;
        if (typeof v[0] === 'string') return `[]string{"${v.join('","')}"}`;
        return "[]interface{}{}";
    }
    if (typeof v === 'string') return `"${v}"`;
    if (typeof v === 'object') return "nil";
    return String(v);
}
