/**
 * Script to enhance animation steps - Batch 6 (Final)
 * Run: node scripts/enhance-animations-batch6.js
 */

const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../data/solutions.json');

// Enhanced animation steps for triangle (DP)
const enhancedTriangle = [
    {
        "step": 1,
        "visual": "[[2],[3,4],[6,5,7],[4,1,8,3]]",
        "transientMessage": "DP from bottom: min path to reach each cell",
        "arrayState": [[2], [3, 4], [6, 5, 7], [4, 1, 8, 3]],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Bottom row: [4,1,8,3]",
        "transientMessage": "Base case: dp = [4,1,8,3]",
        "arrayState": [4, 1, 8, 3],
        "pointers": [],
        "indices": [0, 1, 2, 3],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "Row 2: [6,5,7]",
        "transientMessage": "dp[i] = tri[i] + min(dp[i], dp[i+1])",
        "arrayState": [7, 6, 10],
        "pointers": [],
        "indices": [0, 1, 2],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Row 1: [3,4]",
        "transientMessage": "dp = [9, 10]",
        "arrayState": [9, 10],
        "pointers": [],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Row 0: [2]",
        "transientMessage": "dp[0] = 2 + min(9,10) = 11 ✅",
        "arrayState": [11],
        "pointers": [],
        "indices": [0],
        "color": "success"
    }
];

