
import { JavascriptRunner } from '../../src/adapters/driven/execution/runners/JavascriptRunner';

async function main() {
    console.log("Testing JavascriptRunner...");

    const runner = new JavascriptRunner();

    const code = `
    function twoSum(nums, target) {
        const map = {};
        for (let i = 0; i < nums.length; i++) {
            const complement = target - nums[i];
            if (map[complement] !== undefined) {
                return [map[complement], i];
            }
            map[nums[i]] = i;
        }
        return [];
    }
    `;

    const testCases = [
        { input: JSON.stringify([[2, 7, 11, 15], 9]), output: "[0,1]" },
        { input: JSON.stringify([[3, 2, 4], 6]), output: "[1,2]" }
    ];

    console.log("Executing...");
    const result = await runner.execute(code, testCases);

    console.log("Result:", JSON.stringify(result, null, 2));

    if (result.success && result.results && result.results.every((r: any) => r.passed)) {
        console.log("✅ JS Runner Test Passed!");
        process.exit(0);
    } else {
        console.error("❌ JS Runner Test Failed!");
        process.exit(1);
    }
}

main();
