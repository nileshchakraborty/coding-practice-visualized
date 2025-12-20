/**
 * SearchEngine.ts
 * Implements a Trie-based search with caching for efficient recommendations.
 * Supports fuzzy matching (normalization) and token prefix search.
 */

class TrieNode<T> {
    children: Map<string, TrieNode<T>> = new Map();
    items: Set<T> = new Set(); // Stores items matching this prefix path
}

export class SearchEngine<T> {
    private root: TrieNode<T> = new TrieNode();
    private cache: Map<string, T[]> = new Map();

    constructor(items: T[], getSearchableText: (item: T) => string) {
        items.forEach(item => this.insert(item, getSearchableText(item)));
    }

    /**
     * Normalize text: lowercase, remove non-alphanumeric.
     * "N-Queens II" -> "nqueensii"
     */
    private normalize(text: string): string {
        return text.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    /**
     * Tokenize text: split by spaces, hyphens, etc.
     * "N-Queens II" -> ["n", "queens", "ii"]
     */
    private tokenize(text: string): string[] {
        return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    }

    private insert(item: T, text: string) {
        // 1. Insert full normalized string (for fuzzy match like "nqueens")
        this.insertToken(item, this.normalize(text));

        // 2. Insert each token (for word prefix match like "queens")
        const tokens = this.tokenize(text);
        tokens.forEach(token => this.insertToken(item, token));
    }

    private insertToken(item: T, token: string) {
        let node = this.root;
        for (const char of token) {
            if (!node.children.has(char)) {
                node.children.set(char, new TrieNode());
            }
            node = node.children.get(char)!;
            node.items.add(item); // Add item to every node in path (Prefix match)
        }
    }

    public search(query: string): T[] {
        if (!query) return [];

        // Check Cache
        const cacheKey = query.trim().toLowerCase();
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        // 1. Try Normalized Search (handles "N-Queen" -> "nqueen")
        const normQuery = this.normalize(query);
        const normResults = this.searchPrefix(normQuery);

        // 2. If no results, try Token search (handles "Queens" -> "queen") -- Optional
        // Actually, user just wants "N-Queen" to match "N Queens".
        // "nqueen" prefix of "nqueens" works via normal search.
        // Normalized search is usually sufficient if we inserted tokens.

        // But wait, if user types "Queens", query is "queens".
        // We inserted "queens" token. So `searchPrefix("queens")` will find it.
        // So simple normalized search on the Trie is enough!

        // De-duplicate results (same item might be matched by multiple tokens)
        // Actually searchPrefix returns a Set (converted to array).
        // If I use Set<T> in node, uniqueness is guaranteed per path.
        // But if "n" matches and "queens" matches, do we intersect?
        // No, standard search is usually "matches ANY token prefix" OR "matches full string".
        // For a single query string, we treat it as a single prefix?
        // User types "N Qu". Norm -> "nqu". Token "n" match? "nqu" match?
        // "N Queens" -> inserted "nqueens". "nqu" matches "nqueens".
        // So Normalized Search covers it.

        const results = Array.from(normResults);

        // Update Cache
        this.cache.set(cacheKey, results);

        return results;
    }

    private searchPrefix(prefix: string): Set<T> {
        let node = this.root;
        for (const char of prefix) {
            if (!node.children.has(char)) {
                return new Set(); // No match
            }
            node = node.children.get(char)!;
        }
        return node.items;
    }
}
