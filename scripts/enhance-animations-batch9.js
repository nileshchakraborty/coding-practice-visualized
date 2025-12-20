/**
 * Script to enhance animation steps - Batch 9 (Binary Trees)
 * Run: node scripts/enhance-animations-batch9.js
 */

const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../data/solutions.json');

// Helper to standard BFS indices
// Tree: [5,4,8,11,null,13,4,7,2,null,null,null,1]
// Indices match the array position.

// 1. Path Sum
// Target: 22. Path: 5 -> 4 -> 11 -> 2
const enhancedPathSum = [
    {
        "step": 1,
        "visual": "root = 5, targetSum = 22",
        "transientMessage": "Start DFS at root (5). Rem: 22 - 5 = 17",
        "arrayState": [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1],
        "pointers": [{ "label": "curr", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Go Left: node 4. Rem: 17 - 4 = 13",
        "transientMessage": "Traverse left child",
        "arrayState": [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1],
        "pointers": [{ "label": "curr", "index": 1 }],
        "indices": [0, 1],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "Go Left: node 11. Rem: 13 - 11 = 2",
        "transientMessage": "Traverse left child",
        "arrayState": [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1],
        "pointers": [{ "label": "curr", "index": 3 }],
        "indices": [0, 1, 3],
        "color": "accent"
    },
    {
        "step": 4,
        "visual": "Go Right: node 2. Rem: 2 - 2 = 0",
        "transientMessage": "Leaf node reached! Sum matches!",
        "arrayState": [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1],
        "pointers": [{ "label": "curr", "index": 8 }],
        "indices": [0, 1, 3, 8],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "True",
        "transientMessage": "Path found! ✅",
        "arrayState": [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1],
        "pointers": [],
        "indices": [0, 1, 3, 8],
        "color": "success"
    }
];

// 2. Lowest Common Ancestor (LCA)
// Tree: [3,5,1,6,2,0,8,null,null,7,4]
// p=5, q=1 -> LCA=3
const enhancedLCA = [
    {
        "step": 1,
        "visual": "root=3, p=5, q=1",
        "transientMessage": "Start DFS at root (3)",
        "arrayState": [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4],
        "pointers": [{ "label": "root", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Search Left: 5",
        "transientMessage": "Found p=5! Return 5",
        "arrayState": [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4],
        "pointers": [{ "label": "left", "index": 1 }],
        "indices": [1],
        "color": "warning"
    },
    {
        "step": 3,
        "visual": "Search Right: 1",
        "transientMessage": "Found q=1! Return 1",
        "arrayState": [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4],
        "pointers": [{ "label": "right", "index": 2 }],
        "indices": [2],
        "color": "warning"
    },
    {
        "step": 4,
        "visual": "Back at root (3)",
        "transientMessage": "Left=5, Right=1. Both non-null -> LCA is 3",
        "arrayState": [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4],
        "pointers": [{ "label": "LCA", "index": 0 }],
        "indices": [0],
        "color": "success"
    }
];

// 3. Balanced Binary Tree
// Tree: [3,9,20,null,null,15,7] (Balanced)
const enhancedBalanced = [
    {
        "step": 1,
        "visual": "Check height(3)",
        "transientMessage": "DFS to find heights of subtrees",
        "arrayState": [3, 9, 20, null, null, 15, 7],
        "pointers": [{ "label": "root", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "height(9) = 1",
        "transientMessage": "Left leaf height is 1",
        "arrayState": [3, 9, 20, null, null, 15, 7],
        "pointers": [{ "label": "L", "index": 1 }],
        "indices": [1],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "height(20) -> h(15)=1, h(7)=1. Max=2",
        "transientMessage": "Right subtree height is 2",
        "arrayState": [3, 9, 20, null, null, 15, 7],
        "pointers": [{ "label": "R", "index": 2 }],
        "indices": [2, 5, 6],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "|L - R| = |1 - 2| = 1 <= 1",
        "transientMessage": "Difference <= 1. Tree is Balanced ✅",
        "arrayState": [3, 9, 20, null, null, 15, 7],
        "pointers": [{ "label": "root", "index": 0 }],
        "indices": [0, 1, 2],
        "color": "success"
    }
];

// 4. Subtree of Another Tree
// root=[3,4,5,1,2], subRoot=[4,1,2]
const enhancedSubtree = [
    {
        "step": 1,
        "visual": "Compare root(3) with subRoot(4)",
        "transientMessage": "3 != 4. Check subtrees.",
        "arrayState": [3, 4, 5, 1, 2],
        "pointers": [{ "label": "root", "index": 0 }],
        "indices": [0],
        "color": "warning"
    },
    {
        "step": 2,
        "visual": "Check Left: node 4 matches subRoot 4",
        "transientMessage": "Roots match. Check children...",
        "arrayState": [3, 4, 5, 1, 2],
        "pointers": [{ "label": "sub", "index": 1 }],
        "indices": [1],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "4->1 matches 4->1",
        "transientMessage": "Left child matches",
        "arrayState": [3, 4, 5, 1, 2],
        "pointers": [{ "label": "L", "index": 3 }],
        "indices": [3],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "4->2 matches 4->2",
        "transientMessage": "Right child matches",
        "arrayState": [3, 4, 5, 1, 2],
        "pointers": [{ "label": "R", "index": 4 }],
        "indices": [4],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "All nodes match!",
        "transientMessage": "Subtree found! ✅",
        "arrayState": [3, 4, 5, 1, 2],
        "pointers": [{ "label": "Found", "index": 1 }],
        "indices": [1, 3, 4],
        "color": "success"
    }
];

// 5. Binary Tree Max Path Sum
// Tree: [-10,9,20,null,null,15,7]
const enhancedMaxPathSum = [
    {
        "step": 1,
        "visual": "root = -10",
        "transientMessage": "DFS post-order max gain computation",
        "arrayState": [-10, 9, 20, null, null, 15, 7],
        "pointers": [{ "label": "root", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Left: 9 (Leaf)",
        "transientMessage": "Max gain from left = 9",
        "arrayState": [-10, 9, 20, null, null, 15, 7],
        "pointers": [{ "label": "L", "index": 1 }],
        "indices": [1],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Right: 20 + max(15, 7) = 35",
        "transientMessage": "Max gain from right (20->15) = 35",
        "arrayState": [-10, 9, 20, null, null, 15, 7],
        "pointers": [{ "label": "R", "index": 2 }],
        "indices": [2, 5],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Root Path: 9 + (-10) + 35 = 34",
        "transientMessage": "Update global max to 34 (path 15->20->-10->9)",
        "arrayState": [-10, 9, 20, null, null, 15, 7],
        "pointers": [{ "label": "Max", "index": 0 }],
        "indices": [5, 2, 0, 1],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Return max gain up: -10 + 35 = 25",
        "transientMessage": "Return 25 to parent (if existed)",
        "arrayState": [-10, 9, 20, null, null, 15, 7],
        "pointers": [],
        "indices": [0, 2, 5],
        "color": "accent"
    }
];

function main() {
    console.log('Reading solutions.json...');
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    const updates = [
        { slug: 'path-sum', steps: enhancedPathSum, state: [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1] },
        { slug: 'lowest-common-ancestor-of-a-binary-tree', steps: enhancedLCA, state: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4] },
        { slug: 'balanced-binary-tree', steps: enhancedBalanced, state: [3, 9, 20, null, null, 15, 7] },
        { slug: 'subtree-of-another-tree', steps: enhancedSubtree, state: [3, 4, 5, 1, 2] },
        { slug: 'binary-tree-maximum-path-sum', steps: enhancedMaxPathSum, state: [-10, 9, 20, null, null, 15, 7] }
    ];

    let count = 0;
    for (const update of updates) {
        if (data.solutions[update.slug]) {
            data.solutions[update.slug].animationSteps = update.steps;
            data.solutions[update.slug].initialState = update.state;
            data.solutions[update.slug].visualizationType = 'tree';
            console.log(`✓ Updated ${update.slug}`);
            count++;
        } else {
            console.log(`✗ Not found: ${update.slug}`);
        }
    }

    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(data, null, 2));
    console.log(`✅ Done! Enhanced animation steps for ${count} solutions.`);
}

main();
