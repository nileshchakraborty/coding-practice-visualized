import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { ExecutionResult } from '../../../../domain/ports/ExecutionService';

export class CppRunner {
    async execute(code: string, testCases: any[]): Promise<ExecutionResult> {
        return new Promise(async (resolve) => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'leetcode-cpp-'));
            const mainPath = path.join(tmpDir, 'main.cpp');

            try {
                // User code usually is "class Solution { ... };"
                // We write it to main.cpp directly or separate header?
                // Single file is easier for compilation.

                // Add includes
                let fullCode = `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <map>
#include <unordered_map>
#include <sstream>
#include <chrono>

using namespace std;

// User Code
${code}

// Comparison Helper
bool compare(string actual, string expected) {
    // Remove spaces
    string act = actual;
    string exp = expected;
    act.erase(remove(act.begin(), act.end(), ' '), act.end());
    exp.erase(remove(exp.begin(), exp.end(), ' '), exp.end());
    return act == exp;
}

// ToJson Helper (Simple manual serialization for vector/int)
// For generic T?
string to_json(int v) { return to_string(v); }
string to_json(string v) { return "\\"" + v + "\\""; } // naive quote
template <typename T>
string to_json(vector<T> v) {
    stringstream ss;
    ss << "[";
    for(size_t i=0; i<v.size(); ++i) {
        ss << to_json(v[i]);
        if(i < v.size()-1) ss << ",";
    }
    ss << "]";
    return ss.str();
}

int main() {
    Solution sol;
    cout << "---BEGIN_RESULTS---" << endl;
    
    // Test Cases
    ${testCases.map((tc, i) => generateCppCall(code, tc.input, tc.output)).join('\n')}
    
    cout << "---END_RESULTS---" << endl;
    return 0;
}
`;
                fs.writeFileSync(mainPath, fullCode);

                // Compile: g++ -std=c++17 main.cpp -o main
                const compileProc = spawn('g++', ['-std=c++17', 'main.cpp', '-o', 'main'], { cwd: tmpDir });
                let compileErr = '';
                compileProc.stderr.on('data', d => compileErr += d.toString());

                const compiled = await new Promise((res) => compileProc.on('close', (code) => res(code === 0)));

                if (!compiled) {
                    resolve({ success: false, error: 'C++ Compilation Failed', logs: compileErr });
                    return;
                }

                // Run
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

function generateCppCall(code: string, inputJson: string, expectedJson: string): string {
    // We need to guess function name or simple hardcoded 'twoSum'? 
    // Regex for function name in 'class Solution'
    const match = code.match(/public:\s*[\w<>\[\]]+\s+(\w+)\s*\(/) || code.match(/vector<int>\s+(\w+)\s*\(/);
    const funcName = match ? match[1] : 'twoSum'; // Fallback

    // Input conversion with named variables to handle references
    let argsSetup = "";
    let argNames = [];
    try {
        const args = JSON.parse(inputJson);
        args.forEach((a: any, i: number) => {
            const type = inferCppType(a);
            const val = toCppLiteral(a);
            const varName = `arg${i}`;
            argsSetup += `${type} ${varName} = ${val};\n        `;
            argNames.push(varName);
        });
    } catch (e) {
        // fallback (single arg?)
        argsSetup = `auto arg0 = ${toCppLiteral(inputJson)};\n        `;
        argNames.push("arg0");
    }

    const funcCallArgs = argNames.join(", ");

    return `
    {
        ${argsSetup}
        auto start = chrono::high_resolution_clock::now();
        auto res = sol.${funcName}(${funcCallArgs});
        auto end = chrono::high_resolution_clock::now();
        double elapsed = chrono::duration<double, milli>(end - start).count();
        
        string actJson = to_json(res);
        bool pass = compare(actJson, "${expectedJson.replace(/"/g, '\\"')}");
        
        cout << "{ \\"passed\\": " << (pass ? "true" : "false") 
             << ", \\"input\\": \\"${inputJson.replace(/"/g, '\\"')}\\""
             << ", \\"expected\\": \\"${expectedJson.replace(/"/g, '\\"')}\\""
             << ", \\"actual\\": \\"" << actJson << "\\""
             << ", \\"runtime\\": " << elapsed << " }" << endl;
    }
    `;
}

function inferCppType(v: any): string {
    if (Array.isArray(v)) {
        if (v.length === 0) return "vector<int>"; // Default to int vector
        if (typeof v[0] === 'number') return "vector<int>";
        if (typeof v[0] === 'string') return "vector<string>";
        if (Array.isArray(v[0])) {
            // 2D
            if (v[0].length === 0) return "vector<vector<int>>";
            if (typeof v[0][0] === 'number') return "vector<vector<int>>";
            if (typeof v[0][0] === 'string') return "vector<vector<string>>";
        }
        return "vector<int>";
    }
    if (typeof v === 'string') return "string";
    if (typeof v === 'boolean') return "bool";
    if (typeof v === 'number') {
        return Number.isInteger(v) ? "int" : "double";
    }
    return "auto";
}

function toCppLiteral(v: any): string {
    if (Array.isArray(v)) {
        if (v.length === 0) return "{}";
        return `{${v.map(toCppLiteral).join(", ")}}`; // vector initializer list
    }
    if (typeof v === 'string') return `"${v}"`;
    return String(v);
}
