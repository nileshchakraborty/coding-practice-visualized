/**
 * Script to enhance animation steps - Batch 4
 * Run: node scripts/enhance-animations-batch4.js
 */

const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../data/solutions.json');

// Enhanced animation steps for best-time-to-buy-and-sell-stock-ii
const enhancedStockII = [
    {
        "step": 1,
        "visual": "prices = [7, 1, 5, 3, 6, 4]",
        "transientMessage": "Greedy: Capture EVERY upward slope",
        "arrayState": [7, 1, 5, 3, 6, 4],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "7 → 1: price dropped",
        "transientMessage": "No profit (would lose money)",
        "arrayState": [7, 1, 5, 3, 6, 4],
        "pointers": [{ "label": "i", "index": 1 }],
        "indices": [0, 1],
        "color": "warning"
    },
    {
        "step": 3,
        "visual": "1 → 5: price went UP!",
        "transientMessage": "Profit += 5-1 = 4 💰",
        "arrayState": [7, 1, 5, 3, 6, 4],
        "pointers": [{ "label": "buy", "index": 1 }, { "label": "sell", "index": 2 }],
        "indices": [1, 2],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "3 → 6: price went UP!",
        "transientMessage": "Profit += 6-3 = 3 💰 (total=7)",
        "arrayState": [7, 1, 5, 3, 6, 4],
        "pointers": [{ "label": "buy", "index": 3 }, { "label": "sell", "index": 4 }],
        "indices": [3, 4],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: 7",
        "transientMessage": "Max profit = 4 + 3 = 7 ✅",
        "arrayState": [7, 1, 5, 3, 6, 4],
        "pointers": [],
        "indices": [1, 2, 3, 4],
        "color": "success"
    }
];

// Enhanced animation steps for jump-game-ii
const enhancedJumpGameII = [
    {
        "step": 1,
        "visual": "nums = [2, 3, 1, 1, 4]",
        "transientMessage": "BFS levels: each jump is a level",
        "arrayState": [2, 3, 1, 1, 4],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Jump 1: Can reach 0+2=2",
        "transientMessage": "Level 1 covers indices [1, 2]",
        "arrayState": [2, 3, 1, 1, 4],
        "pointers": [{ "label": "end", "index": 2 }],
        "indices": [1, 2],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "From level 1: max reach = 1+3=4",
        "transientMessage": "Jump 2 covers up to index 4 (end!) 🎯",
        "arrayState": [2, 3, 1, 1, 4],
        "pointers": [{ "label": "reach", "index": 4 }],
        "indices": [3, 4],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Answer: 2 jumps",
        "transientMessage": "0→1→4 (minimum jumps = 2) ✅",
        "arrayState": [2, 3, 1, 1, 4],
        "pointers": [],
        "indices": [0, 1, 4],
        "color": "success"
    }
];

// Enhanced animation steps for h-index
const enhancedHIndex = [
    {
        "step": 1,
        "visual": "citations = [3, 0, 6, 1, 5]",
        "transientMessage": "Sort descending: [6, 5, 3, 1, 0]",
        "arrayState": [6, 5, 3, 1, 0],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "i=0: 1 paper with ≥6 citations",
        "transientMessage": "6 ≥ 1? Yes. Continue.",
        "arrayState": [6, 5, 3, 1, 0],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "i=1: 2 papers with ≥5 citations",
        "transientMessage": "5 ≥ 2? Yes. Continue.",
        "arrayState": [6, 5, 3, 1, 0],
        "pointers": [{ "label": "i", "index": 1 }],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "i=2: 3 papers with ≥3 citations",
        "transientMessage": "3 ≥ 3? Yes! h-index = 3 🎯",
        "arrayState": [6, 5, 3, 1, 0],
        "pointers": [{ "label": "h", "index": 2 }],
        "indices": [0, 1, 2],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: h-index = 3",
        "transientMessage": "3 papers have at least 3 citations ✅",
        "arrayState": [6, 5, 3, 1, 0],
        "pointers": [],
        "indices": [0, 1, 2],
        "color": "success"
    }
];

// Enhanced animation steps for gas-station
const enhancedGasStation = [
    {
        "step": 1,
        "visual": "gas=[1,2,3,4,5], cost=[3,4,5,1,2]",
        "transientMessage": "net[i] = gas[i] - cost[i]",
        "arrayState": [-2, -2, -2, 3, 3],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Start at 0: tank goes negative",
        "transientMessage": "tank=-2 < 0 → Can't start here",
        "arrayState": [-2, -2, -2, 3, 3],
        "pointers": [{ "label": "start", "index": 0 }],
        "indices": [0],
        "color": "warning"
    },
    {
        "step": 3,
        "visual": "Try starting at index 3",
        "transientMessage": "net[3]=3, net[4]=3 → tank stays positive!",
        "arrayState": [-2, -2, -2, 3, 3],
        "pointers": [{ "label": "start", "index": 3 }],
        "indices": [3, 4],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Complete circuit from 3→4→0→1→2→3",
        "transientMessage": "Total net >= 0 → Solution exists at 3 ✅",
        "arrayState": [-2, -2, -2, 3, 3],
        "pointers": [],
        "indices": [3],
        "color": "success"
    }
];

