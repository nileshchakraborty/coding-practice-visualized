/**
 * Script to enhance animation steps - Batch 8
 * Run: node scripts/enhance-animations-batch8.js
 */

const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../data/solutions.json');

// Enhanced animation steps for is-subsequence
const enhancedIsSubsequence = [
    {
        "step": 1,
        "visual": "s = \"abc\", t = \"ahbgdc\"",
        "transientMessage": "Two pointers: i (for s), j (for t)",
        "arrayState": ["a", "h", "b", "g", "d", "c"],
        "pointers": [{ "label": "i", "index": 0 }, { "label": "j", "index": 0 }],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "s[0]='a' == t[0]='a'",
        "transientMessage": "Match found! Advance i and j",
        "arrayState": ["a", "h", "b", "g", "d", "c"],
        "pointers": [{ "label": "i", "index": 1 }, { "label": "j", "index": 1 }],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "s[1]='b' != t[1]='h'",
        "transientMessage": "No match. Advance j only",
        "arrayState": ["a", "h", "b", "g", "d", "c"],
        "pointers": [{ "label": "i", "index": 1 }, { "label": "j", "index": 2 }],
        "indices": [1],
        "color": "warning"
    },
    {
        "step": 4,
        "visual": "s[1]='b' == t[2]='b'",
        "transientMessage": "Match found! Advance i and j",
        "arrayState": ["a", "h", "b", "g", "d", "c"],
        "pointers": [{ "label": "i", "index": 2 }, { "label": "j", "index": 3 }],
        "indices": [2],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Continue...",
        "transientMessage": "Found all chars of s in t ✅",
        "arrayState": ["a", "h", "b", "g", "d", "c"],
        "pointers": [],
        "indices": [0, 2, 5],
        "color": "success"
    }
];

// Enhanced animation steps for two-sum-ii-input-array-is-sorted
const enhancedTwoSumII = [
    {
        "step": 1,
        "visual": "numbers = [2, 7, 11, 15], target = 9",
        "transientMessage": "Sorted array: Use two pointers at ends",
        "arrayState": [2, 7, 11, 15],
        "pointers": [{ "label": "L", "index": 0 }, { "label": "R", "index": 3 }],
        "indices": [0, 3],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "2 + 15 = 17 > 9",
        "transientMessage": "Sum too big → Move R left",
        "arrayState": [2, 7, 11, 15],
        "pointers": [{ "label": "L", "index": 0 }, { "label": "R", "index": 2 }],
        "indices": [0, 2],
        "color": "warning"
    },
    {
        "step": 3,
        "visual": "2 + 11 = 13 > 9",
        "transientMessage": "Sum too big → Move R left",
        "arrayState": [2, 7, 11, 15],
        "pointers": [{ "label": "L", "index": 0 }, { "label": "R", "index": 1 }],
        "indices": [0, 1],
        "color": "warning"
    },
    {
        "step": 4,
        "visual": "2 + 7 = 9",
        "transientMessage": "Match found! Indices: 1, 2 ✅",
        "arrayState": [2, 7, 11, 15],
        "pointers": [],
        "indices": [0, 1],
        "color": "success"
    }
];

// Enhanced animation steps for container-with-most-water
const enhancedContainerMostWater = [
    {
        "step": 1,
        "visual": "height = [1,8,6,2,5,4,8,3,7]",
        "transientMessage": "L=0, R=8. Maximize area.",
        "arrayState": [1, 8, 6, 2, 5, 4, 8, 3, 7],
        "pointers": [{ "label": "L", "index": 0 }, { "label": "R", "index": 8 }],
        "indices": [0, 8],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "h[0]=1, h[8]=7. w=8. Area = 1*8 = 8",
        "transientMessage": "h[L] < h[R] → Move L right to find taller line",
        "arrayState": [1, 8, 6, 2, 5, 4, 8, 3, 7],
        "pointers": [{ "label": "L", "index": 1 }, { "label": "R", "index": 8 }],
        "indices": [0, 8],
        "color": "warning"
    },
    {
        "step": 3,
        "visual": "h[1]=8, h[8]=7. w=7. Area = 7*7 = 49",
        "transientMessage": "New max area! h[R] < h[L] → Move R left",
        "arrayState": [1, 8, 6, 2, 5, 4, 8, 3, 7],
        "pointers": [{ "label": "L", "index": 1 }, { "label": "R", "index": 7 }],
        "indices": [1, 8],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Final Answer: 49",
        "transientMessage": "Maximum area found ✅",
        "arrayState": [1, 8, 6, 2, 5, 4, 8, 3, 7],
        "pointers": [],
        "indices": [1, 8],
        "color": "success"
    }
];

