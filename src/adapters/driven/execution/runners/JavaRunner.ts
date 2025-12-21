import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { ExecutionResult } from '../../../../domain/ports/ExecutionService';

// Helper to convert JSON values to Java literals
function toJavaLiteral(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) {
        // Simple heuristic: check first element to guess type (int[], String[], etc)
        // For MVP, handling int[] is priority as it's most common in LeetCode
        if (value.length === 0) return 'new int[]{}';
        const first = value[0];
        if (typeof first === 'number') {
            return `new int[]{${value.join(',')}}`;
        }
        if (typeof first === 'string') {
            return `new String[]{${value.map(v => `"${v}"`).join(',')}}`;
        }
        // Fallback for mixed or other types?
        return `new Object[]{${value.map(toJavaLiteral).join(',')}}`;
    }
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'boolean') return value.toString();
    return value.toString();
}

export class JavaRunner {
    async execute(code: string, testCases: any[]): Promise<ExecutionResult> {
        return new Promise(async (resolve) => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'leetcode-java-'));
            const solutionPath = path.join(tmpDir, 'Solution.java');
            const mainPath = path.join(tmpDir, 'Main.java');

            try {
                // 1. Write User Code to Solution.java
                // We wrap it in "class Solution {}" if not present, though LeetCode usually provides it.
                // But for the user who might just paste a function, we might need to be careful.
                // Assumption: User pastes "class Solution { ... }"
                if (!code.trim().includes('class Solution')) {
                    // Check if it's just a method? simplified for now:
                    // wrap in class Solution if missing
                    code = `class Solution {\n${code}\n}`;
                }
                fs.writeFileSync(solutionPath, code);

                // 2. Determine method signature (heuristic)
                // We need to know what method to call.
                // Regex to find "public <Type> <methodName>(...)"
                const methodRegex = /public\s+[\w<>[\]]+\s+(\w+)\s*\(([^)]*)\)/;
                const match = code.match(methodRegex);

                if (!match) {
                    resolve({ success: false, error: 'Could not detect public method in Solution class.' });
                    return;
                }
                const methodName = match[1];

                // 3. Generate Main.java
                const testCalls = testCases.map((tc, index) => {
                    // Parse input: assumes input is a list of args? or similar to JS runner.
                    // If input is "[[2,7,11,15], 9]", we need to parse it as an array to spread it?
                    // But here tc.input is a string.
                    // We need to parse that JSON string into values to convert to Java literals.

                    let argsArray: any[];
                    try {
                        let parsed = JSON.parse(tc.input);
                        if (!Array.isArray(parsed)) parsed = [parsed];
                        argsArray = parsed;
                    } catch (e) {
                        try {
                            // Try wrapping in [] if it's just comma separated values "1, 2"
                            let parsed = JSON.parse(`[${tc.input}]`);
                            argsArray = parsed;
                        } catch (e2) {
                            // fallback treat as single string?
                            argsArray = [tc.input];
                        }
                    }

                    const argsJava = argsArray.map(toJavaLiteral).join(', ');

                    return `
        try {
            long start = System.nanoTime();
            Object result = sol.${methodName}(${argsJava});
            long end = System.nanoTime();
            double runtime = (end - start) / 1000000.0;
            
            // Print JSON result
            System.out.println("{ \\"passed\\": " + compare(result, ${JSON.stringify(tc.output)}) + 
                               ", \\"input\\": \\"${tc.input.replace(/"/g, '\\"')}\\"" + 
                               ", \\"expected\\": \\"${tc.output.replace(/"/g, '\\"')}\\"" + 
                               ", \\"actual\\": \\"" + toString(result) + "\\"" + 
                               ", \\"runtime\\": " + runtime + " }");
        } catch (Exception e) {
             System.out.println("{ \\"passed\\": false, \\"error\\": \\"" + e.toString().replace("\\\"", "'").replace("\\n", " ") + "\\" }");
        }
                    `;
                }).join('\n');

                const mainCode = `
import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();
        System.out.println("{ \\"success\\": true, \\"results\\": [");
        ${testCalls.split('\n').join('\n        Boolean comma' + (testCalls ? ' = true;' : ''))} 
        // Hacky way to join commas? Simplify: just print objects and let TS wrapper parse lines?
        // Let's print individual lines and wrap them in TS.
    }
    
    // Helper to generic compare
    public static boolean compare(Object actual, String expected) {
        String actStr = String.valueOf(actual);
        if (actual instanceof int[]) actStr = Arrays.toString((int[])actual).replaceAll(" ", "");
        if (actual instanceof Object[]) actStr = Arrays.deepToString((Object[])actual).replaceAll(" ", "");
        
        // Normalize
        String expStr = expected.replaceAll(" ", "");
        actStr = actStr.replaceAll(" ", "");
        
        return actStr.equals(expStr);
    }
}
`;
                // Revised Main code to just print lines that JS can aggregate
                const mainCodeSimple = `
import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        try {
            Solution sol = new Solution();
            System.out.println("---BEGIN_RESULTS---");
            ${testCalls}
            System.out.println("---END_RESULTS---");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static String toString(Object o) {
        if (o == null) return "null";
        if (o instanceof int[]) return Arrays.toString((int[])o);
        if (o instanceof long[]) return Arrays.toString((long[])o);
        if (o instanceof double[]) return Arrays.toString((double[])o);
        if (o instanceof Object[]) return Arrays.deepToString((Object[])o);
        return o.toString();
    }

    public static boolean compare(Object actual, String expected) {
        String actStr = toString(actual).replaceAll("\\\\s", "");
        String expStr = expected.replaceAll("\\\\s", "");
        return actStr.equals(expStr);
    }
}
`;
                fs.writeFileSync(mainPath, mainCodeSimple);

                // 4. Compile
                const compileProc = spawn('javac', ['Solution.java', 'Main.java'], { cwd: tmpDir });

                await new Promise((res, rej) => {
                    compileProc.on('close', (code) => code === 0 ? res(true) : rej(new Error('Compilation failed')));
                    compileProc.stderr.on('data', d => console.error(d.toString()));
                });

                // 5. Run
                const runProc = spawn('java', ['Main'], { cwd: tmpDir });

                const cleanup = () => {
                    clearTimeout(id);
                    if (!runProc.killed) runProc.kill();
                };

                const id = setTimeout(() => {
                    cleanup();
                    // Clean up tmp dir if timeout
                    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
                    resolve({ success: false, error: 'Execution timed out (5s limit)' });
                }, 5000);

                let output = '';
                runProc.stdout.on('data', d => output += d.toString());
                runProc.stderr.on('data', d => output += d.toString()); // Capture stderr too

                runProc.on('close', (code) => {
                    clearTimeout(id);
                    // Extract JSON lines between markers
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

                    fs.rmSync(tmpDir, { recursive: true, force: true }); // Cleanup

                    resolve({
                        success: true,
                        results: results
                    });
                });

            } catch (e: any) {
                // Cleanup on error
                if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
                resolve({ success: false, error: e.message || 'Java Execution Failed' });
            }
        });
    }
}
