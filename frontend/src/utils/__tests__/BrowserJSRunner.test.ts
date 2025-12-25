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
});
