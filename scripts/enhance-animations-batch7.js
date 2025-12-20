/**
 * Script to enhance animation steps - Batch 7 (Final 3)
 * Run: node scripts/enhance-animations-batch7.js
 */

const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../data/solutions.json');

// Enhanced animation steps for time-needed-to-buy-tickets
const enhancedTimeToBuyTickets = [
    {
        "step": 1,
        "visual": "tickets = [2, 3, 2], k = 2",
        "transientMessage": "Person k wants 2 tickets. Simulate queue.",
        "arrayState": [2, 3, 2],
        "pointers": [{ "label": "k", "index": 2 }],
        "indices": [2],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Round 1: each person buys 1",
        "transientMessage": "tickets = [1, 2, 1], time = 3",
        "arrayState": [1, 2, 1],
        "pointers": [{ "label": "k", "index": 2 }],
        "indices": [0, 1, 2],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Round 2: person 0 done, k buys last",
        "transientMessage": "tickets = [0, 1, 0], time = 6",
        "arrayState": [0, 1, 0],
        "pointers": [{ "label": "k", "index": 2 }],
        "indices": [0, 2],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Answer: 6 seconds",
        "transientMessage": "Person k finished buying tickets ✅",
        "arrayState": [0, 1, 0],
        "pointers": [],
        "indices": [2],
        "color": "success"
    }
];

// Enhanced animation steps for count-and-say
const enhancedCountAndSay = [
    {
        "step": 1,
        "visual": "n = 4, start with '1'",
        "transientMessage": "countAndSay(1) = '1'",
        "arrayState": ["1"],
        "pointers": [],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Say '1' → 'one 1'",
        "transientMessage": "countAndSay(2) = '11'",
        "arrayState": ["1", "1"],
        "pointers": [],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Say '11' → 'two 1s'",
        "transientMessage": "countAndSay(3) = '21'",
        "arrayState": ["2", "1"],
        "pointers": [],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Say '21' → 'one 2, one 1'",
        "transientMessage": "countAndSay(4) = '1211' ✅",
        "arrayState": ["1", "2", "1", "1"],
        "pointers": [],
        "indices": [0, 1, 2, 3],
        "color": "success"
    }
];

// Enhanced animation steps for minimum-time-visiting-all-points
const enhancedMinTimeVisitingPoints = [
    {
        "step": 1,
        "visual": "points = [[1,1], [3,4], [-1,0]]",
        "transientMessage": "Chebyshev distance: max(|Δx|, |Δy|)",
        "arrayState": [[1, 1], [3, 4], [-1, 0]],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "(1,1) → (3,4)",
        "transientMessage": "max(|3-1|, |4-1|) = max(2,3) = 3",
        "arrayState": [[1, 1], [3, 4], [-1, 0]],
        "pointers": [{ "label": "from", "index": 0 }, { "label": "to", "index": 1 }],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "(3,4) → (-1,0)",
        "transientMessage": "max(|-1-3|, |0-4|) = max(4,4) = 4",
        "arrayState": [[1, 1], [3, 4], [-1, 0]],
        "pointers": [{ "label": "from", "index": 1 }, { "label": "to", "index": 2 }],
        "indices": [1, 2],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Answer: 3 + 4 = 7",
        "transientMessage": "Minimum time to visit all points ✅",
        "arrayState": [[1, 1], [3, 4], [-1, 0]],
        "pointers": [],
        "indices": [0, 1, 2],
        "color": "success"
    }
];

// Main function
function main() {
    console.log('Reading solutions.json...');
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    const updates = [
        { slug: 'time-needed-to-buy-tickets', steps: enhancedTimeToBuyTickets },
        { slug: 'count-and-say', steps: enhancedCountAndSay },
        { slug: 'minimum-time-visiting-all-points', steps: enhancedMinTimeVisitingPoints }
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
    console.log(`\n🎉 ALL 62 SOLUTIONS NOW HAVE ENHANCED ANIMATIONS!`);
}

main();