// Enhanced animation steps for 3sum
const enhanced3Sum = [
    {
        "step": 1,
        "visual": "nums = [-1, 0, 1, 2, -1, -4]",
        "transientMessage": "Sort array first: [-4, -1, -1, 0, 1, 2]",
        "arrayState": [-4, -1, -1, 0, 1, 2],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "i=1: val=-1. Left=2, Right=5",
        "transientMessage": "Target sum = 1 (since -1 + sum = 0)",
        "arrayState": [-4, -1, -1, 0, 1, 2],
        "pointers": [{ "label": "i", "index": 1 }, { "label": "L", "index": 2 }, { "label": "R", "index": 5 }],
        "indices": [1, 2, 5],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "L=-1, R=2 → Sum=1",
        "transientMessage": "Found triplet! [-1, -1, 2]",
        "arrayState": [-4, -1, -1, 0, 1, 2],
        "pointers": [{ "label": "i", "index": 1 }, { "label": "L", "index": 2 }, { "label": "R", "index": 5 }],
        "indices": [1, 2, 5],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Continue i loop...",
        "transientMessage": "Found all unique triplets ✅",
        "arrayState": [-4, -1, -1, 0, 1, 2],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for length-of-last-word
const enhancedLengthOfLastWord = [
    {
        "step": 1,
        "visual": "s = \"Hello World  \"",
        "transientMessage": "Start from end. Skip trailing spaces.",
        "arrayState": ["W", "o", "r", "l", "d", " ", " "],
        "pointers": [{ "label": "i", "index": 6 }],
        "indices": [6],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "i=6, char=' '. Decrement i.",
        "transientMessage": "Skipping space...",
        "arrayState": ["W", "o", "r", "l", "d", " ", " "],
        "pointers": [{ "label": "i", "index": 5 }],
        "indices": [5],
        "color": "warning"
    },
    {
        "step": 3,
        "visual": "i=4, char='d'. Start counting.",
        "transientMessage": "Found last word end. Length = 1",
        "arrayState": ["W", "o", "r", "l", "d", " ", " "],
        "pointers": [{ "label": "i", "index": 4 }],
        "indices": [4],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Continue until space or start",
        "transientMessage": "Length = 5 ('World') ✅",
        "arrayState": ["W", "o", "r", "l", "d", " ", " "],
        "pointers": [{ "label": "i", "index": -1 }],
        "indices": [0, 1, 2, 3, 4],
        "color": "success"
    }
];

// Enhanced animation steps for longest-common-prefix
const enhancedLongestCommonPrefix = [
    {
        "step": 1,
        "visual": "strs = [\"flower\",\"flow\",\"flight\"]",
        "transientMessage": "Take first str as prefix: \"flower\"",
        "arrayState": ["flower", "flow", "flight"],
        "pointers": [{ "label": "p", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Compare with \"flow\"",
        "transientMessage": "\"flow\" in \"flower\"? No. Shorten prefix → \"flow\"",
        "arrayState": ["flower", "flow", "flight"],
        "pointers": [{ "label": "i", "index": 1 }],
        "indices": [1],
        "color": "warning"
    },
    {
        "step": 3,
        "visual": "Compare with \"flight\"",
        "transientMessage": "\"fl\" matches. Shorten prefix → \"fl\"",
        "arrayState": ["flower", "flow", "flight"],
        "pointers": [{ "label": "i", "index": 2 }],
        "indices": [2],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Answer: \"fl\"",
        "transientMessage": "Longest common prefix found ✅",
        "arrayState": ["flower", "flow", "flight"],
        "pointers": [],
        "indices": [0, 1, 2],
        "color": "success"
    }
];

// Enhanced animation steps for reverse-words-in-a-string
const enhancedReverseWords = [
    {
        "step": 1,
        "visual": "s = \"the sky is blue\"",
        "transientMessage": "Split by spaces → [\"the\", \"sky\", \"is\", \"blue\"]",
        "arrayState": ["the", "sky", "is", "blue"],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Reverse list",
        "transientMessage": "[\"blue\", \"is\", \"sky\", \"the\"]",
        "arrayState": ["blue", "is", "sky", "the"],
        "pointers": [],
        "indices": [0, 1, 2, 3],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Join with spaces",
        "transientMessage": "\"blue is sky the\" ✅",
        "arrayState": ["blue", "is", "sky", "the"],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Main function
function main() {
    console.log('Reading solutions.json...');
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    const updates = [
        { slug: 'is-subsequence', steps: enhancedIsSubsequence },
        { slug: 'two-sum-ii-input-array-is-sorted', steps: enhancedTwoSumII },
        { slug: 'container-with-most-water', steps: enhancedContainerMostWater },
        { slug: '3sum', steps: enhanced3Sum },
        { slug: 'length-of-last-word', steps: enhancedLengthOfLastWord },
        { slug: 'longest-common-prefix', steps: enhancedLongestCommonPrefix },
        { slug: 'reverse-words-in-a-string', steps: enhancedReverseWords }
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
