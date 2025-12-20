/**
 * Script to enhance animation steps - Batch 3
 * Run: node scripts/enhance-animations-batch3.js
 */

const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../data/solutions.json');

// Enhanced animation steps for rotate-array
const enhancedRotateArray = [
    {
        "step": 1,
        "visual": "nums = [1,2,3,4,5,6,7], k = 3",
        "transientMessage": "Strategy: Reverse all, reverse first k, reverse rest",
        "arrayState": [1, 2, 3, 4, 5, 6, 7],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Step 1: Reverse ALL",
        "transientMessage": "[1,2,3,4,5,6,7] → [7,6,5,4,3,2,1]",
        "arrayState": [7, 6, 5, 4, 3, 2, 1],
        "pointers": [{ "label": "L", "index": 0 }, { "label": "R", "index": 6 }],
        "indices": [0, 1, 2, 3, 4, 5, 6],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Step 2: Reverse first k=3",
        "transientMessage": "[7,6,5] → [5,6,7]",
        "arrayState": [5, 6, 7, 4, 3, 2, 1],
        "pointers": [{ "label": "L", "index": 0 }, { "label": "R", "index": 2 }],
        "indices": [0, 1, 2],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Step 3: Reverse remaining",
        "transientMessage": "[4,3,2,1] → [1,2,3,4]",
        "arrayState": [5, 6, 7, 1, 2, 3, 4],
        "pointers": [{ "label": "L", "index": 3 }, { "label": "R", "index": 6 }],
        "indices": [3, 4, 5, 6],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Result: [5,6,7,1,2,3,4]",
        "transientMessage": "Array rotated right by 3 positions ✅",
        "arrayState": [5, 6, 7, 1, 2, 3, 4],
        "pointers": [],
        "indices": [0, 1, 2, 3, 4, 5, 6],
        "color": "success"
    }
];

