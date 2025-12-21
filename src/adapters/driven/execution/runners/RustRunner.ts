import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { ExecutionResult } from '../../../../domain/ports/ExecutionService';

export class RustRunner {
    async execute(code: string, testCases: any[]): Promise<ExecutionResult> {
        return new Promise(async (resolve) => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'leetcode-rust-'));
            const solutionPath = path.join(tmpDir, 'solution.rs');
            const mainPath = path.join(tmpDir, 'main.rs');

            try {
                // Rust needs a struct Solution / impl Solution usually?
                let userCode = code;
                if (!userCode.includes('impl Solution')) {
                    // Assuming user code is just a function inside impl Solution for now or valid Rust code.
                }

                fs.writeFileSync(solutionPath, userCode);

                // Detect function name: `pub fn (\w+)`
                const funcMatch = userCode.match(/fn\s+(\w+)\s*\(/);
                if (!funcMatch) {
                    resolve({ success: false, error: 'Could not detect function in Rust code.' });
                    return;
                }
                const funcName = funcMatch[1];

                const testCalls = testCases.map((tc, i) => {
                    return generateRustCall(funcName, tc.input, tc.output);
                }).join('\n');

                const mainRs = `
mod solution;
use solution::Solution;
use std::time::{Instant};

fn main() {
    println!("---BEGIN_RESULTS---");
    ${testCalls}
    println!("---END_RESULTS---");
}

fn to_json<T: std::fmt::Debug>(v: T) -> String {
    format!("{:?}", v)
}

fn compare(actual: String, expected: &str) -> bool {
    let act = actual.replace(" ", "");
    let exp = expected.replace(" ", "");
    return act == exp;
}
`;
                fs.writeFileSync(mainPath, mainRs);

                // Compile
                const compileProc = spawn('rustc', ['main.rs'], { cwd: tmpDir });
                let compileErr = '';
                compileProc.stderr.on('data', d => compileErr += d.toString());

                const compiled = await new Promise((res) => compileProc.on('close', (code) => res(code === 0)));

                if (!compiled) {
                    resolve({ success: false, error: 'Rust Compilation Failed', logs: compileErr });
                    return;
                }

                // Run ./main
                const runProc = spawn('./main', [], { cwd: tmpDir });

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
                        resolve({ success: false, error: 'Rust Execution Failed', logs: output });
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

function generateRustCall(funcName: string, inputJson: string, expectedJson: string): string {
    let argsLiteral = "";
    try {
        const args = JSON.parse(inputJson);
        const argsList = args.map((arg: any) => toRustLiteral(arg));
        argsLiteral = argsList.join(", ");
    } catch (e) {
        argsLiteral = toRustLiteral(inputJson);
    }

    return `
    {
        let start = Instant::now();
        let res = Solution::${funcName}(${argsLiteral});
        let duration = start.elapsed();
        let runtime = duration.as_secs_f64() * 1000.0;
        
        let actual_str = format!("{:?}", res);
        let pass = compare(actual_str.clone(), "${expectedJson.replace(/"/g, '\\"')}");
        
        println!("{{ \\"passed\\": {}, \\"input\\": \\"${inputJson.replace(/"/g, '\\"')}\\", \\"expected\\": \\"${expectedJson.replace(/"/g, '\\"')}\\", \\"actual\\": \\"{}\\", \\"runtime\\": {} }}", 
            pass, actual_str.replace("\\"", "'"), runtime);
    }
    `;
}

function toRustLiteral(v: any): string {
    if (Array.isArray(v)) {
        if (v.length === 0) return "vec![]";
        const elems = v.map(toRustLiteral).join(", ");
        return `vec![${elems}]`;
    }
    if (typeof v === 'string') return `"${v}".to_string()`;
    if (typeof v === 'string') return `"${v}"`;
    return String(v);
}
