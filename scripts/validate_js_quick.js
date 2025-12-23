/**
 * Quick JS Solution Validator - Tests first N solutions
 * Usage: node scripts/validate_js_quick.js [--count=50]
 */
const fs = require('fs');
const vm = require('vm');

const SOLUTIONS_PATH = 'api/data/solutions.json';
const COUNT = parseInt(process.argv.find(a => a.startsWith('--count='))?.split('=')[1] || '50');

// Parse input string into argument array
function parseArgs(inputStr) {
    const args = [];
    const regex = /(\w+)\s*=\s*(\[[^\]]*\]|"[^"]*"|'[^']*'|-?\d+\.?\d*|true|false|null)/g;
    let match;
    while ((match = regex.exec(inputStr)) !== null) {
        try {
            args.push(JSON.parse(match[2]));
        } catch {
            args.push(match[2]);
        }
    }
    return args;
}

console.log('🔍 Loading solutions...');
const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));
const slugs = Object.keys(data);
console.log(`📚 Found ${slugs.length} solutions. Testing first ${COUNT}...\n`);

let passed = 0, failed = 0, skipped = 0;
const failures = [];

const testList = slugs.slice(0, COUNT);

for (const slug of testList) {
    const sol = data[slug];
    const jsCode = sol.implementations?.javascript?.code;

    if (!jsCode) { skipped++; continue; }

    const testCases = sol.testCases || sol.examples || [];
    if (testCases.length === 0) { skipped++; continue; }

    if (!jsCode.includes('class Solution')) { skipped++; continue; }

    try {
        const sandbox = { Math, Array, Object, Map, Set, parseInt, parseFloat, Infinity, console: { log: () => { } } };
        vm.createContext(sandbox);
        vm.runInContext(jsCode + '\nthis.Solution = Solution;', sandbox, { timeout: 2000 });

        if (!sandbox.Solution) {
            failed++;
            failures.push({ slug, error: 'No Solution class exposed' });
            continue;
        }

        const instance = new sandbox.Solution();
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
            .filter(m => m !== 'constructor' && typeof instance[m] === 'function');

        if (methods.length === 0) {
            failed++;
            failures.push({ slug, error: 'No methods found' });
            continue;
        }

        // Test first case only for speed
        const tc = testCases[0];
        const args = parseArgs(tc.input);

        const result = instance[methods[0]](...args);
        const actual = JSON.stringify(result).replace(/\s/g, '');
        const expected = tc.output.replace(/\s/g, '');

        if (actual === expected) {
            passed++;
        } else {
            failed++;
            failures.push({ slug, expected, actual });
        }
    } catch (e) {
        failed++;
        failures.push({ slug, error: e.message });
    }
}

console.log('========================================');
console.log('📊 QUICK VALIDATION RESULTS');
console.log('========================================\n');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⏭️  Skipped: ${skipped}`);

if (failures.length > 0) {
    console.log('\n❌ Sample Failures:');
    failures.slice(0, 10).forEach(f => {
        console.log(`  ${f.slug}`);
        if (f.error) console.log(`    Error: ${f.error}`);
        else console.log(`    Expected: ${f.expected}\n    Actual:   ${f.actual}`);
    });
}

const successRate = ((passed / (passed + failed)) * 100).toFixed(1);
console.log(`\n📈 Success Rate: ${successRate}% (${passed}/${passed + failed})`);
