/**
 * Script to enhance animation steps - Batch 12 (Dynamic Programming)
 * Run: node scripts/enhance-animations-batch12.js
 */

const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../data/solutions.json');

// 1. Min Cost Climbing Stairs (1D Array)
const enhancedMinCost = [
    {
        "step": 1,
        "visual": "cost = [10, 15, 20]",
        "transientMessage": "DP[i] = cost[i] + min(DP[i-1], DP[i-2])",
        "arrayState": [10, 15, 20],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Start at index 0, 1",
        "transientMessage": "Base costs: 10, 15",
        "arrayState": [10, 15, 20],
        "pointers": [{ "label": "i-2", "index": 0 }, { "label": "i-1", "index": 1 }],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Calculate step 2",
        "transientMessage": "cost[2] + min(10, 15) = 20 + 10 = 30",
        "arrayState": [10, 15, 30],
        "pointers": [{ "label": "curr", "index": 2 }],
        "indices": [0, 1, 2],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Reach top",
        "transientMessage": "Top can be reached from 1 (15) or 2 (30). Min = 15.",
        "arrayState": [10, 15, 30],
        "pointers": [],
        "indices": [1, 2],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: 15",
        "transientMessage": "Minimum cost found ✅",
        "arrayState": [10, 15, 30],
        "pointers": [],
        "indices": [1],
        "color": "success"
    }
];

// 2. House Robber II (Array - Circular)
const enhancedHouseRobberII = [
    {
        "step": 1,
        "visual": "nums = [2, 3, 2]",
        "transientMessage": "Case 1: Rob 0..n-2 (ignore last). Case 2: Rob 1..n-1 (ignore first).",
        "arrayState": [2, 3, 2],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Case 1: [2, 3] (Ignore last 2)",
        "transientMessage": "Rob 2 vs Rob 3 -> Max=3",
        "arrayState": [2, 3, 0],
        "pointers": [{ "label": "max1", "index": 1 }],
        "indices": [0, 1],
        "color": "warning"
    },
    {
        "step": 3,
        "visual": "Case 2: [3, 2] (Ignore first 2)",
        "transientMessage": "Rob 3 vs Rob 2 -> Max=3",
        "arrayState": [0, 3, 2],
        "pointers": [{ "label": "max2", "index": 1 }],
        "indices": [1, 2],
        "color": "warning"
    },
    {
        "step": 4,
        "visual": "Compare Cases",
        "transientMessage": "max(3, 3) = 3",
        "arrayState": [2, 3, 2],
        "pointers": [],
        "indices": [1],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: 3",
        "transientMessage": "Max amount robbed ✅",
        "arrayState": [2, 3, 2],
        "pointers": [],
        "indices": [1],
        "color": "success"
    }
];

// 3. Longest Common Subsequence (2D Grid)
// text1 = "abcde", text2 = "ace"
// Grid 4x6 (rows for "", a, c, e; cols for "", a, b, c, d, e)
// Initial: all 0
const lcsInitial = [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0]
];
const enhancedLCS = [
    {
        "step": 1,
        "visual": "DP Table (Rows: 'ace', Cols: 'abcde')",
        "transientMessage": "If matching char: 1 + diag. Else max(top, left).",
        "arrayState": [
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0]
        ],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Match 'a' == 'a'",
        "transientMessage": "1 + dp[0][0] = 1.",
        "arrayState": [
            [0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0]
        ],
        "pointers": [{ "label": "1", "index": [1, 1] }],
        "indices": [[1, 1]],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Match 'c' == 'c'",
        "transientMessage": "1 + dp[1][2] = 2. Propagate.",
        "arrayState": [
            [0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 1],
            [0, 1, 1, 2, 2, 2],
            [0, 0, 0, 0, 0, 0]
        ],
        "pointers": [{ "label": "2", "index": [2, 3] }],
        "indices": [[2, 3]],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Match 'e' == 'e'",
        "transientMessage": "1 + dp[2][4] = 3.",
        "arrayState": [
            [0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 1],
            [0, 1, 1, 2, 2, 2],
            [0, 1, 1, 2, 2, 3]
        ],
        "pointers": [{ "label": "3", "index": [3, 5] }],
        "indices": [[3, 5]],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: 3",
        "transientMessage": "LCS length is 3 ('ace') ✅",
        "arrayState": [
            [0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 1],
            [0, 1, 1, 2, 2, 2],
            [0, 1, 1, 2, 2, 3]
        ],
        "pointers": [],
        "indices": [[3, 5]],
        "color": "success"
    }
];


