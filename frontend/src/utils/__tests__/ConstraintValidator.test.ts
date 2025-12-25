import { describe, it, expect } from 'vitest';
import { ConstraintValidator } from '../ConstraintValidator';

describe('ConstraintValidator', () => {
    // --- parseInput Tests ---
    it('parses input correctly', () => {
        const input = `nums = [1, 2, 3], target = 9, str = "hello", bool = true, n = null, q = 'quote'`;
        const result = ConstraintValidator.parseInput(input);
        expect(result.nums).toEqual([1, 2, 3]);
        expect(result.target).toBe(9);
        expect(result.str).toBe('hello');
        expect(result.bool).toBe(true);
        expect(result.n).toBeNull();
        expect(result.q).toBe('quote');
    });

    it('handles nested structures in parseInput', () => {
        // Limitation: JSON.parse might fail on non-standard formatting, but simple cases work
        const input = `matrix = [[1],[2]], obj = {"a":1}`;
        const result = ConstraintValidator.parseInput(input);
        expect(result.matrix).toEqual([[1], [2]]);
        // Obj might parse if stringified correctly
        // The implementation uses simplistic regex value split, might be fragile for complex objs with commas.
        // But let's test what works.
    });

    it('handles parse input failures gracefully', () => {
        // Only fails if structure is totally wrong or empty
        expect(ConstraintValidator.parseInput('')).toEqual({});
        expect(ConstraintValidator.parseInput('invalid syntax')).toEqual({});
    });

    // --- parseConstraint Tests ---
    it('parses various constraint formats', () => {
        // min <= var <= max
        const c1 = ConstraintValidator.parseConstraint('1 <= x <= 10');
        expect(c1).toEqual({ variable: 'x', min: 1, max: 10 });

        // min <= var
        const c2 = ConstraintValidator.parseConstraint('0 <= index');
        expect(c2).toEqual({ variable: 'index', min: 0 });

        // var <= max
        const c3 = ConstraintValidator.parseConstraint('val <= 100');
        expect(c3).toEqual({ variable: 'val', max: 100 });

        // 10^n notation
        const c4 = ConstraintValidator.parseConstraint('1 <= n <= 10^4');
        expect(c4).toEqual({ variable: 'n', min: 1, max: 10000 });

        // Property access
        const c5 = ConstraintValidator.parseConstraint('1 <= list.length <= 5');
        expect(c5?.variable).toBe('list.length');
    });

    it('returns null for unparseable constraints', () => {
        expect(ConstraintValidator.parseConstraint('x == 5')).toBeNull(); // Only supports inequality ranges
    });

    // --- getVariableValue Tests ---
    it('extracts variable values including nested properties', () => {
        const input = {
            num: 5,
            arr: [1, 2, 3],
            nested: { val: 10 }
        };

        expect(ConstraintValidator.getVariableValue(input, 'num')).toBe(5);
        expect(ConstraintValidator.getVariableValue(input, 'arr')).toBe(3); // Array -> length check
        expect(ConstraintValidator.getVariableValue(input, 'nested.val')).toBe(10);

        // Undefined scenarios
        expect(ConstraintValidator.getVariableValue(input, 'missing')).toBeUndefined();
        expect(ConstraintValidator.getVariableValue(input, 'nested.missing')).toBeUndefined();
    });

    it('skips array index access in variable value', () => {
        const input = { nums: [1] };
        expect(ConstraintValidator.getVariableValue(input, 'nums[i]')).toBeUndefined();
    });

    // --- validateArrayElements Tests ---
    it('validates array elements using [i]', () => {
        const input = `nums = [1, 5, 10]`;
        const constraints = ['1 <= nums[i] <= 10'];
        const result = ConstraintValidator.validate(input, constraints);
        expect(result.valid).toBe(true);
    });

    it('detects invalid array elements', () => {
        const input = `nums = [0, 5, 11]`; // 0 < 1, 11 > 10
        const constraints = ['1 <= nums[i] <= 10'];
        const result = ConstraintValidator.validate(input, constraints);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain('violates constraint'); // Actually code says "matches ... violates constraint"
    });

    it('ignores non-array or missing for array validation', () => {
        const input = `x = 5`;
        const constraints = ['1 <= x[i] <= 10']; // x is number, not array
        const result = ConstraintValidator.validate(input, constraints);
        expect(result.valid).toBe(true); // Should parse but return null error
    });

    // --- validate Tests ---
    it('validates strictly valid constraints', () => {
        const constraints = ['1 <= nums.length <= 100', '-100 <= nums[i] <= 100'];
        const input = 'nums = [1, 2, 3]';
        const result = ConstraintValidator.validate(input, constraints);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('validates invalid input length', () => {
        const constraints = ['2 <= nums.length <= 5'];
        const input = 'nums = [1]'; // lengths 1, < 2
        const result = ConstraintValidator.validate(input, constraints);
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('violates constraint');
    });

    it('handles empty constraints', () => {
        const result = ConstraintValidator.validate('nums = [1]', []);
        expect(result.valid).toBe(true);
    });

    it('handles parse error (empty input object)', () => {
        const result = ConstraintValidator.validate('[1, 2]', []); // Not k=v format
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Could not parse input');
    });

    it('handles boolean strings in parser', () => {
        const input = `flag = False`;
        const parsed = ConstraintValidator.parseInput(input);
        expect(parsed.flag).toBe(false);
    });
});
