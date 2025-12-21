
import { RustRunner } from '../../src/adapters/driven/execution/runners/RustRunner';

async function main() {
    console.log("Testing RustRunner...");

    const runner = new RustRunner();

    const code = `
    pub struct Solution;

    impl Solution {
        pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
            use std::collections::HashMap;
            let mut map = HashMap::new();
            for (i, &num) in nums.iter().enumerate() {
                let complement = target - num;
                if let Some(&index) = map.get(&complement) {
                    return vec![index, i as i32];
                }
                map.insert(num, i as i32);
            }
            vec![]
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
        console.log("✅ Rust Runner Test Passed!");
        process.exit(0);
    } else {
        console.error("❌ Rust Runner Test Failed!");
        process.exit(1);
    }
}

main();
