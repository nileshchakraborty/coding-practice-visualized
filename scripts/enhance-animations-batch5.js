/**
 * Script to enhance animation steps - Batch 5
 * Run: node scripts/enhance-animations-batch5.js
 */

const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../data/solutions.json');

// Enhanced animation steps for course-schedule
const enhancedCourseSchedule = [
    {
        "step": 1,
        "visual": "numCourses=2, prereqs=[[1,0]]",
        "transientMessage": "Build graph: 0 → 1 (take 0 before 1)",
        "arrayState": [0, 1],
        "pointers": [{ "label": "src", "index": 0 }, { "label": "dst", "index": 1 }],
        "indices": [0, 1],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Topological sort with DFS",
        "transientMessage": "Check for cycles: visiting[0]=true",
        "arrayState": [0, 1],
        "pointers": [{ "label": "visit", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "DFS: 0 → 1",
        "transientMessage": "No cycle detected. Mark 0, 1 as done.",
        "arrayState": [0, 1],
        "pointers": [],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Answer: true",
        "transientMessage": "Can finish all courses ✅",
        "arrayState": [0, 1],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for permutations
const enhancedPermutations = [
    {
        "step": 1,
        "visual": "nums = [1, 2, 3]",
        "transientMessage": "Backtracking: build permutations",
        "arrayState": [1, 2, 3],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Pick 1 first: [1, _, _]",
        "transientMessage": "Recurse with [2, 3] remaining",
        "arrayState": [1, 2, 3],
        "pointers": [{ "label": "pick", "index": 0 }],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "[1,2,3], [1,3,2]",
        "transientMessage": "Backtrack, try 2 first...",
        "arrayState": [1, 2, 3],
        "pointers": [{ "label": "pick", "index": 1 }],
        "indices": [1],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "[2,1,3], [2,3,1], [3,1,2], [3,2,1]",
        "transientMessage": "All 6 permutations found ✅",
        "arrayState": [1, 2, 3],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for combination-sum
const enhancedCombinationSum = [
    {
        "step": 1,
        "visual": "candidates=[2,3,6,7], target=7",
        "transientMessage": "Backtracking: choices that sum to target",
        "arrayState": [2, 3, 6, 7],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Path: [2] → remaining=5",
        "transientMessage": "Can reuse 2. Path=[2,2] → remaining=3",
        "arrayState": [2, 3, 6, 7],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "Path: [2,2,3] → sum=7 🎯",
        "transientMessage": "Found! Add to result.",
        "arrayState": [2, 3, 6, 7],
        "pointers": [],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Path: [7] → sum=7 🎯",
        "transientMessage": "Another solution found!",
        "arrayState": [2, 3, 6, 7],
        "pointers": [],
        "indices": [3],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: [[2,2,3], [7]]",
        "transientMessage": "All combinations summing to 7 ✅",
        "arrayState": [2, 3, 6, 7],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for word-search
const enhancedWordSearch = [
    {
        "step": 1,
        "visual": "board 3x4, word='ABCCED'",
        "transientMessage": "DFS from each cell matching first char",
        "arrayState": [["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]],
        "pointers": [{ "label": "start", "index": 0 }],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Start at (0,0)='A', match!",
        "transientMessage": "DFS: A→B→C→C→E→D",
        "arrayState": [["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]],
        "pointers": [],
        "indices": [0, 1, 2, 6, 10, 9],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Path found!",
        "transientMessage": "A(0,0)→B(0,1)→C(0,2)→C(1,2)→E(2,2)→D(2,1)",
        "arrayState": [["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]],
        "pointers": [],
        "indices": [0, 1, 2, 6, 10, 9],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Answer: true",
        "transientMessage": "Word 'ABCCED' exists in board ✅",
        "arrayState": [["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for kth-largest-element-in-an-array
const enhancedKthLargest = [
    {
        "step": 1,
        "visual": "nums=[3,2,1,5,6,4], k=2",
        "transientMessage": "Use min-heap of size k",
        "arrayState": [3, 2, 1, 5, 6, 4],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Heap: [3], then [2,3]",
        "transientMessage": "Add first k elements",
        "arrayState": [3, 2, 1, 5, 6, 4],
        "pointers": [],
        "indices": [0, 1],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "5 > heap[0](2) → pop 2, push 5",
        "transientMessage": "Heap: [3, 5]",
        "arrayState": [3, 2, 1, 5, 6, 4],
        "pointers": [{ "label": "i", "index": 3 }],
        "indices": [0, 3],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "6 > heap[0](3) → pop 3, push 6",
        "transientMessage": "Heap: [5, 6]",
        "arrayState": [3, 2, 1, 5, 6, 4],
        "pointers": [{ "label": "i", "index": 4 }],
        "indices": [3, 4],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: heap[0] = 5",
        "transientMessage": "2nd largest element is 5 ✅",
        "arrayState": [3, 2, 1, 5, 6, 4],
        "pointers": [],
        "indices": [3],
        "color": "success"
    }
];

// Enhanced animation steps for top-k-frequent-elements
const enhancedTopKFrequent = [
    {
        "step": 1,
        "visual": "nums=[1,1,1,2,2,3], k=2",
        "transientMessage": "Count frequency: {1:3, 2:2, 3:1}",
        "arrayState": [1, 1, 1, 2, 2, 3],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Bucket sort by frequency",
        "transientMessage": "bucket[3]=[1], bucket[2]=[2], bucket[1]=[3]",
        "arrayState": [1, 1, 1, 2, 2, 3],
        "pointers": [],
        "indices": [0, 1, 2],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Pick from highest buckets",
        "transientMessage": "bucket[3]→1, bucket[2]→2",
        "arrayState": [1, 1, 1, 2, 2, 3],
        "pointers": [],
        "indices": [0, 1, 2, 3, 4],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Answer: [1, 2]",
        "transientMessage": "Top 2 frequent elements ✅",
        "arrayState": [1, 1, 1, 2, 2, 3],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for remove-duplicates-from-sorted-array
const enhancedRemoveDupsSorted = [
    {
        "step": 1,
        "visual": "nums = [0,0,1,1,1,2,2,3,3,4]",
        "transientMessage": "Two pointers: k=1 (unique write), i=1 (scan)",
        "arrayState": [0, 0, 1, 1, 1, 2, 2, 3, 3, 4],
        "pointers": [{ "label": "k", "index": 1 }, { "label": "i", "index": 1 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "i=1: nums[1]=0 == nums[0]",
        "transientMessage": "Duplicate, skip",
        "arrayState": [0, 0, 1, 1, 1, 2, 2, 3, 3, 4],
        "pointers": [{ "label": "k", "index": 1 }, { "label": "i", "index": 1 }],
        "indices": [1],
        "color": "warning"
    },
    {
        "step": 3,
        "visual": "i=2: nums[2]=1 != nums[0]",
        "transientMessage": "New unique! nums[k]=1, k++",
        "arrayState": [0, 1, 1, 1, 1, 2, 2, 3, 3, 4],
        "pointers": [{ "label": "k", "index": 2 }, { "label": "i", "index": 2 }],
        "indices": [1],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Continue scanning...",
        "transientMessage": "Find 2, 3, 4 as unique values",
        "arrayState": [0, 1, 2, 3, 4, 2, 2, 3, 3, 4],
        "pointers": [{ "label": "k", "index": 5 }],
        "indices": [0, 1, 2, 3, 4],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: k=5",
        "transientMessage": "5 unique elements: [0,1,2,3,4] ✅",
        "arrayState": [0, 1, 2, 3, 4, 2, 2, 3, 3, 4],
        "pointers": [],
        "indices": [0, 1, 2, 3, 4],
        "color": "success"
    }
];

// Enhanced animation steps for remove-duplicates-from-sorted-array-ii
const enhancedRemoveDupsSortedII = [
    {
        "step": 1,
        "visual": "nums = [1,1,1,2,2,3]",
        "transientMessage": "Allow at most 2 duplicates. k=2 (start)",
        "arrayState": [1, 1, 1, 2, 2, 3],
        "pointers": [{ "label": "k", "index": 2 }, { "label": "i", "index": 2 }],
        "indices": [0, 1],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "i=2: nums[2]=1 == nums[k-2]=1",
        "transientMessage": "3rd duplicate, skip!",
        "arrayState": [1, 1, 1, 2, 2, 3],
        "pointers": [{ "label": "k", "index": 2 }, { "label": "i", "index": 2 }],
        "indices": [2],
        "color": "warning"
    },
    {
        "step": 3,
        "visual": "i=3: nums[3]=2 != nums[k-2]=1",
        "transientMessage": "New value! nums[k]=2, k++",
        "arrayState": [1, 1, 2, 2, 2, 3],
        "pointers": [{ "label": "k", "index": 3 }, { "label": "i", "index": 3 }],
        "indices": [2],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Result: [1,1,2,2,3]",
        "transientMessage": "k=5, at most 2 of each ✅",
        "arrayState": [1, 1, 2, 2, 3, 3],
        "pointers": [],
        "indices": [0, 1, 2, 3, 4],
        "color": "success"
    }
];

// Enhanced animation steps for valid-anagram
const enhancedValidAnagram = [
    {
        "step": 1,
        "visual": "s=\"anagram\", t=\"nagaram\"",
        "transientMessage": "Count chars in s: {a:3, n:1, g:1, r:1, m:1}",
        "arrayState": ["a", "n", "a", "g", "r", "a", "m"],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Subtract chars in t",
        "transientMessage": "For each char in t, decrement count",
        "arrayState": ["n", "a", "g", "a", "r", "a", "m"],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "All counts become 0",
        "transientMessage": "Every char balanced out",
        "arrayState": ["n", "a", "g", "a", "r", "a", "m"],
        "pointers": [],
        "indices": [],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Answer: true",
        "transientMessage": "s and t are anagrams ✅",
        "arrayState": ["n", "a", "g", "a", "r", "a", "m"],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for roman-to-integer
const enhancedRomanToInteger = [
    {
        "step": 1,
        "visual": "s = \"MCMXCIV\" (1994)",
        "transientMessage": "M=1000, C=100, X=10, I=1, V=5",
        "arrayState": ["M", "C", "M", "X", "C", "I", "V"],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "M: +1000",
        "transientMessage": "result = 1000",
        "arrayState": ["M", "C", "M", "X", "C", "I", "V"],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "CM: C<M → subtract 100",
        "transientMessage": "result = 1000-100+1000 = 1900",
        "arrayState": ["M", "C", "M", "X", "C", "I", "V"],
        "pointers": [{ "label": "i", "index": 1 }],
        "indices": [1, 2],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "XC: X<C → subtract 10",
        "transientMessage": "result = 1900-10+100 = 1990",
        "arrayState": ["M", "C", "M", "X", "C", "I", "V"],
        "pointers": [{ "label": "i", "index": 3 }],
        "indices": [3, 4],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "IV: I<V → subtract 1",
        "transientMessage": "result = 1990-1+5 = 1994 ✅",
        "arrayState": ["M", "C", "M", "X", "C", "I", "V"],
        "pointers": [],
        "indices": [5, 6],
        "color": "success"
    }
];

// Main function
function main() {
    console.log('Reading solutions.json...');
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    const updates = [
        { slug: 'course-schedule', steps: enhancedCourseSchedule, type: 'graph' },
        { slug: 'permutations', steps: enhancedPermutations },
        { slug: 'combination-sum', steps: enhancedCombinationSum },
        { slug: 'word-search', steps: enhancedWordSearch, type: 'grid' },
        { slug: 'kth-largest-element-in-an-array', steps: enhancedKthLargest },
        { slug: 'top-k-frequent-elements', steps: enhancedTopKFrequent },
        { slug: 'remove-duplicates-from-sorted-array', steps: enhancedRemoveDupsSorted },
        { slug: 'remove-duplicates-from-sorted-array-ii', steps: enhancedRemoveDupsSortedII },
        { slug: 'valid-anagram', steps: enhancedValidAnagram },
        { slug: 'roman-to-integer', steps: enhancedRomanToInteger }
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
