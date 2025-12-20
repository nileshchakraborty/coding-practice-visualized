/**
 * Script to enhance animation steps - Batch 11 (Backtracking)
 * Run: node scripts/enhance-animations-batch11.js
 */

const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../data/solutions.json');

// 1. N-Queens (Grid)
const enhancedNQueens = [
    {
        "step": 1,
        "visual": "board (4x4)",
        "transientMessage": "Goal: Place 4 queens such that none attack each other.",
        "arrayState": [
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.']
        ],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Row 0: Place Q at [0,1]",
        "transientMessage": "Try col 1. Valid.",
        "arrayState": [
            ['.', 'Q', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.']
        ],
        "pointers": [{ "label": "Q", "index": [0, 1] }],
        "indices": [[0, 1]],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Row 1: Try [1,3]",
        "transientMessage": "[1,0] attacked by [0,0]? No. [1,2] attacked. [1,3] Safe.",
        "arrayState": [
            ['.', 'Q', '.', '.'],
            ['.', '.', '.', 'Q'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.']
        ],
        "pointers": [{ "label": "Q", "index": [1, 3] }],
        "indices": [[1, 3]],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Row 2: Place Q at [2,0]",
        "transientMessage": "[2,0] Safe.",
        "arrayState": [
            ['.', 'Q', '.', '.'],
            ['.', '.', '.', 'Q'],
            ['Q', '.', '.', '.'],
            ['.', '.', '.', '.']
        ],
        "pointers": [{ "label": "Q", "index": [2, 0] }],
        "indices": [[2, 0]],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Row 3: Place Q at [3,2]",
        "transientMessage": "Full solution found! Backtrack to find others.",
        "arrayState": [
            ['.', 'Q', '.', '.'],
            ['.', '.', '.', 'Q'],
            ['Q', '.', '.', '.'],
            ['.', '.', 'Q', '.']
        ],
        "pointers": [{ "label": "Q", "index": [3, 2] }],
        "indices": [[0, 1], [1, 3], [2, 0], [3, 2]],
        "color": "success"
    },
    {
        "step": 6,
        "visual": "Answer: Unique Configurations",
        "transientMessage": "Found solutions: 2 (for n=4)",
        "arrayState": [],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// 2. Permutations (Array recursion)
const enhancedPermutations = [
    {
        "step": 1,
        "visual": "nums = [1, 2, 3]",
        "transientMessage": "Backtracking: Build all orderings",
        "arrayState": [],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Path: [1]",
        "transientMessage": "Choose 1. Remaining: {2, 3}",
        "arrayState": [1],
        "pointers": [],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Path: [1, 2]",
        "transientMessage": "Choose 2. Remaining: {3}",
        "arrayState": [1, 2],
        "pointers": [],
        "indices": [1],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Path: [1, 2, 3]",
        "transientMessage": "Choose 3. Solution found! Add to result.",
        "arrayState": [1, 2, 3],
        "pointers": [],
        "indices": [2],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Backtrack: [1, 2] -> [1, 3]",
        "transientMessage": "Pop 2, try 3.",
        "arrayState": [1, 3],
        "pointers": [],
        "indices": [1],
        "color": "warning"
    },
    {
        "step": 6,
        "visual": "Answer: [[1,2,3], [1,3,2], ...]",
        "transientMessage": "All 6 permutations generated ✅",
        "arrayState": [1, 2, 3],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// 3. Subsets (Array recursion)
const enhancedSubsets = [
    {
        "step": 1,
        "visual": "nums = [1, 2, 3]",
        "transientMessage": "For each element: Include or Exclude",
        "arrayState": [],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Path: [] (Exclude 1, 2, 3)",
        "transientMessage": "Add [] to result",
        "arrayState": [],
        "pointers": [],
        "indices": [],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Path: [1]",
        "transientMessage": "Include 1. Add [1]",
        "arrayState": [1],
        "pointers": [],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Path: [1, 2]",
        "transientMessage": "Include 2. Add [1, 2]",
        "arrayState": [1, 2],
        "pointers": [],
        "indices": [1],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Path: [1, 2, 3]",
        "transientMessage": "Include 3. Add [1, 2, 3]",
        "arrayState": [1, 2, 3],
        "pointers": [],
        "indices": [2],
        "color": "success"
    },
    {
        "step": 6,
        "visual": "Answer: [[], [1], [2], [1,2], ...]",
        "transientMessage": "2^3 = 8 subsets generated ✅",
        "arrayState": [1, 2, 3],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// 4. Word Search (Grid DFS)
const enhancedWordSearch = [
    {
        "step": 1,
        "visual": "board=[['A','B','C','E'],['S','F','C','S'],['A','D','E','E']], word=\"ABCCED\"",
        "transientMessage": "Scan grid for 'A'",
        "arrayState": [['A', 'B', 'C', 'E'], ['S', 'F', 'C', 'S'], ['A', 'D', 'E', 'E']],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Found 'A' at [0,0]",
        "transientMessage": "Match 'A'. DFS to neighbors for 'B'",
        "arrayState": [['#', 'B', 'C', 'E'], ['S', 'F', 'C', 'S'], ['A', 'D', 'E', 'E']],
        "pointers": [{ "label": "curr", "index": [0, 0] }],
        "indices": [[0, 0]],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Found 'B' at [0,1]",
        "transientMessage": "Match 'B'. DFS for 'C'",
        "arrayState": [['#', '#', 'C', 'E'], ['S', 'F', 'C', 'S'], ['A', 'D', 'E', 'E']],
        "pointers": [{ "label": "curr", "index": [0, 1] }],
        "indices": [[0, 0], [0, 1]],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Match 'C', 'C', 'E', 'D'",
        "transientMessage": "Path found: [0,0]→[0,1]→[0,2]→[1,2]→[2,2]→[2,1]",
        "arrayState": [['#', '#', '#', 'E'], ['S', 'F', '#', 'S'], ['A', '#', '#', 'E']],
        "pointers": [{ "label": "end", "index": [2, 1] }],
        "indices": [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1]],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: true",
        "transientMessage": "Word exists in grid ✅",
        "arrayState": [['A', 'B', 'C', 'E'], ['S', 'F', 'C', 'S'], ['A', 'D', 'E', 'E']],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// 5. Combination Sum
const enhancedCombinationSum = [
    {
        "step": 1,
        "visual": "candidates = [2,3,6,7], target = 7",
        "transientMessage": "Find distinct combinations summing to 7",
        "arrayState": [],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Path: [2]",
        "transientMessage": "Sum=2. target remains 5. Can reuse 2.",
        "arrayState": [2],
        "pointers": [],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Path: [2, 2, 3]",
        "transientMessage": "Sum=7. Valid! Add [2,2,3]",
        "arrayState": [2, 2, 3],
        "pointers": [],
        "indices": [0, 1, 2],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Backtrack. Try 7",
        "transientMessage": "Path: [7]. Sum=7. Valid!",
        "arrayState": [7],
        "pointers": [],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: [[2,2,3], [7]]",
        "transientMessage": "All combinations found ✅",
        "arrayState": [2, 2, 3, 7],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// 6. Generate Parentheses
const enhancedGenerateParentheses = [
    {
        "step": 1,
        "visual": "n = 3",
        "transientMessage": "Open < n, Close < Open",
        "arrayState": [],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Path: \"(((\"",
        "transientMessage": "Max open reached. Must close.",
        "arrayState": ["(", "(", "("],
        "pointers": [],
        "indices": [0, 1, 2],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Path: \"((()))\"",
        "transientMessage": "Valid! Add to result.",
        "arrayState": ["(", "(", "(", ")", ")", ")"],
        "pointers": [],
        "indices": [0, 1, 2, 3, 4, 5],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Backtrack: \"(()\"",
        "transientMessage": "Try closing earlier: \"(())\"",
        "arrayState": ["(", "(", ")"],
        "pointers": [],
        "indices": [0, 1, 2],
        "color": "warning"
    },
    {
        "step": 5,
        "visual": "Answer: [\"((()))\", \"(()())\", ...]",
        "transientMessage": "5 valid strings generated ✅",
        "arrayState": ["(", "(", ")", "(", ")", ")"],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// 7. Letter Combinations
const enhancedLetterCombinations = [
    {
        "step": 1,
        "visual": "digits = \"23\"",
        "transientMessage": "2: 'abc', 3: 'def'",
        "arrayState": [],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Fix 'a' from '2'",
        "transientMessage": "Next digit '3' -> 'd', 'e', 'f'",
        "arrayState": ["a"],
        "pointers": [],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Append 'd' -> \"ad\"",
        "transientMessage": "Valid. Add.",
        "arrayState": ["a", "d"],
        "pointers": [],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Append 'e' -> \"ae\"",
        "transientMessage": "Valid. Add.",
        "arrayState": ["a", "e"],
        "pointers": [],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: [\"ad\",\"ae\",\"af\",\"bd\"...]",
        "transientMessage": "All 9 combinations generated ✅",
        "arrayState": ["a", "d", "a", "e"],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

function main() {
    console.log('Reading solutions.json...');
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    const updates = [
        { slug: 'n-queens', steps: enhancedNQueens, type: 'grid', initialState: enhancedNQueens[0].arrayState },
        { slug: 'permutations', steps: enhancedPermutations, type: 'array' },
        { slug: 'subsets', steps: enhancedSubsets, type: 'array' },
        { slug: 'word-search', steps: enhancedWordSearch, type: 'grid', initialState: enhancedWordSearch[0].arrayState },
        { slug: 'combination-sum', steps: enhancedCombinationSum, type: 'array' },
        { slug: 'generate-parentheses', steps: enhancedGenerateParentheses, type: 'array' }, // visualizing as array of chars
        { slug: 'letter-combinations-of-a-phone-number', steps: enhancedLetterCombinations, type: 'array' }
    ];

    let count = 0;
    for (const update of updates) {
        if (data.solutions[update.slug]) {
            data.solutions[update.slug].animationSteps = update.steps;
            if (update.type) {
                data.solutions[update.slug].visualizationType = update.type;
            }
            if (update.initialState) {
                data.solutions[update.slug].initialState = update.initialState;
            }
            console.log(`✓ Updated ${update.slug}`);
            count++;
        } else {
            console.log(`✗ Not found: ${update.slug}`);
        }
    }

    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(data, null, 2));
    console.log(`✅ Done! Enhanced animation steps for ${count} Backtracking solutions.`);
}

main();