// 4. Coin Change II (1D Array for Combinations)
// amount = 5, coins = [1, 2, 5]
const enhancedCoinChangeII = [
    {
        "step": 1,
        "visual": "dp size 6. coins=[1, 2, 5]",
        "transientMessage": "dp[0]=1 (base case). Count combinations.",
        "arrayState": [1, 0, 0, 0, 0, 0],
        "pointers": [],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Use coin 1",
        "transientMessage": "dp[j] += dp[j-1]. Fill all.",
        "arrayState": [1, 1, 1, 1, 1, 1],
        "pointers": [],
        "indices": [1, 2, 3, 4, 5],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Use coin 2",
        "transientMessage": "dp[j] += dp[j-2]. dp[2]+=1->2, dp[3]+=1->2...",
        "arrayState": [1, 1, 2, 2, 3, 3],
        "pointers": [],
        "indices": [2, 3, 4, 5],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Use coin 5",
        "transientMessage": "dp[j] += dp[j-5]. dp[5] += dp[0] -> 3+1=4.",
        "arrayState": [1, 1, 2, 2, 3, 4],
        "pointers": [{ "label": "ans", "index": 5 }],
        "indices": [5],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: 4",
        "transientMessage": "Total combinations for 5: 4 ✅",
        "arrayState": [1, 1, 2, 2, 3, 4],
        "pointers": [],
        "indices": [5],
        "color": "success"
    }
];

// 5. Longest Increasing Path (Grid) 
// matrix = [[9,9,4],[6,6,8],[2,1,1]]
// We will show memoized values grid
const lipInitial = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]
]; // Initially everything is length 1

const enhancedLIP = [
    {
        "step": 1,
        "visual": "Scan grid. DFS with Memo",
        "transientMessage": "Compute max path at each cell.",
        "arrayState": [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Compute [2,1] (val=1)",
        "transientMessage": "Neighbors 6,8,1. No smaller neighbor? Base 1 + max(neighbors>curr). Here neighbors > curr? No we look for increasing path. So next must be larger. 1->6, 1->8?",
        // Problem asks for increasing path. From 1, can go to 6, 8? Yes.
        // 1 -> 6 -> 9. Length 3.
        // Let's simplified visual: Show computed values appearing.
        "arrayState": [[1, 1, 1], [1, 1, 1], [1, 2, 1]], // computed 1 at [2,2]
        "pointers": [],
        "indices": [[2, 2]],
        "color": "warning"
    },
    {
        "step": 3,
        "visual": "Backfill values",
        "transientMessage": "Path: 1 -> 2 -> 6 -> 9. Length 4.",
        "arrayState": [[2, 1, 1], [3, 2, 1], [4, 2, 2]],
        "pointers": [{ "label": "Max", "index": [2, 0] }],
        "indices": [[2, 0], [1, 0], [1, 1]],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Complete Grid",
        "transientMessage": "Max value in grid is 4.",
        "arrayState": [[2, 1, 2], [3, 2, 2], [4, 2, 2]],
        "pointers": [{ "label": "4", "index": [2, 0] }],
        "indices": [[2, 0]],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: 4",
        "transientMessage": "Longest Increasing Path: 4 ✅",
        "arrayState": [[2, 1, 2], [3, 2, 2], [4, 2, 2]],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];


function main() {
    console.log('Reading solutions.json...');
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    const updates = [
        { slug: 'min-cost-climbing-stairs', steps: enhancedMinCost, type: 'array' },
        { slug: 'house-robber-ii', steps: enhancedHouseRobberII, type: 'array' },
        { slug: 'longest-common-subsequence', steps: enhancedLCS, type: 'grid', initialState: lcsInitial },
        { slug: 'coin-change-ii', steps: enhancedCoinChangeII, type: 'array' },
        { slug: 'longest-increasing-path-in-a-matrix', steps: enhancedLIP, type: 'grid', initialState: lipInitial }
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
    console.log(`✅ Done! Enhanced animation steps for ${count} DP solutions.`);
}

main();