// Enhanced animation steps for candy
const enhancedCandy = [
    {
        "step": 1,
        "visual": "ratings = [1, 0, 2]",
        "transientMessage": "Everyone gets at least 1 candy",
        "arrayState": [1, 1, 1],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Left pass: higher rating → more candy",
        "transientMessage": "ratings[2] > ratings[1] → candy[2] = 2",
        "arrayState": [1, 1, 2],
        "pointers": [{ "label": "→", "index": 2 }],
        "indices": [1, 2],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Right pass: check from right",
        "transientMessage": "ratings[0] > ratings[1] → candy[0] = 2",
        "arrayState": [2, 1, 2],
        "pointers": [{ "label": "←", "index": 0 }],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Answer: 2 + 1 + 2 = 5",
        "transientMessage": "Minimum candies = 5 ✅",
        "arrayState": [2, 1, 2],
        "pointers": [],
        "indices": [0, 1, 2],
        "color": "success"
    }
];

// Enhanced animation steps for isomorphic-strings
const enhancedIsomorphicStrings = [
    {
        "step": 1,
        "visual": "s = \"egg\", t = \"add\"",
        "transientMessage": "Map each char to corresponding char",
        "arrayState": ["e", "g", "g"],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "e → a",
        "transientMessage": "s2t['e']='a', t2s['a']='e'",
        "arrayState": ["e", "g", "g"],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "g → d",
        "transientMessage": "s2t['g']='d', t2s['d']='g'",
        "arrayState": ["e", "g", "g"],
        "pointers": [{ "label": "i", "index": 1 }],
        "indices": [1],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "g → d (consistent!)",
        "transientMessage": "s2t['g']='d' matches → OK",
        "arrayState": ["e", "g", "g"],
        "pointers": [{ "label": "i", "index": 2 }],
        "indices": [1, 2],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: true",
        "transientMessage": "Mapping is consistent → Isomorphic ✅",
        "arrayState": ["e", "g", "g"],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for word-pattern
const enhancedWordPattern = [
    {
        "step": 1,
        "visual": "pattern=\"abba\", s=\"dog cat cat dog\"",
        "transientMessage": "Split s: [dog, cat, cat, dog]",
        "arrayState": ["dog", "cat", "cat", "dog"],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "a → dog",
        "transientMessage": "Map a↔dog",
        "arrayState": ["dog", "cat", "cat", "dog"],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "b → cat",
        "transientMessage": "Map b↔cat",
        "arrayState": ["dog", "cat", "cat", "dog"],
        "pointers": [{ "label": "i", "index": 1 }],
        "indices": [1],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "b → cat (check), a → dog (check)",
        "transientMessage": "All mappings consistent!",
        "arrayState": ["dog", "cat", "cat", "dog"],
        "pointers": [],
        "indices": [0, 1, 2, 3],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: true",
        "transientMessage": "Pattern matches string ✅",
        "arrayState": ["dog", "cat", "cat", "dog"],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for simplify-path
const enhancedSimplifyPath = [
    {
        "step": 1,
        "visual": "path = \"/home/../usr/./bin\"",
        "transientMessage": "Split by '/': ['home', '..', 'usr', '.', 'bin']",
        "arrayState": ["home", "..", "usr", ".", "bin"],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "'home' → push to stack",
        "transientMessage": "stack = ['home']",
        "arrayState": ["home"],
        "pointers": [{ "label": "top", "index": 0 }],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "'..' → pop from stack",
        "transientMessage": "Go up one level. stack = []",
        "arrayState": [],
        "pointers": [],
        "indices": [],
        "color": "warning"
    },
    {
        "step": 4,
        "visual": "'usr', '.', 'bin'",
        "transientMessage": "stack = ['usr', 'bin'] (skip '.')",
        "arrayState": ["usr", "bin"],
        "pointers": [],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: \"/usr/bin\"",
        "transientMessage": "Join stack with '/' → /usr/bin ✅",
        "arrayState": ["usr", "bin"],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for evaluate-reverse-polish-notation
const enhancedEvalRPN = [
    {
        "step": 1,
        "visual": "tokens = [\"2\",\"1\",\"+\",\"3\",\"*\"]",
        "transientMessage": "Use stack for operands",
        "arrayState": ["2", "1", "+", "3", "*"],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Push 2, Push 1",
        "transientMessage": "stack = [2, 1]",
        "arrayState": ["2", "1", "+", "3", "*"],
        "pointers": [{ "label": "i", "index": 1 }],
        "indices": [0, 1],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "'+': pop 1, pop 2 → 2+1=3",
        "transientMessage": "Push result. stack = [3]",
        "arrayState": ["2", "1", "+", "3", "*"],
        "pointers": [{ "label": "i", "index": 2 }],
        "indices": [2],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Push 3: stack = [3, 3]",
        "transientMessage": "'*': pop 3, pop 3 → 3*3=9",
        "arrayState": ["2", "1", "+", "3", "*"],
        "pointers": [{ "label": "i", "index": 4 }],
        "indices": [3, 4],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: 9",
        "transientMessage": "Final stack = [9] ✅",
        "arrayState": ["2", "1", "+", "3", "*"],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for symmetric-tree
const enhancedSymmetricTree = [
    {
        "step": 1,
        "visual": "    1\n   / \\\n  2   2\n / \\ / \\\n3  4 4  3",
        "transientMessage": "Check if left subtree mirrors right subtree",
        "arrayState": [1, 2, 2, 3, 4, 4, 3],
        "pointers": [{ "label": "L", "index": 1 }, { "label": "R", "index": 2 }],
        "indices": [1, 2],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Compare L.val=2 vs R.val=2",
        "transientMessage": "Values match ✓",
        "arrayState": [1, 2, 2, 3, 4, 4, 3],
        "pointers": [{ "label": "L", "index": 1 }, { "label": "R", "index": 2 }],
        "indices": [1, 2],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Check: L.left vs R.right",
        "transientMessage": "3 == 3 ✓, 4 == 4 ✓",
        "arrayState": [1, 2, 2, 3, 4, 4, 3],
        "pointers": [],
        "indices": [3, 6, 4, 5],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Answer: true",
        "transientMessage": "Tree is symmetric ✅",
        "arrayState": [1, 2, 2, 3, 4, 4, 3],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for binary-tree-level-order-traversal
const enhancedLevelOrder = [
    {
        "step": 1,
        "visual": "    3\n   / \\\n  9  20\n    /  \\\n   15   7",
        "transientMessage": "BFS: Process level by level",
        "arrayState": [3, 9, 20, 15, 7],
        "pointers": [{ "label": "queue", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Level 0: [3]",
        "transientMessage": "Dequeue 3, enqueue 9, 20",
        "arrayState": [3, 9, 20, 15, 7],
        "pointers": [],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Level 1: [9, 20]",
        "transientMessage": "Dequeue 9, 20. Enqueue 15, 7",
        "arrayState": [3, 9, 20, 15, 7],
        "pointers": [],
        "indices": [1, 2],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Level 2: [15, 7]",
        "transientMessage": "Leaf nodes, no more children",
        "arrayState": [3, 9, 20, 15, 7],
        "pointers": [],
        "indices": [3, 4],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: [[3], [9,20], [15,7]]",
        "transientMessage": "Level order traversal complete ✅",
        "arrayState": [3, 9, 20, 15, 7],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for clone-graph
const enhancedCloneGraph = [
    {
        "step": 1,
        "visual": "Node 1 → [2,4], Node 2 → [1,3]...",
        "transientMessage": "BFS/DFS with hashmap to track clones",
        "arrayState": [1, 2, 3, 4],
        "pointers": [{ "label": "curr", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Clone node 1",
        "transientMessage": "visited[1] = clone(1)",
        "arrayState": [1, 2, 3, 4],
        "pointers": [{ "label": "curr", "index": 0 }],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Process neighbors: 2, 4",
        "transientMessage": "Clone 2, clone 4. Connect to clone(1)",
        "arrayState": [1, 2, 3, 4],
        "pointers": [],
        "indices": [0, 1, 3],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Continue BFS until all cloned",
        "transientMessage": "All nodes cloned and connected ✅",
        "arrayState": [1, 2, 3, 4],
        "pointers": [],
        "indices": [0, 1, 2, 3],
        "color": "success"
    }
];

// Main function
function main() {
    console.log('Reading solutions.json...');
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    const updates = [
        { slug: 'best-time-to-buy-and-sell-stock-ii', steps: enhancedStockII },
        { slug: 'jump-game-ii', steps: enhancedJumpGameII },
        { slug: 'h-index', steps: enhancedHIndex },
        { slug: 'gas-station', steps: enhancedGasStation },
        { slug: 'candy', steps: enhancedCandy },
        { slug: 'isomorphic-strings', steps: enhancedIsomorphicStrings },
        { slug: 'word-pattern', steps: enhancedWordPattern },
        { slug: 'simplify-path', steps: enhancedSimplifyPath },
        { slug: 'evaluate-reverse-polish-notation', steps: enhancedEvalRPN },
        { slug: 'symmetric-tree', steps: enhancedSymmetricTree, type: 'tree' },
        { slug: 'binary-tree-level-order-traversal', steps: enhancedLevelOrder, type: 'tree' },
        { slug: 'clone-graph', steps: enhancedCloneGraph, type: 'graph' }
    ];

    let count = 0;
    for (const update of updates) {
        if (data.solutions[update.slug]) {
            data.solutions[update.slug].animationSteps = update.steps;
            if (update.type) {
                data.solutions[update.slug].visualizationType = update.type;
            }
            console.log(`✓ Updated ${update.slug}`);
            count++;
        } else {
            console.log(`✗ Not found: ${update.slug}`);
        }
    }

    // Write back
    console.log('Writing updated solutions.json...');
    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(data, null, 2));
    console.log(`✅ Done! Enhanced animation steps for ${count} solutions.`);
}

main();
