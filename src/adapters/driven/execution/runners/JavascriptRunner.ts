import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { ExecutionResult } from '../../../../domain/ports/ExecutionService';

export class JavascriptRunner {
    async execute(code: string, testCases: any[]): Promise<ExecutionResult> {
        return new Promise((resolve) => {
            const runnerScript = path.join(process.cwd(), 'api', 'runners', 'node_runner.js');

            if (!fs.existsSync(runnerScript)) {
                // Fallback for Vercel or different CWD
                const fallback = path.join(process.cwd(), 'runners', 'node_runner.js');
                if (!fs.existsSync(fallback)) {
                    console.error("Critical: node_runner.js not found in:", runnerScript, fallback);
                    resolve({ success: false, error: 'Execution bridge not found' });
                    return;
                }
            }

            const nodeProcess = spawn('node', [runnerScript]);

            let dataString = '';
            let errorString = '';

            nodeProcess.stdin.write(JSON.stringify({ code, testCases }));
            nodeProcess.stdin.end();

            nodeProcess.stdout.on('data', (data) => {
                dataString += data.toString();
            });

            nodeProcess.stderr.on('data', (data) => {
                errorString += data.toString();
            });

            const cleanup = () => {
                clearTimeout(id);
                if (!nodeProcess.killed) nodeProcess.kill();
            };

            const id = setTimeout(() => {
                cleanup();
                resolve({ success: false, error: 'Execution timed out (5s limit)' });
            }, 5000);

            nodeProcess.on('close', (exitCode) => {
                clearTimeout(id);
                if (exitCode !== 0) {
                    // console.error('JS Execution Failed:', errorString); // Removed overly verbose log
                    resolve({ success: false, error: 'Execution failed', logs: errorString });
                    return;
                }
                try {
                    // runner might print debug lines. Parse the last JSON-looking line.
                    const lines = dataString.trim().split('\n');
                    const jsonLine = lines.reverse().find(l => l.trim().startsWith('{'));
                    if (!jsonLine) throw new Error("No JSON found in output");
                    const result = JSON.parse(jsonLine);
                    resolve(result);
                } catch (e) {
                    resolve({
                        success: false,
                        error: 'Invalid output from runner',
                        rawOutput: dataString,
                        stderr: errorString
                    });
                }
            });
        });
    }
}
