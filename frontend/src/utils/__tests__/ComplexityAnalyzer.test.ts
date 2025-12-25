import { describe, it, expect } from 'vitest';
import { ComplexityAnalyzer } from '../ComplexityAnalyzer';

describe('ComplexityAnalyzer', () => {
    it('analyzes complexity', () => {
        const code = `
        def twoSum(nums, target):
            for i in range(len(nums)):
                for j in range(i+1, len(nums)):
                    if nums[i] + nums[j] == target:
                        return [i, j]
        `;
        const result = ComplexityAnalyzer.analyze(code);
        expect(result).toHaveProperty('time');
        expect(result).toHaveProperty('space');
        expect(result).toHaveProperty('explanation');
    });

    it('handles empty code', () => {
        const result = ComplexityAnalyzer.analyze('');
        expect(result.time).toBe('O(1)');
    });
});
