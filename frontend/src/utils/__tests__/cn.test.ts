import { describe, it, expect } from 'vitest';
import { cn } from '../cn';

describe('cn utility', () => {
    it('merges class names correctly', () => {
        const result = cn('flex', 'items-center', 'justify-center');
        expect(result).toBe('flex items-center justify-center');
    });

    it('handles conditional classes', () => {
        const isTrue = true;
        const isFalse = false;
        const result = cn('flex', isTrue && 'items-center', isFalse && 'justify-center');
        expect(result).toBe('flex items-center');
    });

    it('merges tailwind classes (overrides)', () => {
        const result = cn('p-4', 'p-8');
        expect(result).toBe('p-8');
    });

    it('handles arrays and objects', () => {
        const result = cn(['flex', 'items-center'], { 'p-4': true, 'm-4': false });
        expect(result).toBe('flex items-center p-4');
    });
});
