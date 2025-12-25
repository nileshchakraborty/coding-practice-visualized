/**
 * Problem Lists - Curated study plans
 * 
 * Contains Blind 75 and Top Interview 150 lists mapped to their slugs.
 * These are the canonical LeetCode problems for interview prep.
 */

// Blind 75 - Core interview problems
export const BLIND_75: string[] = [
    // Arrays & Hashing (9)
    "two-sum",
    "contains-duplicate",
    "valid-anagram",
    "group-anagrams",
    "top-k-frequent-elements",
    "product-of-array-except-self",
    "longest-consecutive-sequence",
    "encode-and-decode-strings",
    "valid-sudoku",

    // Two Pointers (5)
    "valid-palindrome",
    "3sum",
    "container-with-most-water",
    "two-sum-ii-input-array-is-sorted",
    "trapping-rain-water",

    // Sliding Window (4)
    "longest-substring-without-repeating-characters",
    "longest-repeating-character-replacement",
    "permutation-in-string",
    "minimum-window-substring",

    // Stack (2)
    "valid-parentheses",
    "min-stack",

    // Binary Search (5)
    "binary-search",
    "search-a-2d-matrix",
    "koko-eating-bananas",
    "find-minimum-in-rotated-sorted-array",
    "search-in-rotated-sorted-array",

    // Linked List (6)
    "reverse-linked-list",
    "merge-two-sorted-lists",
    "reorder-list",
    "remove-nth-node-from-end-of-list",
    "linked-list-cycle",
    "merge-k-sorted-lists",

    // Trees (14)
    "invert-binary-tree",
    "maximum-depth-of-binary-tree",
    "same-tree",
    "subtree-of-another-tree",
    "lowest-common-ancestor-of-a-binary-search-tree",
    "binary-tree-level-order-traversal",
    "validate-binary-search-tree",
    "kth-smallest-element-in-a-bst",
    "construct-binary-tree-from-preorder-and-inorder-traversal",
    "binary-tree-maximum-path-sum",
    "serialize-and-deserialize-binary-tree",
    "count-good-nodes-in-binary-tree",
    "binary-tree-right-side-view",
    "diameter-of-binary-tree",

    // Tries (3)
    "implement-trie-prefix-tree",
    "design-add-and-search-words-data-structure",
    "word-search-ii",

    // Heap / Priority Queue (3)
    "kth-largest-element-in-a-stream",
    "kth-largest-element-in-an-array",
    "find-median-from-data-stream",

    // Backtracking (4)
    "subsets",
    "combination-sum",
    "permutations",
    "word-search",

    // Graphs (8)
    "number-of-islands",
    "clone-graph",
    "pacific-atlantic-water-flow",
    "course-schedule",
    "graph-valid-tree",
    "number-of-connected-components-in-an-undirected-graph",
    "rotting-oranges",
    "walls-and-gates",

    // Dynamic Programming (12)
    "climbing-stairs",
    "house-robber",
    "house-robber-ii",
    "longest-palindromic-substring",
    "palindromic-substrings",
    "decode-ways",
    "coin-change",
    "maximum-product-subarray",
    "word-break",
    "longest-increasing-subsequence",
    "partition-equal-subset-sum",
    "unique-paths",

    // Greedy (2)
    "maximum-subarray",
    "jump-game",

    // Intervals (5)
    "insert-interval",
    "merge-intervals",
    "non-overlapping-intervals",
    "meeting-rooms",
    "meeting-rooms-ii",

    // Math & Bit Manipulation (5)
    "single-number",
    "number-of-1-bits",
    "counting-bits",
    "reverse-bits",
    "missing-number",
];

