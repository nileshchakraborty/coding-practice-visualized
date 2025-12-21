
import { GoRunner } from '../../src/adapters/driven/execution/runners/GoRunner';

async function main() {
    console.log("Testing GoRunner...");

    const runner = new GoRunner();

    // Valid Go two sum
    const code = `
    func twoSum(nums []int, target int) []int {
        m := make(map[int]int)
        for i, num := range nums {
            if idx, ok := m[target-num]; ok {
                return []int{idx, i}
            }
            m[num] = i
        }
        return []int{}
    }
    `;

    const testCases = [
        { input: JSON.stringify([[2, 7, 11, 15], 9]), output: "[0,1]" },
        { input: JSON.stringify([[3, 2, 4], 6]), output: "[1,2]" }
    ];

    console.log("Executing...");
    const result = await runner.execute(code, testCases);

    console.log("Result:", JSON.stringify(result, null, 2));

    if (result.success && result.results && result.results.length === 2 && result.results[0].passed) {
        console.log("✅ Go Runner Test Passed!");
        process.exit(0);
    } else {
        console.error("❌ Go Runner Test Failed!");
        process.exit(1);
    }
}

main();
