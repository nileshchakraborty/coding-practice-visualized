
import { JavaRunner } from '../../src/adapters/driven/execution/runners/JavaRunner';

async function main() {
    console.log("Testing JavaRunner...");

    const runner = new JavaRunner();

    const code = `
    class Solution {
        public int[] twoSum(int[] nums, int target) {
            for (int i = 0; i < nums.length; i++) {
                for (int j = i + 1; j < nums.length; j++) {
                    if (nums[i] + nums[j] == target) {
                        return new int[] { i, j };
                    }
                }
            }
            return new int[] {};
        }
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
        console.log("✅ Java Runner Test Passed!");
        process.exit(0);
    } else {
        console.error("❌ Java Runner Test Failed!");
        process.exit(1);
    }
}

main();
