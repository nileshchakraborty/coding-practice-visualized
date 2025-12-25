import { describe, it, expect } from 'vitest';
import { ConstraintValidator } from '../ConstraintValidator';

describe('ConstraintValidator', () => {
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
        const result = ConstraintValidator.validate('[1, 2]', []);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Could not parse input');
    });
});