// Enhanced animation steps for product-of-array-except-self
const enhancedProductExceptSelf = [
    {
        "step": 1,
        "visual": "nums = [1, 2, 3, 4]",
        "transientMessage": "Build prefix products, then suffix products",
        "arrayState": [1, 2, 3, 4],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Prefix pass (left products)",
        "transientMessage": "answer = [1, 1, 2, 6] (product of all to the left)",
        "arrayState": [1, 1, 2, 6],
        "pointers": [{ "label": "→", "index": 3 }],
        "indices": [0, 1, 2, 3],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Suffix pass (right products)",
        "transientMessage": "Multiply by right: [24, 12, 8, 6]",
        "arrayState": [24, 12, 8, 6],
        "pointers": [{ "label": "←", "index": 0 }],
        "indices": [0, 1, 2, 3],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Result: [24, 12, 8, 6]",
        "transientMessage": "Each element is product of all others ✅",
        "arrayState": [24, 12, 8, 6],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for trapping-rain-water
const enhancedTrappingRainWater = [
    {
        "step": 1,
        "visual": "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
        "transientMessage": "Two pointers: left=0, right=11",
        "arrayState": [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1],
        "pointers": [{ "label": "L", "index": 0 }, { "label": "R", "index": 11 }],
        "indices": [0, 11],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Track leftMax and rightMax",
        "transientMessage": "leftMax=0, rightMax=1. Process smaller side.",
        "arrayState": [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1],
        "pointers": [{ "label": "L", "index": 0 }, { "label": "R", "index": 11 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "At index 2: height=0, leftMax=1",
        "transientMessage": "Water trapped = 1-0 = 1 unit",
        "arrayState": [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1],
        "pointers": [{ "label": "L", "index": 2 }],
        "indices": [2],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "At index 5: height=0, leftMax=2",
        "transientMessage": "Water trapped = 2-0 = 2 units",
        "arrayState": [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1],
        "pointers": [{ "label": "L", "index": 5 }],
        "indices": [5],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Total water = 6 units",
        "transientMessage": "Sum all trapped water between bars ✅",
        "arrayState": [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1],
        "pointers": [],
        "indices": [2, 4, 5, 6, 9],
        "color": "success"
    }
];

// Enhanced animation steps for merge-two-sorted-lists
const enhancedMergeTwoSortedLists = [
    {
        "step": 1,
        "visual": "list1: 1→2→4, list2: 1→3→4",
        "transientMessage": "Create dummy head, compare first elements",
        "arrayState": [1, 2, 4, 1, 3, 4],
        "pointers": [{ "label": "p1", "index": 0 }, { "label": "p2", "index": 3 }],
        "indices": [0, 3],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "1 vs 1 → pick list1's 1",
        "transientMessage": "result: 1→, move p1",
        "arrayState": [1, 2, 4, 1, 3, 4],
        "pointers": [{ "label": "p1", "index": 1 }, { "label": "p2", "index": 3 }],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "2 vs 1 → pick list2's 1",
        "transientMessage": "result: 1→1→, move p2",
        "arrayState": [1, 2, 4, 1, 3, 4],
        "pointers": [{ "label": "p1", "index": 1 }, { "label": "p2", "index": 4 }],
        "indices": [3],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "2 vs 3 → pick 2",
        "transientMessage": "result: 1→1→2→, move p1",
        "arrayState": [1, 2, 4, 1, 3, 4],
        "pointers": [{ "label": "p1", "index": 2 }, { "label": "p2", "index": 4 }],
        "indices": [1],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Continue merging...",
        "transientMessage": "result: 1→1→2→3→4→4",
        "arrayState": [1, 1, 2, 3, 4, 4],
        "pointers": [],
        "indices": [0, 1, 2, 3, 4, 5],
        "color": "success"
    }
];

// Enhanced animation steps for add-two-numbers (linked list)
const enhancedAddTwoNumbers = [
    {
        "step": 1,
        "visual": "l1: 2→4→3, l2: 5→6→4",
        "transientMessage": "Add digits: 2+5=7, carry=0",
        "arrayState": [2, 4, 3, 5, 6, 4],
        "pointers": [{ "label": "p1", "index": 0 }, { "label": "p2", "index": 3 }],
        "indices": [0, 3],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "4+6=10 → digit=0, carry=1",
        "transientMessage": "result: 7→0→...",
        "arrayState": [2, 4, 3, 5, 6, 4],
        "pointers": [{ "label": "p1", "index": 1 }, { "label": "p2", "index": 4 }],
        "indices": [1, 4],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "3+4+1(carry)=8",
        "transientMessage": "result: 7→0→8",
        "arrayState": [2, 4, 3, 5, 6, 4],
        "pointers": [{ "label": "p1", "index": 2 }, { "label": "p2", "index": 5 }],
        "indices": [2, 5],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Result: 7→0→8 (= 807)",
        "transientMessage": "342 + 465 = 807 ✅",
        "arrayState": [7, 0, 8],
        "pointers": [],
        "indices": [0, 1, 2],
        "color": "success"
    }
];

// Enhanced animation steps for same-tree
const enhancedSameTree = [
    {
        "step": 1,
        "visual": "p: [1,2,3], q: [1,2,3]",
        "transientMessage": "Compare roots: 1 == 1 ✓",
        "arrayState": [1, 2, 3],
        "pointers": [{ "label": "p", "index": 0 }, { "label": "q", "index": 0 }],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 2,
        "visual": "Compare left children: 2 == 2 ✓",
        "transientMessage": "Recurse on left subtrees",
        "arrayState": [1, 2, 3],
        "pointers": [{ "label": "p", "index": 1 }, { "label": "q", "index": 1 }],
        "indices": [1],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Compare right children: 3 == 3 ✓",
        "transientMessage": "Recurse on right subtrees",
        "arrayState": [1, 2, 3],
        "pointers": [{ "label": "p", "index": 2 }, { "label": "q", "index": 2 }],
        "indices": [2],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "All nodes match!",
        "transientMessage": "Trees are identical → true ✅",
        "arrayState": [1, 2, 3],
        "pointers": [],
        "indices": [0, 1, 2],
        "color": "success"
    }
];

// Enhanced animation steps for maximum-depth-of-binary-tree
const enhancedMaxDepthBinaryTree = [
    {
        "step": 1,
        "visual": "    3\n   / \\\n  9  20\n    /  \\\n   15   7",
        "transientMessage": "DFS from root, track depth",
        "arrayState": [3, 9, 20, null, null, 15, 7],
        "pointers": [{ "label": "node", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "At node 9: depth=2, no children",
        "transientMessage": "Left subtree max depth = 2",
        "arrayState": [3, 9, 20, null, null, 15, 7],
        "pointers": [{ "label": "node", "index": 1 }],
        "indices": [1],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "At node 20: go deeper",
        "transientMessage": "Check children 15 and 7 at depth 3",
        "arrayState": [3, 9, 20, null, null, 15, 7],
        "pointers": [{ "label": "node", "index": 2 }],
        "indices": [2, 5, 6],
        "color": "accent"
    },
    {
        "step": 4,
        "visual": "Right subtree max depth = 3",
        "transientMessage": "max(left=2, right=3) + 1 = 3",
        "arrayState": [3, 9, 20, null, null, 15, 7],
        "pointers": [],
        "indices": [0, 2, 5, 6],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: 3",
        "transientMessage": "Maximum depth is 3 ✅",
        "arrayState": [3, 9, 20, null, null, 15, 7],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for min-stack
const enhancedMinStack = [
    {
        "step": 1,
        "visual": "Operations: push(-2), push(0), push(-3)",
        "transientMessage": "Use two stacks: main and minStack",
        "arrayState": [],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "push(-2)",
        "transientMessage": "main=[-2], min=[-2]",
        "arrayState": [-2],
        "pointers": [{ "label": "min", "index": 0 }],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "push(0)",
        "transientMessage": "main=[-2,0], min=[-2,-2] (0 > -2)",
        "arrayState": [-2, 0],
        "pointers": [{ "label": "min", "index": 0 }],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "push(-3)",
        "transientMessage": "main=[-2,0,-3], min=[-2,-2,-3] (new min!)",
        "arrayState": [-2, 0, -3],
        "pointers": [{ "label": "min", "index": 2 }],
        "indices": [2],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "getMin() → -3",
        "transientMessage": "Current minimum is -3 ✅",
        "arrayState": [-2, 0, -3],
        "pointers": [{ "label": "min", "index": 2 }],
        "indices": [2],
        "color": "success"
    },
    {
        "step": 6,
        "visual": "pop(), getMin() → -2",
        "transientMessage": "After pop: min=[-2,-2], getMin()=-2 ✅",
        "arrayState": [-2, 0],
        "pointers": [{ "label": "min", "index": 0 }],
        "indices": [0],
        "color": "success"
    }
];

// Enhanced animation steps for jump-game
const enhancedJumpGame = [
    {
        "step": 1,
        "visual": "nums = [2, 3, 1, 1, 4]",
        "transientMessage": "Track furthest reachable index",
        "arrayState": [2, 3, 1, 1, 4],
        "pointers": [{ "label": "i", "index": 0 }, { "label": "reach", "index": 2 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "i=0: can reach 0+2=2",
        "transientMessage": "maxReach = max(0, 0+2) = 2",
        "arrayState": [2, 3, 1, 1, 4],
        "pointers": [{ "label": "i", "index": 0 }, { "label": "reach", "index": 2 }],
        "indices": [0, 1, 2],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "i=1: can reach 1+3=4",
        "transientMessage": "maxReach = max(2, 1+3) = 4 (end!) 🎯",
        "arrayState": [2, 3, 1, 1, 4],
        "pointers": [{ "label": "i", "index": 1 }, { "label": "reach", "index": 4 }],
        "indices": [1, 4],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Answer: true",
        "transientMessage": "Can reach index 4 (last) ✅",
        "arrayState": [2, 3, 1, 1, 4],
        "pointers": [],
        "indices": [0, 1, 4],
        "color": "success"
    }
];

// Enhanced animation steps for ransom-note
const enhancedRansomNote = [
    {
        "step": 1,
        "visual": "ransomNote=\"a\", magazine=\"b\"",
        "transientMessage": "Count chars in magazine: {b: 1}",
        "arrayState": ["a", "b"],
        "pointers": [{ "label": "note", "index": 0 }],
        "indices": [1],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Need 'a' from magazine",
        "transientMessage": "'a' not in magazine → false",
        "arrayState": ["a", "b"],
        "pointers": [{ "label": "need", "index": 0 }],
        "indices": [0],
        "color": "warning"
    },
    {
        "step": 3,
        "visual": "Answer: false",
        "transientMessage": "Cannot construct ransom note ✅",
        "arrayState": ["a", "b"],
        "pointers": [],
        "indices": [],
        "color": "warning"
    }
];

// Enhanced animation steps for happy-number
const enhancedHappyNumber = [
    {
        "step": 1,
        "visual": "n = 19",
        "transientMessage": "Sum of squares: 1² + 9² = 1 + 81 = 82",
        "arrayState": [19],
        "pointers": [{ "label": "n", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "n = 82",
        "transientMessage": "8² + 2² = 64 + 4 = 68",
        "arrayState": [19, 82],
        "pointers": [{ "label": "n", "index": 1 }],
        "indices": [1],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "n = 68 → 100 → ...",
        "transientMessage": "68→100→1 🎯",
        "arrayState": [19, 82, 68, 100, 1],
        "pointers": [{ "label": "n", "index": 4 }],
        "indices": [2, 3, 4],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "n = 1",
        "transientMessage": "Reached 1 → Happy Number! ✅",
        "arrayState": [19, 82, 68, 100, 1],
        "pointers": [],
        "indices": [4],
        "color": "success"
    }
];

// Main function
function main() {
    console.log('Reading solutions.json...');
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    const updates = [
        { slug: 'rotate-array', steps: enhancedRotateArray },
        { slug: 'product-of-array-except-self', steps: enhancedProductExceptSelf },
        { slug: 'trapping-rain-water', steps: enhancedTrappingRainWater },
        { slug: 'merge-two-sorted-lists', steps: enhancedMergeTwoSortedLists },
        { slug: 'add-two-numbers', steps: enhancedAddTwoNumbers },
        { slug: 'same-tree', steps: enhancedSameTree, type: 'tree' },
        { slug: 'maximum-depth-of-binary-tree', steps: enhancedMaxDepthBinaryTree, type: 'tree' },
        { slug: 'min-stack', steps: enhancedMinStack },
        { slug: 'jump-game', steps: enhancedJumpGame },
        { slug: 'ransom-note', steps: enhancedRansomNote },
        { slug: 'happy-number', steps: enhancedHappyNumber }
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
