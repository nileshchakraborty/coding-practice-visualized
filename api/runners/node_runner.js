const vm = require('vm');
const fs = require('fs');

/**
 * Node.js Runner for LeetCode-style execution
 * Reads JSON from stdin: { code: string, testCases: Array }
 * Writes JSON to stdout: { results: Array, success: boolean }
 */

async function main() {
    let inputData = '';

    process.stdin.on('data', chunk => {
        inputData += chunk;
    });

    process.stdin.on('end', async () => {
        try {
            if (!inputData) {
                throw new Error("No input provided");
            }
            const { code, testCases } = JSON.parse(inputData);

            if (!code) throw new Error("Missing code");

            // Create a sandbox
            const sandbox = {
                console: {
                    log: (...args) => { }, // Suppress user logs or capture them if needed
                    error: (...args) => { }
                },
                // Add execution context helpers if needed (e.g. ListNode, TreeNode definitions)
            };

            vm.createContext(sandbox);

            // Execute user code to define the function
            // We wrap it to ensure it doesn't execute immediately but just defines the function
            vm.runInContext(code, sandbox);

            // Identify the solution function (heuristic: first function defined or specific naming convention)
            // For now, we assume the user defines a function that matches the problem requirement.
            // A better way is to ask the user to name it 'solution' or inspect the context.
            // Let's assume the LAST function defined in the code is the target, or look for common names.
            const keys = Object.keys(sandbox);
            const userFnName = keys.find(k => typeof sandbox[k] === 'function' && k !== 'console');

            if (!userFnName) {
                throw new Error("No function found in code. Please define a function.");
            }

            const results = [];
            for (const test of (testCases || [])) {
                const start = process.hrtime();

                // Parse input arguments from string representation if needed, 
                // but usually the frontend sends stringified inputs.
                // For simplicity in this MVP, we assume test.input is a string that can be eval'd to arguments 
                // OR we pass it directly if it's already an array of args.
                // Ideally, test.input should be parsed.

                // Hacky argument parsing: assume input is like "nums = [2,7,11,15], target = 9"
                // This is complex to parse generically without a parser.
                // ALTERNATIVE: The frontend sends testCases as { input: "...", output: "..." }
                // We might need to adjust the runner to expect structured args or use a standard parser.

                // FOR MVP: rely on a simple 'eval' of the input string to get arguments list?
                // Or better, let's assume the test case input is formatted as "[arg1, arg2]"

                let args;
                try {
                    // Try to parse input if it looks like JSON/Array, otherwise treat as single string
                    if (test.input.trim().startsWith('[')) {
                        args = JSON.parse(test.input);
                    } else {
                        // Fallback mechanism or throw
                        // For many "leetcode" style inputs, they are just values.
                        // Let's try to evaluate it in the sandbox to parse it.
                        args = vm.runInContext(`[${test.input}]`, sandbox);
                    }
                } catch (e) {
                    // unexpected, just pass as string
                    args = [test.input];
                }

                if (!Array.isArray(args)) args = [args];

                try {
                    const result = sandbox[userFnName](...args);
                    const end = process.hrtime(start);
                    const runtime = (end[0] * 1000 + end[1] / 1e6).toFixed(2);

                    // Compare result
                    // We need a deep compare function or generic JSON stringify compare
                    const actualStr = JSON.stringify(result);
                    const expectedStr = String(test.output).trim(); // Simple string compare for MVP

                    // Normalize expected string (remove spaces) for robust comparison
                    const passed = actualStr === expectedStr || actualStr.replace(/\s/g, '') === expectedStr.replace(/\s/g, '');

                    results.push({
                        passed,
                        input: test.input,
                        expected: test.output,
                        actual: actualStr,
                        runtime: parseFloat(runtime)
                    });
                } catch (err) {
                    results.push({
                        passed: false,
                        input: test.input,
                        expected: test.output,
                        actual: "Error",
                        error: err.toString()
                    });
                }
            }

            console.log(JSON.stringify({ success: true, results }));

        } catch (e) {
            console.error(e);
            console.log(JSON.stringify({ success: false, error: e.message }));
            process.exit(1);
        }
    });
}

main();
