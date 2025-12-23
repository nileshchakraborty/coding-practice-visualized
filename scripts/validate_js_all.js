/**
 * JavaScript/TypeScript Solution Validator
 * 
 * Validates all JavaScript and TypeScript solutions against their test cases.
 * Usage: node scripts/validate_js_all.js [--verbose]
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load sucrase for TypeScript transpilation
let transform;
try {
    const sucrase = require('../frontend/node_modules/sucrase');
    transform = sucrase.transform;
} catch (e) {
    try {
        const sucrase = require('sucrase');
        transform = sucrase.transform;
    } catch (e2) {
        console.warn("⚠️  Sucrase not found - TypeScript validation will skip type annotations");
    }
}

const SOLUTIONS_PATH = path.join(__dirname, '..', 'api', 'data', 'solutions.json');
const VERBOSE = process.argv.includes('--verbose');

// Data structures for LeetCode problems
class ListNode {
    constructor(val = 0, next = null) {
        this.val = val;
        this.next = next;
    }
}

class TreeNode {
    constructor(val = 0, left = null, right = null) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

// Helper functions
function listToLL(arr) {
    if (!arr || arr.length === 0) return null;
    const head = new ListNode(arr[0]);
    let curr = head;
    for (let i = 1; i < arr.length; i++) {
        curr.next = new ListNode(arr[i]);
        curr = curr.next;
    }
    return head;
}

function llToList(node) {
    const result = [];
    const visited = new Set();
    while (node && !visited.has(node)) {
        visited.add(node);
        result.push(node.val);
        node = node.next;
    }
    return result;
}

function listToTree(arr) {
    if (!arr || arr.length === 0 || arr[0] === null) return null;
    const root = new TreeNode(arr[0]);
    const queue = [root];
    let i = 1;
    while (queue.length > 0 && i < arr.length) {
        const node = queue.shift();
        if (i < arr.length && arr[i] !== null) {
            node.left = new TreeNode(arr[i]);
            queue.push(node.left);
        }
        i++;
        if (i < arr.length && arr[i] !== null) {
            node.right = new TreeNode(arr[i]);
            queue.push(node.right);
        }
        i++;
    }
    return root;
}

function treeToList(root) {
    if (!root) return [];
    const result = [];
    const queue = [root];
    while (queue.length > 0) {
        const node = queue.shift();
        if (node) {
            result.push(node.val);
            queue.push(node.left);
            queue.push(node.right);
        } else {
            result.push(null);
        }
    }
    while (result.length > 0 && result[result.length - 1] === null) {
        result.pop();
    }
    return result;
}

// Parse input string into arguments
function parseInput(inputStr) {
    // Handle key=value pairs: nums = [1,2,3], target = 9
    const sanitized = inputStr.replace(/,\s*(?=[a-zA-Z_]\w*\s*=)/g, '; ');
    const parts = sanitized.split(';').map(p => p.trim()).filter(Boolean);

    const args = {};
    for (const part of parts) {
        const match = part.match(/^(\w+)\s*=\s*(.+)$/);
        if (match) {
            const key = match[1];
            const valueStr = match[2];
            try {
                args[key] = new Function('null', 'true', 'false', `return ${valueStr}`)(null, true, false);
            } catch {
                args[key] = valueStr;
            }
        }
    }
    return args;
}

// Execute code and compare to expected output
function executeTest(code, testCase, lang) {
    // Transpile TypeScript if needed
    if (lang === 'typescript' && transform) {
        try {
            const result = transform(code, { transforms: ['typescript'] });
            code = result.code;
        } catch (e) {
            return { passed: false, error: `TS Compile: ${e.message}` };
        }
    }

    // Create sandbox with data structures
    const sandbox = {
        console: { log: () => { }, error: () => { } },
        ListNode,
        TreeNode,
        listToLL,
        llToList,
        listToTree,
        treeToList,
        Math,
        Array,
        Object,
        Map,
        Set,
        parseInt,
        parseFloat,
        Infinity,
        NaN
    };

    try {
        vm.createContext(sandbox);

        // Check if code contains a class Solution
        const hasClass = code.includes('class Solution');

        let solutionFn = null;

        if (hasClass) {
            // Wrap code to expose the Solution class and create an instance
            const wrappedCode = `
                ${code}
                
                // Expose Solution to sandbox
                this.Solution = Solution;
            `;

            vm.runInContext(wrappedCode, sandbox, { timeout: 5000 });

            if (sandbox.Solution && typeof sandbox.Solution === 'function') {
                const instance = new sandbox.Solution();
                // Find the first method that isn't constructor
                const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
                    .filter(m => m !== 'constructor' && typeof instance[m] === 'function');
                if (methods.length > 0) {
                    solutionFn = instance[methods[0]].bind(instance);
                }
            }
        } else {
            // Run code and find standalone function
            vm.runInContext(code, sandbox, { timeout: 5000 });

            const keys = Object.keys(sandbox);
            const fnKey = keys.find(k =>
                typeof sandbox[k] === 'function' &&
                !['ListNode', 'TreeNode', 'listToLL', 'llToList', 'listToTree', 'treeToList'].includes(k)
            );
            if (fnKey) solutionFn = sandbox[fnKey];
        }

        if (!solutionFn) {
            return { passed: false, error: 'No function found' };
        }

        // Parse input
        const parsedArgs = parseInput(testCase.input);
        const args = Object.values(parsedArgs);

        // Execute
        const actual = solutionFn(...args);

        // Format actual output
        let actualStr = actual === undefined ? 'undefined' : JSON.stringify(actual);
        if (actual instanceof ListNode) actualStr = JSON.stringify(llToList(actual));
        if (actual instanceof TreeNode) actualStr = JSON.stringify(treeToList(actual));

        // Compare
        const expected = String(testCase.output).trim();
        const normalActual = actualStr.replace(/\s/g, '');
        const normalExpected = expected.replace(/\s/g, '');

        const passed = normalActual === normalExpected;
        return { passed, actual: actualStr, expected };

    } catch (e) {
        return { passed: false, error: e.message };
    }
}

async function main() {
    console.log('🔍 Loading solutions...');

    if (!fs.existsSync(SOLUTIONS_PATH)) {
        console.error(`❌ Solutions file not found: ${SOLUTIONS_PATH}`);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));
    const solutions = typeof data === 'object' && data.solutions ? data.solutions : data;

    const stats = {
        jsTotal: 0, jsPassed: 0, jsFailed: 0, jsSkipped: 0,
        tsTotal: 0, tsPassed: 0, tsFailed: 0, tsSkipped: 0
    };
    const failures = [];

    const slugs = Object.keys(solutions);
    let processed = 0;

    for (const [slug, sol] of Object.entries(solutions)) {
        processed++;
        if (processed % 50 === 0) {
            process.stdout.write(`\r📊 Progress: ${processed}/${slugs.length} solutions...`);
        }

        // JavaScript Implementation
        const jsImpl = sol.implementations?.javascript;
        if (jsImpl && jsImpl.code) {
            stats.jsTotal++;
            const testCases = sol.testCases || sol.examples || [];

            if (testCases.length === 0) {
                stats.jsSkipped++;
            } else {
                let allPassed = true;
                for (const tc of testCases) {
                    const result = executeTest(jsImpl.code, tc, 'javascript');
                    if (!result.passed) {
                        allPassed = false;
                        if (VERBOSE || failures.length < 10) {
                            failures.push({ slug, lang: 'JS', ...result, input: tc.input });
                        }
                        break;
                    }
                }
                if (allPassed) stats.jsPassed++;
                else stats.jsFailed++;
            }
        }

        // TypeScript Implementation
        const tsImpl = sol.implementations?.typescript;
        if (tsImpl && tsImpl.code) {
            stats.tsTotal++;
            const testCases = sol.testCases || sol.examples || [];

            if (testCases.length === 0) {
                stats.tsSkipped++;
            } else {
                let allPassed = true;
                for (const tc of testCases) {
                    const result = executeTest(tsImpl.code, tc, 'typescript');
                    if (!result.passed) {
                        allPassed = false;
                        if (VERBOSE || failures.length < 10) {
                            failures.push({ slug, lang: 'TS', ...result, input: tc.input });
                        }
                        break;
                    }
                }
                if (allPassed) stats.tsPassed++;
                else stats.tsFailed++;
            }
        }
    }

    // Report
    console.log('\n========================================');
    console.log('📊 VALIDATION RESULTS');
    console.log('========================================\n');

    console.log('JavaScript:');
    console.log(`  Total: ${stats.jsTotal}`);
    console.log(`  ✅ Passed: ${stats.jsPassed}`);
    console.log(`  ❌ Failed: ${stats.jsFailed}`);
    console.log(`  ⏭️  Skipped: ${stats.jsSkipped}`);

    console.log('\nTypeScript:');
    console.log(`  Total: ${stats.tsTotal}`);
    console.log(`  ✅ Passed: ${stats.tsPassed}`);
    console.log(`  ❌ Failed: ${stats.tsFailed}`);
    console.log(`  ⏭️  Skipped: ${stats.tsSkipped}`);

    if (failures.length > 0) {
        console.log('\n❌ Sample Failures:');
        for (const f of failures.slice(0, 5)) {
            console.log(`  [${f.lang}] ${f.slug}`);
            if (f.error) console.log(`      Error: ${f.error}`);
            else console.log(`      Expected: ${f.expected} | Got: ${f.actual}`);
        }
    }

    const totalFailed = stats.jsFailed + stats.tsFailed;
    if (totalFailed > 0) {
        console.log(`\n⚠️  ${totalFailed} solutions failed validation.`);
        process.exit(1);
    } else {
        console.log('\n🎉 All solutions passed!');
        process.exit(0);
    }
}

main().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});