// Enhanced animation steps for best-time-to-buy-and-sell-stock
const enhancedStock = [
    {
        "step": 1,
        "visual": "prices = [7, 1, 5, 3, 6, 4]",
        "transientMessage": "Track min price seen so far",
        "arrayState": [7, 1, 5, 3, 6, 4],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "i=0: minPrice=7, profit=0",
        "transientMessage": "No profit on first day",
        "arrayState": [7, 1, 5, 3, 6, 4],
        "pointers": [{ "label": "min", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "i=1: price=1 < minPrice",
        "transientMessage": "New minimum! minPrice=1",
        "arrayState": [7, 1, 5, 3, 6, 4],
        "pointers": [{ "label": "min", "index": 1 }],
        "indices": [1],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "i=4: profit = 6-1 = 5 🎯",
        "transientMessage": "Best profit so far! Buy at 1, sell at 6",
        "arrayState": [7, 1, 5, 3, 6, 4],
        "pointers": [{ "label": "buy", "index": 1 }, { "label": "sell", "index": 4 }],
        "indices": [1, 4],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: 5",
        "transientMessage": "Maximum profit = 5 ✅",
        "arrayState": [7, 1, 5, 3, 6, 4],
        "pointers": [],
        "indices": [1, 4],
        "color": "success"
    }
];

// Enhanced animation steps for copy-list-with-random-pointer
const enhancedCopyRandomList = [
    {
        "step": 1,
        "visual": "Node 7 → 13 → 11 → 10 → 1",
        "transientMessage": "Step 1: Create copy nodes interleaved",
        "arrayState": [7, 13, 11, 10, 1],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "7 → 7' → 13 → 13' → ...",
        "transientMessage": "Insert clone after each original",
        "arrayState": [7, "7'", 13, "13'", 11, "11'"],
        "pointers": [],
        "indices": [1, 3, 5],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Copy random pointers",
        "transientMessage": "clone.random = original.random.next",
        "arrayState": [7, "7'", 13, "13'", 11, "11'"],
        "pointers": [],
        "indices": [],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Separate the two lists",
        "transientMessage": "Extract clone list ✅",
        "arrayState": ["7'", "13'", "11'", "10'", "1'"],
        "pointers": [],
        "indices": [0, 1, 2, 3, 4],
        "color": "success"
    }
];

// Enhanced animation steps for reverse-linked-list-ii
const enhancedReverseListII = [
    {
        "step": 1,
        "visual": "1 → 2 → 3 → 4 → 5, left=2, right=4",
        "transientMessage": "Reverse nodes between positions 2 and 4",
        "arrayState": [1, 2, 3, 4, 5],
        "pointers": [{ "label": "L", "index": 1 }, { "label": "R", "index": 3 }],
        "indices": [1, 2, 3],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "prev=1, curr=2",
        "transientMessage": "Move prev to node before left",
        "arrayState": [1, 2, 3, 4, 5],
        "pointers": [{ "label": "prev", "index": 0 }, { "label": "curr", "index": 1 }],
        "indices": [0, 1],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "Reverse: 2←3←4",
        "transientMessage": "Sublist reversed",
        "arrayState": [1, 4, 3, 2, 5],
        "pointers": [],
        "indices": [1, 2, 3],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "1 → 4 → 3 → 2 → 5",
        "transientMessage": "Connect: 1→4 and 2→5 ✅",
        "arrayState": [1, 4, 3, 2, 5],
        "pointers": [],
        "indices": [0, 1, 2, 3, 4],
        "color": "success"
    }
];

// Enhanced animation steps for implement-stack-using-queues
const enhancedStackUsingQueues = [
    {
        "step": 1,
        "visual": "push(1), push(2)",
        "transientMessage": "Queue: [1, 2] (FIFO)",
        "arrayState": [1, 2],
        "pointers": [],
        "indices": [0, 1],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "push(3): rotate to front",
        "transientMessage": "Dequeue+enqueue n-1 times → [3,1,2]",
        "arrayState": [3, 1, 2],
        "pointers": [{ "label": "top", "index": 0 }],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "pop() → 3",
        "transientMessage": "Dequeue front → 3 ✅",
        "arrayState": [1, 2],
        "pointers": [{ "label": "top", "index": 0 }],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for missing-number
const enhancedMissingNumber = [
    {
        "step": 1,
        "visual": "nums = [3, 0, 1]",
        "transientMessage": "XOR approach: n XOR all indices XOR all values",
        "arrayState": [3, 0, 1],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "result = 3 (n)",
        "transientMessage": "XOR with indices: 3^0^1^2 = 0",
        "arrayState": [3, 0, 1],
        "pointers": [],
        "indices": [0, 1, 2],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "XOR with values: 0^3^0^1",
        "transientMessage": "result = 2 🎯",
        "arrayState": [3, 0, 1],
        "pointers": [],
        "indices": [],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Answer: 2",
        "transientMessage": "Missing number is 2 ✅",
        "arrayState": [3, 0, 1],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for fizz-buzz
const enhancedFizzBuzz = [
    {
        "step": 1,
        "visual": "n = 15",
        "transientMessage": "For each i: check divisibility",
        "arrayState": [1, 2, 3, 4, 5],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "i=3: 3%3==0 → 'Fizz'",
        "transientMessage": "Divisible by 3",
        "arrayState": ["1", "2", "Fizz", "4", "Buzz"],
        "pointers": [{ "label": "i", "index": 2 }],
        "indices": [2],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "i=5: 5%5==0 → 'Buzz'",
        "transientMessage": "Divisible by 5",
        "arrayState": ["1", "2", "Fizz", "4", "Buzz"],
        "pointers": [{ "label": "i", "index": 4 }],
        "indices": [4],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "i=15: 15%15==0 → 'FizzBuzz'",
        "transientMessage": "Divisible by both 3 and 5 ✅",
        "arrayState": ["...", "13", "14", "FizzBuzz"],
        "pointers": [],
        "indices": [3],
        "color": "success"
    }
];

// Enhanced animation steps for middle-of-the-linked-list
const enhancedMiddleList = [
    {
        "step": 1,
        "visual": "1 → 2 → 3 → 4 → 5",
        "transientMessage": "slow+1, fast+2 (Floyd's)",
        "arrayState": [1, 2, 3, 4, 5],
        "pointers": [{ "label": "slow", "index": 0 }, { "label": "fast", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "slow=2, fast=3",
        "transientMessage": "slow moves 1 step, fast moves 2",
        "arrayState": [1, 2, 3, 4, 5],
        "pointers": [{ "label": "slow", "index": 1 }, { "label": "fast", "index": 2 }],
        "indices": [1, 2],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "slow=3, fast=5",
        "transientMessage": "fast at end!",
        "arrayState": [1, 2, 3, 4, 5],
        "pointers": [{ "label": "slow", "index": 2 }, { "label": "fast", "index": 4 }],
        "indices": [2, 4],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Answer: node 3",
        "transientMessage": "Middle of list is 3 ✅",
        "arrayState": [1, 2, 3, 4, 5],
        "pointers": [],
        "indices": [2],
        "color": "success"
    }
];

// Main function
function main() {
    console.log('Reading solutions.json...');
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    const updates = [
        { slug: 'triangle', steps: enhancedTriangle },
        { slug: 'best-time-to-buy-and-sell-stock', steps: enhancedStock },
        { slug: 'copy-list-with-random-pointer', steps: enhancedCopyRandomList, type: 'linkedlist' },
        { slug: 'reverse-linked-list-ii', steps: enhancedReverseListII, type: 'linkedlist' },
        { slug: 'implement-stack-using-queues', steps: enhancedStackUsingQueues },
        { slug: 'missing-number', steps: enhancedMissingNumber },
        { slug: 'fizz-buzz', steps: enhancedFizzBuzz },
        { slug: 'middle-of-the-linked-list', steps: enhancedMiddleList, type: 'linkedlist' }
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
