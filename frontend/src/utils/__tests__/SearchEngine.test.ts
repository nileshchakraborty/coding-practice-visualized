import { describe, it, expect } from 'vitest';
import { SearchEngine } from '../SearchEngine';

interface TestItem {
    id: string;
    title: string;
    tags: string[];
}

const items: TestItem[] = [
    { id: '1', title: 'Two Sum', tags: ['array', 'hash-table'] },
    { id: '2', title: 'N-Queens II', tags: ['backtracking'] },
    { id: '3', title: 'Valid Anagram', tags: ['string'] },
    { id: '4', title: 'Group Anagrams', tags: ['string', 'hash-table'] },
];

describe('SearchEngine', () => {
    const engine = new SearchEngine(items, (item) => [item.title, ...item.tags]);

    it('returns empty array for empty query', () => {
        expect(engine.search('')).toEqual([]);
        expect(engine.search(null as unknown as string)).toEqual([]);
    });

    it('finds exact matches (case insensitive)', () => {
        const results = engine.search('two sum');
        expect(results).toHaveLength(1);
        expect(results[0].title).toBe('Two Sum');
    });

    it('finds items by token prefix', () => {
        // "Que" -> "N-Queens II"
        const results = engine.search('Que');
        expect(results).toHaveLength(1);
        expect(results[0].title).toBe('N-Queens II');
    });

    it('finds items by normalized string (fuzzyish)', () => {
        // "nqueens" -> "N-Queens II"
        const results = engine.search('nqueens');
        expect(results).toHaveLength(1);
        expect(results[0].title).toBe('N-Queens II');
    });

    it('finds items by tag', () => {
        const results = engine.search('hash'); // hash-table
        expect(results).toHaveLength(2); // Two Sum, Group Anagrams
        const titles = results.map(r => r.title);
        expect(titles).toContain('Two Sum');
        expect(titles).toContain('Group Anagrams');
    });

    it('uses cache for subsequent searches', () => {
        // First search
        const res1 = engine.search('anagram');
        expect(res1).toHaveLength(2); // Valid Anagram, Group Anagrams

        // Second search (should hit cache)
        const res2 = engine.search('anagram');
        expect(res2).toEqual(res1);
        expect(res2).toBe(res1); // Reference equality if cached array is returned
    });

    it('handles special characters', () => {
        // "N-Queens" has hyphen.
        // Search "n-queens" -> normalize to "nqueens" -> Match full string?
        // Or token "n"?
        const results = engine.search('n-queens');
        expect(results).toHaveLength(1);
        expect(results[0].title).toBe('N-Queens II');
    });

    it('returns empty array for no matches', () => {
        expect(engine.search('xyz123')).toEqual([]);
    });

    it('handles initialization with single string getter', () => {
        const simpleEngine = new SearchEngine(items, (item) => item.title);
        expect(simpleEngine.search('array')).toHaveLength(0); // Tags not indexed
        expect(simpleEngine.search('Two')).toHaveLength(1);
    });
});
