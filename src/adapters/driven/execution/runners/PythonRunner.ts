import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { ExecutionResult } from '../../../../domain/ports/ExecutionService';

export class PythonRunner {
    async execute(code: string, testCases: any[]): Promise<ExecutionResult> {
        return new Promise((resolve) => {
            // Robust path finding for local_runner.py
            const possiblePaths = [
                path.join(process.cwd(), '_local_runner.py'),         // If CWD is api/
                path.join(process.cwd(), 'api', '_local_runner.py'),  // If CWD is root
                path.join(__dirname, '../../../../api/_local_runner.py')  // Fallback
            ];

            let pythonScript = possiblePaths.find(p => fs.existsSync(p));
            if (!pythonScript) {
                console.error("Critical: local_runner.py not found in:", possiblePaths);
                resolve({ success: false, error: 'Execution bridge not found' });
                return;
            }

            const pythonProcess = spawn('python3', [pythonScript]);

            let dataString = '';
            let errorString = '';

            pythonProcess.stdin.write(JSON.stringify({ code, testCases }));
            pythonProcess.stdin.end();

            pythonProcess.stdout.on('data', (data) => {
                dataString += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorString += data.toString();
            });

            const cleanup = () => {
                clearTimeout(id);
                if (!pythonProcess.killed) pythonProcess.kill();
            };

            const id = setTimeout(() => {
                cleanup();
                resolve({ success: false, error: 'Execution timed out (5s limit)' });
            }, 5000);

            pythonProcess.on('close', (exitCode) => {
                clearTimeout(id);
                if (exitCode !== 0) {
                    // console.error('Execution Failed:', errorString);
                    resolve({ success: false, error: 'Execution failed', logs: errorString });
                    return;
                }
                try {
                    // runner.py might print debug lines. Parse the last JSON-looking line.
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