// Top Interview 150 - Extended interview list
export const TOP_150: string[] = [
    // Array / String (30)
    "merge-sorted-array",
    "remove-element",
    "remove-duplicates-from-sorted-array",
    "remove-duplicates-from-sorted-array-ii",
    "majority-element",
    "rotate-array",
    "best-time-to-buy-and-sell-stock",
    "best-time-to-buy-and-sell-stock-ii",
    "jump-game",
    "jump-game-ii",
    "h-index",
    "product-of-array-except-self",
    "gas-station",
    "candy",
    "trapping-rain-water",
    "roman-to-integer",
    "integer-to-roman",
    "length-of-last-word",
    "longest-common-prefix",
    "reverse-words-in-a-string",
    "zigzag-conversion",
    "find-the-index-of-the-first-occurrence-in-a-string",
    "text-justification",
    "valid-palindrome",
    "is-subsequence",
    "two-sum-ii-input-array-is-sorted",
    "container-with-most-water",
    "3sum",
    "two-sum",

    // Two Pointers (6)
    "valid-palindrome",
    "is-subsequence",
    "two-sum-ii-input-array-is-sorted",
    "container-with-most-water",
    "3sum",

    // Sliding Window (4)
    "minimum-size-subarray-sum",
    "longest-substring-without-repeating-characters",
    "substring-with-concatenation-of-all-words",
    "minimum-window-substring",

    // Matrix (5)
    "valid-sudoku",
    "spiral-matrix",
    "rotate-image",
    "set-matrix-zeroes",
    "game-of-life",

    // Hashmap (8)
    "ransom-note",
    "isomorphic-strings",
    "word-pattern",
    "valid-anagram",
    "group-anagrams",
    "two-sum",
    "happy-number",
    "contains-duplicate-ii",
    "longest-consecutive-sequence",

    // Intervals (5)
    "summary-ranges",
    "merge-intervals",
    "insert-interval",
    "minimum-number-of-arrows-to-burst-balloons",

    // Stack (8)
    "valid-parentheses",
    "simplify-path",
    "min-stack",
    "evaluate-reverse-polish-notation",
    "basic-calculator",
    "daily-temperatures",
    "largest-rectangle-in-histogram",

    // Linked List (11)
    "linked-list-cycle",
    "add-two-numbers",
    "merge-two-sorted-lists",
    "copy-list-with-random-pointer",
    "reverse-linked-list-ii",
    "reverse-nodes-in-k-group",
    "remove-nth-node-from-end-of-list",
    "remove-duplicates-from-sorted-list-ii",
    "rotate-list",
    "partition-list",
    "lru-cache",

    // Binary Tree General (14)
    "maximum-depth-of-binary-tree",
    "same-tree",
    "invert-binary-tree",
    "symmetric-tree",
    "construct-binary-tree-from-preorder-and-inorder-traversal",
    "construct-binary-tree-from-inorder-and-postorder-traversal",
    "populating-next-right-pointers-in-each-node-ii",
    "flatten-binary-tree-to-linked-list",
    "path-sum",
    "sum-root-to-leaf-numbers",
    "binary-tree-maximum-path-sum",
    "count-complete-tree-nodes",
    "lowest-common-ancestor-of-a-binary-tree",
    "binary-search-tree-iterator",

    // Binary Tree BFS (4)
    "binary-tree-right-side-view",
    "average-of-levels-in-binary-tree",
    "binary-tree-level-order-traversal",
    "binary-tree-zigzag-level-order-traversal",

    // Binary Search Tree (4)
    "minimum-absolute-difference-in-bst",
    "kth-smallest-element-in-a-bst",
    "validate-binary-search-tree",

    // Graph General (8)
    "number-of-islands",
    "surrounded-regions",
    "clone-graph",
    "evaluate-division",
    "course-schedule",
    "course-schedule-ii",

    // Graph BFS (3)
    "snakes-and-ladders",
    "minimum-genetic-mutation",
    "word-ladder",

    // Trie (3)
    "implement-trie-prefix-tree",
    "design-add-and-search-words-data-structure",
    "word-search-ii",

    // Backtracking (7)
    "letter-combinations-of-a-phone-number",
    "combinations",
    "permutations",
    "combination-sum",
    "n-queens-ii",
    "generate-parentheses",
    "word-search",

    // Divide & Conquer (4)
    "convert-sorted-array-to-binary-search-tree",
    "sort-list",
    "construct-quad-tree",
    "merge-k-sorted-lists",

    // Binary Search (8)
    "search-insert-position",
    "search-a-2d-matrix",
    "find-peak-element",
    "search-in-rotated-sorted-array",
    "find-first-and-last-position-of-element-in-sorted-array",
    "find-minimum-in-rotated-sorted-array",
    "median-of-two-sorted-arrays",

    // Heap / Priority Queue (6)
    "kth-largest-element-in-an-array",
    "ipo",
    "find-k-pairs-with-smallest-sums",
    "find-median-from-data-stream",

    // Bit Manipulation (5)
    "add-binary",
    "reverse-bits",
    "number-of-1-bits",
    "single-number",
    "single-number-ii",
    "bitwise-and-of-numbers-range",

    // Math (8)
    "palindrome-number",
    "plus-one",
    "factorial-trailing-zeroes",
    "sqrtx",
    "powx-n",
    "max-points-on-a-line",

    // 1D DP (10)
    "climbing-stairs",
    "house-robber",
    "word-break",
    "coin-change",
    "longest-increasing-subsequence",

    // Multidimensional DP (6)
    "triangle",
    "minimum-path-sum",
    "unique-paths-ii",
    "longest-common-subsequence",
    "edit-distance",
    "interleaving-string",
    "maximal-square",
];

export type ListFilter = 'all' | 'blind75' | 'top150';

// Helper to check if a slug is in a list
export const isInBlind75 = (slug: string): boolean => BLIND_75.includes(slug);
export const isInTop150 = (slug: string): boolean => TOP_150.includes(slug);

export const getProblemList = (filter: ListFilter): string[] | null => {
    switch (filter) {
        case 'blind75':
            return BLIND_75;
        case 'top150':
            return TOP_150;
        default:
            return null; // null means all problems
    }
};
