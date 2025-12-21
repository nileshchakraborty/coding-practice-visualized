
import { CppRunner } from '../../src/adapters/driven/execution/runners/CppRunner';

async function main() {
    console.log("Testing CppRunner...");

    const runner = new CppRunner();

    const code = `
    class Solution {
    public:
        vector<int> twoSum(vector<int>& nums, int target) {
            unordered_map<int, int> map;
            for (int i = 0; i < nums.size(); i++) {
                int complement = target - nums[i];
                if (map.count(complement)) {
                    return {map[complement], i};
                }
                map[nums[i]] = i;
            }
            return {};
        }
    };
    `;

    const testCases = [
        { input: JSON.stringify([[2, 7, 11, 15], 9]), output: "[0,1]" },
        { input: JSON.stringify([[3, 2, 4], 6]), output: "[1,2]" }
    ];

    console.log("Executing...");
    const result = await runner.execute(code, testCases);

    console.log("Result:", JSON.stringify(result, null, 2));

    if (result.success && result.results && result.results.length === 2 && result.results[0].passed) {
        console.log("✅ C++ Runner Test Passed!");
        process.exit(0);
    } else {
        console.error("❌ C++ Runner Test Failed!");
        process.exit(1);
    }
}

main();
