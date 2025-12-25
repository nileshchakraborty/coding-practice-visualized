import { describe, it, expect } from 'vitest';
import { ComplexityAnalyzer } from '../ComplexityAnalyzer';

describe('ComplexityAnalyzer', () => {
    it('analyzes O(n^2) nested loops', () => {
        const code = `
for i in range(len(nums)):
    for j in range(i+1, len(nums)):
        if nums[i] + nums[j] == target:
            return [i, j]
`;
        const result = ComplexityAnalyzer.analyze(code);
        expect(result.time).toBe('O(n^2)');
        expect(result.explanation).toContain('Nested loops detected');
    });

    it('analyzes O(n) single loop', () => {
        const code = `
for (let i = 0; i < n; i++) {
    console.log(i);
}
`;
        const result = ComplexityAnalyzer.analyze(code);
        expect(result.time).toBe('O(n)');
        expect(result.explanation).toContain('Single loop detected');
    });

    it('analyzes O(n^3) triple loop', () => {
        const code = `
for i in range(n):
    for j in range(n):
        for k in range(n):
            pass
`;
        const result = ComplexityAnalyzer.analyze(code);
        expect(result.time).toBe('O(n^3)');
        expect(result.explanation).toContain('Deeply nested loops detected');
    });

    it('analyzes O(log n) patterns', () => {
        const code = `
while (i < n) {
    i *= 2;
}
`;
        const result = ComplexityAnalyzer.analyze(code);
        expect(result.time).toBe('O(log n)');
        expect(result.explanation).toContain('Loop with multiplicative/divisive step');
    });

    it('analyzes O(n log n) sorting', () => {
        const code = `
nums.sort((a,b) => a-b);
return nums;
`;
        const result = ComplexityAnalyzer.analyze(code);
        expect(result.time).toBe('O(n log n)');
        expect(result.explanation).toContain('Sorting detected (typically O(n log n))');
    });

    it('analyzes Space O(n)', () => {
        const code = `
const map = {};
const arr = new Array(n);
`;
        const result = ComplexityAnalyzer.analyze(code);
        expect(result.space).toBe('O(n)');
        expect(result.explanation).toContain('Collection initialization detected (O(n) space)');
    });

    it('analyzes Space O(n) with nested loop', () => {
        const code = `
for (let i=0; i<n; i++) {
    for (let j=0; j<n; j++) {
        let x = [];
    }
}
`;
        const result = ComplexityAnalyzer.analyze(code);
        expect(result.space).toBe('O(n)');
    });

    it('handles empty code or comments', () => {
        const code = `
// Just a comment
# Another comment

`;
        const result = ComplexityAnalyzer.analyze(code);
        expect(result.time).toBe('O(1)');
        expect(result.explanation).toContain('No significant loops or sorting detected');
    });

    it('handles log pattern keywords', () => {
        const code = `
while (x > 0) {
    x >>= 1;
}
`;
        const result = ComplexityAnalyzer.analyze(code);
        expect(result.time).toBe('O(log n)');
    });
});
