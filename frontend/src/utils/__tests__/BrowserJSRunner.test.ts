import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserJSRunner } from '../BrowserJSRunner';
import { ConstraintValidator } from '../ConstraintValidator';
import { Transpiler } from '../Transpiler';

// Mock dependencies
vi.mock('../ConstraintValidator');
vi.mock('../Transpiler');

describe('BrowserJSRunner', () => {
    let runner: BrowserJSRunner;

    beforeEach(() => {
        runner = new BrowserJSRunner();
        vi.clearAllMocks();
        // Default mock behavior
        vi.mocked(Transpiler.transpile).mockImplementation((code) => code);
        vi.mocked(ConstraintValidator.validate).mockReturnValue({ valid: true, errors: [] });
        vi.mocked(ConstraintValidator.parseInput).mockImplementation((input) => {
            // Simple mock parser: "nums = [2,7]" -> { nums: [2,7] }
            const parts = input.split('=');
            if (parts.length === 2) {
                const key = parts[0].trim();
                const val = JSON.parse(parts[1].trim());
                return { [key]: val };
            }
            return {};
        });
    });

    it('executes simple function solution', async () => {
        const code = `
        function twoSum(nums, target) {
            return [0, 1];
        }
        `;
        const testCases = [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' }];

        // Mock input parsing specifically for this test
        vi.mocked(ConstraintValidator.parseInput).mockReturnValue({ nums: [2, 7, 11, 15], target: 9 });

        const result = await runner.execute(code, testCases);

        expect(result.success).toBe(true);
        expect(result.passed).toBe(true);
        expect(result.results?.[0].actual).toBe('[0,1]');
    });

    it('executes class solution', async () => {
        const code = `
        class Solution {
            twoSum(nums, target) {
                return [0, 1];
            }
        }
        `;
        const testCases = [{ input: 'nums = [2,7], target = 9', output: '[0,1]' }];
        vi.mocked(ConstraintValidator.parseInput).mockReturnValue({ nums: [2, 7], target: 9 });

        const result = await runner.execute(code, testCases);

        expect(result.success).toBe(true);
        expect(result.passed).toBe(true);
    });

    it('handles implementation error', async () => {
        const code = `
        function solve() {
            throw new Error("Runtime Error");
        }
        `;
        const testCases = [{ input: 'x = 1', output: '1' }];
        vi.mocked(ConstraintValidator.parseInput).mockReturnValue({ x: 1 });

        const result = await runner.execute(code, testCases);

        expect(result.success).toBe(true);
        expect(result.passed).toBe(false);
        expect(result.results?.[0].error).toContain('Runtime Error');
    });

    it('handles compilation/transpilation error', async () => {
        vi.mocked(Transpiler.transpile).mockImplementation(() => {
            throw new Error('Syntax Error');
        });

        const result = await runner.execute('bad code', []);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Syntax Error');
    });

    it('validates constraints', async () => {
        const constraints = ['0 <= x <= 10'];
        const testCases = [{ input: 'x = 100', output: '' }];

        vi.mocked(ConstraintValidator.validate).mockReturnValue({
            valid: false,
            errors: ['x violates constraint']
        });

        const result = await runner.execute('function f(){}', testCases, 'javascript', undefined, constraints);

        expect(result.success).toBe(true);
        expect(result.passed).toBe(false);
        expect(result.results?.[0].error).toContain('violates problem constraints');
    });

    it('captures console logs', async () => {
        const code = `
        function solve() {
            console.log("Debug message");
            return 1;
        }
        `;
        const testCases = [{ input: 'x=1', output: '1' }];
        vi.mocked(ConstraintValidator.parseInput).mockReturnValue({ x: 1 });

        const result = await runner.execute(code, testCases);

        // Assert string match directly as logger separates args with space but doesn't JSON stringify primitives forcefully if using String()
        // Wait, BrowserJSRunner implementation:
        // typeof a === 'object' ? JSON.stringify(a) : String(a)
        expect(result.logs).toContain('Debug message');
    });

    it('handles failing test case', async () => {
        const code = `
        function add(a, b) {
            return a - b;  // Wrong implementation
        }
        `;
        const testCases = [{ input: 'a = 2, b = 3', output: '5' }];
        vi.mocked(ConstraintValidator.parseInput).mockReturnValue({ a: 2, b: 3 });

        const result = await runner.execute(code, testCases);

        expect(result.success).toBe(true);
        expect(result.passed).toBe(false);
        expect(result.results?.[0].passed).toBe(false);
        expect(result.results?.[0].expected).toBe('5');
    });

    it('handles arrow function syntax', async () => {
        const code = `
        const multiply = (a, b) => a * b;
        `;
        const testCases = [{ input: 'a = 3, b = 4', output: '12' }];
        vi.mocked(ConstraintValidator.parseInput).mockReturnValue({ a: 3, b: 4 });

        const result = await runner.execute(code, testCases);

        expect(result.success).toBe(true);
        expect(result.passed).toBe(true);
    });

    it('handles code without callable function', async () => {
        const code = `
        // No valid function, just an assignment
        const x = 5;
        `;
        const testCases = [{ input: 'x = 1', output: '1' }];
        vi.mocked(ConstraintValidator.parseInput).mockReturnValue({ x: 1 });

        const result = await runner.execute(code, testCases);

        expect(result.success).toBe(true);
        expect(result.passed).toBe(false);
        // The error can be either "Could not find function" or an execution error
        expect(result.results?.[0].error).toBeDefined();
    });

    it('handles null/undefined output formatting', async () => {
        const code = `
        function returnNull() {
            return null;
        }
        `;
        const testCases = [{ input: 'x = 1', output: 'null' }];
        vi.mocked(ConstraintValidator.parseInput).mockReturnValue({ x: 1 });

        const result = await runner.execute(code, testCases);

        expect(result.success).toBe(true);
        expect(result.passed).toBe(true);
        expect(result.results?.[0].actual).toBe('null');
    });

    it('handles empty test cases array', async () => {
        const code = `function test() { return 1; }`;
        const result = await runner.execute(code, []);

        expect(result.success).toBe(true);
        expect(result.passed).toBe(true);
        expect(result.results).toEqual([]);
    });

    it('normalizes whitespace and quotes in comparison', async () => {
        const code = `
        function getArray() {
            return [1, 2, 3];
        }
        `;
        const testCases = [{ input: 'x = 1', output: "[1, 2, 3]" }];
        vi.mocked(ConstraintValidator.parseInput).mockReturnValue({ x: 1 });

        const result = await runner.execute(code, testCases);

        expect(result.success).toBe(true);
        expect(result.passed).toBe(true);
    });

    it('handles custom judge for in-place operations', async () => {
        const code = `
        function removeElement(nums, val) {
            let k = 0;
            for (let i = 0; i < nums.length; i++) {
                if (nums[i] !== val) {
                    nums[k] = nums[i];
                    k++;
                }
            }
            return k;
        }
        `;
        const testCases = [{ input: 'nums = [3,2,2,3], val = 3', output: '2, nums = [2,2,_,_]' }];
        vi.mocked(ConstraintValidator.parseInput).mockReturnValue({ nums: [3, 2, 2, 3], val: 3 });

        const result = await runner.execute(code, testCases);

        // Custom judge should match
        expect(result.success).toBe(true);
        expect(result.passed).toBe(true);
    });

    it('handles console.log with objects', async () => {
        const code = `
        function solve() {
            console.log({ key: "value" }, [1, 2, 3]);
            return 1;
        }
        `;
        const testCases = [{ input: 'x = 1', output: '1' }];
        vi.mocked(ConstraintValidator.parseInput).mockReturnValue({ x: 1 });

        const result = await runner.execute(code, testCases);

        expect(result.logs).toContain('{"key":"value"}');
        expect(result.logs).toContain('[1,2,3]');
    });

    it('enriches test cases using reference code', async () => {
        const code = `
        function add(a, b) {
            return a + b;
        }
        `;
        const referenceCode = `
        function add(a, b) {
            return a + b;
        }
        `;
        // Test case with empty output - should be computed from reference
        const testCases = [{ input: 'a = 2, b = 3', output: '' }];
        vi.mocked(ConstraintValidator.parseInput).mockReturnValue({ a: 2, b: 3 });

        const result = await runner.execute(code, testCases, 'javascript', referenceCode);

        expect(result.success).toBe(true);
        expect(result.passed).toBe(true);
        // Reference should compute 5
        expect(result.results?.[0].expected).toBe('5');
    });

    it('handles reference code error during enrichment', async () => {
        const code = `
        function add(a, b) {
            return a + b;
        }
        `;
        const referenceCode = `
        function badFunc() {
            throw new Error("Reference Error");
        }
        `;
        const testCases = [{ input: 'a = 2, b = 3', output: '' }];
        vi.mocked(ConstraintValidator.parseInput).mockReturnValue({ a: 2, b: 3 });

        const result = await runner.execute(code, testCases, 'javascript', referenceCode);

        expect(result.success).toBe(true);
        // Expected output should contain reference error
        expect(result.results?.[0].expected).toContain('[Reference Error');
    });

    it('handles removeDuplicates with strict order', async () => {
        const code = `
        function removeDuplicates(nums) {
            let k = 0;
            for (let i = 0; i < nums.length; i++) {
                if (i === 0 || nums[i] !== nums[i-1]) {
                    nums[k] = nums[i];
                    k++;
                }
            }
            return k;
        }
        `;
        const testCases = [{ input: 'nums = [1,1,2]', output: '2, nums = [1,2,_]' }];
        vi.mocked(ConstraintValidator.parseInput).mockReturnValue({ nums: [1, 1, 2] });

        const result = await runner.execute(code, testCases);

        expect(result.success).toBe(true);
        expect(result.passed).toBe(true);
    });

    it('handles TypeScript code via transpiler', async () => {
        const code = `
        function solve(x: number): number {
            return x * 2;
        }
        `;
        // Mock transpiler to convert TypeScript types away
        vi.mocked(Transpiler.transpile).mockImplementation((code) =>
            code.replace(/:\s*\w+/g, '')  // Remove type annotations
        );
        const testCases = [{ input: 'x = 5', output: '10' }];
        vi.mocked(ConstraintValidator.parseInput).mockReturnValue({ x: 5 });

        const result = await runner.execute(code, testCases, 'typescript');

        expect(result.success).toBe(true);
        expect(result.passed).toBe(true);
    });

    it('handles test case with existing output keeps it', async () => {
        const code = `
        function add(a, b) {
            return a + b;
        }
        `;
        const referenceCode = `
        function add(a, b) {
            return 999;  // Different from user code
        }
        `;
        // Test case HAS output already - should use that, not reference
        const testCases = [{ input: 'a = 2, b = 3', output: '5' }];
        vi.mocked(ConstraintValidator.parseInput).mockReturnValue({ a: 2, b: 3 });

        const result = await runner.execute(code, testCases, 'javascript', referenceCode);

        expect(result.success).toBe(true);
        expect(result.passed).toBe(true);
        expect(result.results?.[0].expected).toBe('5'); // Uses provided output, not reference
    });

    it('handles constraint validation with valid existing output', async () => {
        const code = `function f() { return 1; }`;
        const testCases = [{ input: 'x = 5', output: '1' }]; // Has output
        const constraints = ['0 <= x <= 10'];

        vi.mocked(ConstraintValidator.parseInput).mockReturnValue({ x: 5 });
        // Even if constraint check would fail, it should be skipped when output exists
        vi.mocked(ConstraintValidator.validate).mockReturnValue({ valid: true, errors: [] });

        const result = await runner.execute(code, testCases, 'javascript', undefined, constraints);

        expect(result.success).toBe(true);
    });
});
