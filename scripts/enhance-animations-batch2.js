/**
 * Script to enhance animation steps - Batch 2
 * Run: node scripts/enhance-animations-batch2.js
 */

const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../data/solutions.json');

// Enhanced animation steps for maximum-subarray (Kadane's Algorithm)
const enhancedMaximumSubarray = [
    {
        "step": 1,
        "visual": "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
        "transientMessage": "Initialize: currentSum=0, maxSum=-∞",
        "arrayState": [-2, 1, -3, 4, -1, 2, 1, -5, 4],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "i=0: num=-2",
        "transientMessage": "currentSum = max(-2, 0+(-2)) = -2, maxSum = -2",
        "arrayState": [-2, 1, -3, 4, -1, 2, 1, -5, 4],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "i=1: num=1",
        "transientMessage": "currentSum = max(1, -2+1) = 1, maxSum = 1",
        "arrayState": [-2, 1, -3, 4, -1, 2, 1, -5, 4],
        "pointers": [{ "label": "i", "index": 1 }],
        "indices": [1],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "i=3: num=4 (Start fresh!)",
        "transientMessage": "currentSum = max(4, -2+4) = 4, maxSum = 4 🎯",
        "arrayState": [-2, 1, -3, 4, -1, 2, 1, -5, 4],
        "pointers": [{ "label": "i", "index": 3 }],
        "indices": [3],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Building subarray [4,-1,2,1]",
        "transientMessage": "currentSum = 4-1+2+1 = 6, maxSum = 6 🚀",
        "arrayState": [-2, 1, -3, 4, -1, 2, 1, -5, 4],
        "pointers": [{ "label": "start", "index": 3 }, { "label": "end", "index": 6 }],
        "indices": [3, 4, 5, 6],
        "color": "success"
    },
    {
        "step": 6,
        "visual": "Answer: 6 (subarray [4,-1,2,1])",
        "transientMessage": "Maximum subarray sum is 6 ✅",
        "arrayState": [-2, 1, -3, 4, -1, 2, 1, -5, 4],
        "pointers": [],
        "indices": [3, 4, 5, 6],
        "color": "success"
    }
];

// Enhanced animation steps for climbing-stairs (DP Fibonacci)
const enhancedClimbingStairs = [
    {
        "step": 1,
        "visual": "n = 5 stairs",
        "transientMessage": "ways(1)=1, ways(2)=2 (base cases)",
        "arrayState": [1, 2, 0, 0, 0],
        "pointers": [{ "label": "dp", "index": 1 }],
        "indices": [0, 1],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "ways(3) = ways(1) + ways(2)",
        "transientMessage": "ways(3) = 1 + 2 = 3",
        "arrayState": [1, 2, 3, 0, 0],
        "pointers": [{ "label": "dp", "index": 2 }],
        "indices": [0, 1, 2],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "ways(4) = ways(2) + ways(3)",
        "transientMessage": "ways(4) = 2 + 3 = 5",
        "arrayState": [1, 2, 3, 5, 0],
        "pointers": [{ "label": "dp", "index": 3 }],
        "indices": [1, 2, 3],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "ways(5) = ways(3) + ways(4)",
        "transientMessage": "ways(5) = 3 + 5 = 8 ✅",
        "arrayState": [1, 2, 3, 5, 8],
        "pointers": [{ "label": "dp", "index": 4 }],
        "indices": [2, 3, 4],
        "color": "success"
    }
];

// Enhanced animation steps for valid-parentheses (Stack)
const enhancedValidParentheses = [
    {
        "step": 1,
        "visual": "s = \"([]){}\"",
        "transientMessage": "Initialize empty stack: []",
        "arrayState": ["(", "[", "]", ")", "{", "}"],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "char='(' → Push to stack",
        "transientMessage": "Stack: ['(']",
        "arrayState": ["(", "[", "]", ")", "{", "}"],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "char='[' → Push to stack",
        "transientMessage": "Stack: ['(', '[']",
        "arrayState": ["(", "[", "]", ")", "{", "}"],
        "pointers": [{ "label": "i", "index": 1 }],
        "indices": [1],
        "color": "accent"
    },
    {
        "step": 4,
        "visual": "char=']' → Pop '[' ✓",
        "transientMessage": "Match! Stack: ['(']",
        "arrayState": ["(", "[", "]", ")", "{", "}"],
        "pointers": [{ "label": "i", "index": 2 }],
        "indices": [1, 2],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "char=')' → Pop '(' ✓",
        "transientMessage": "Match! Stack: []",
        "arrayState": ["(", "[", "]", ")", "{", "}"],
        "pointers": [{ "label": "i", "index": 3 }],
        "indices": [0, 3],
        "color": "success"
    },
    {
        "step": 6,
        "visual": "char='{' → Push, char='}' → Pop ✓",
        "transientMessage": "Match! Stack: [] (empty = valid!)",
        "arrayState": ["(", "[", "]", ")", "{", "}"],
        "pointers": [],
        "indices": [4, 5],
        "color": "success"
    },
    {
        "step": 7,
        "visual": "Result: true",
        "transientMessage": "Empty stack at end → All brackets matched ✅",
        "arrayState": ["(", "[", "]", ")", "{", "}"],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for binary-search
const enhancedBinarySearch = [
    {
        "step": 1,
        "visual": "nums = [-1, 0, 3, 5, 9, 12], target = 9",
        "transientMessage": "left=0, right=5, mid=2",
        "arrayState": [-1, 0, 3, 5, 9, 12],
        "pointers": [{ "label": "L", "index": 0 }, { "label": "M", "index": 2 }, { "label": "R", "index": 5 }],
        "indices": [0, 2, 5],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "nums[mid]=3 < target=9",
        "transientMessage": "Target is in RIGHT half → left = mid+1 = 3",
        "arrayState": [-1, 0, 3, 5, 9, 12],
        "pointers": [{ "label": "L", "index": 3 }, { "label": "R", "index": 5 }],
        "indices": [3, 4, 5],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "mid = (3+5)//2 = 4",
        "transientMessage": "Check nums[4] = 9",
        "arrayState": [-1, 0, 3, 5, 9, 12],
        "pointers": [{ "label": "L", "index": 3 }, { "label": "M", "index": 4 }, { "label": "R", "index": 5 }],
        "indices": [4],
        "color": "accent"
    },
    {
        "step": 4,
        "visual": "nums[4] = 9 == target 🎯",
        "transientMessage": "Found! Return index 4 ✅",
        "arrayState": [-1, 0, 3, 5, 9, 12],
        "pointers": [{ "label": "found", "index": 4 }],
        "indices": [4],
        "color": "success"
    }
];

// Enhanced animation steps for linked-list-cycle (Floyd's)
const enhancedLinkedListCycle = [
    {
        "step": 1,
        "visual": "3 → 2 → 0 → -4 ↩ (cycle to 2)",
        "transientMessage": "slow=3, fast=3 (both at head)",
        "arrayState": [3, 2, 0, -4],
        "pointers": [{ "label": "slow", "index": 0 }, { "label": "fast", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Move: slow+1, fast+2",
        "transientMessage": "slow=2, fast=0",
        "arrayState": [3, 2, 0, -4],
        "pointers": [{ "label": "slow", "index": 1 }, { "label": "fast", "index": 2 }],
        "indices": [1, 2],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "Move: slow+1, fast+2",
        "transientMessage": "slow=0, fast=2 (in cycle)",
        "arrayState": [3, 2, 0, -4],
        "pointers": [{ "label": "slow", "index": 2 }, { "label": "fast", "index": 1 }],
        "indices": [1, 2],
        "color": "accent"
    },
    {
        "step": 4,
        "visual": "slow catches up to fast!",
        "transientMessage": "They meet at node with value 2 → Cycle detected! 🎯",
        "arrayState": [3, 2, 0, -4],
        "pointers": [{ "label": "meet!", "index": 1 }],
        "indices": [1],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Result: true",
        "transientMessage": "Cycle exists (Floyd's algorithm) ✅",
        "arrayState": [3, 2, 0, -4],
        "pointers": [],
        "indices": [1, 2, 3],
        "color": "success"
    }
];

// Enhanced animation steps for coin-change (DP)
const enhancedCoinChange = [
    {
        "step": 1,
        "visual": "coins=[1,2,5], amount=11",
        "transientMessage": "dp[i] = min coins for amount i. dp[0]=0",
        "arrayState": [0, "∞", "∞", "∞", "∞", "∞", "∞", "∞", "∞", "∞", "∞", "∞"],
        "pointers": [{ "label": "amt", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "amount=1: use coin 1",
        "transientMessage": "dp[1] = dp[1-1]+1 = dp[0]+1 = 1",
        "arrayState": [0, 1, "∞", "∞", "∞", "∞", "∞", "∞", "∞", "∞", "∞", "∞"],
        "pointers": [{ "label": "amt", "index": 1 }],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "amount=2: use coin 2",
        "transientMessage": "dp[2] = min(dp[0]+1, dp[1]+1) = 1",
        "arrayState": [0, 1, 1, "∞", "∞", "∞", "∞", "∞", "∞", "∞", "∞", "∞"],
        "pointers": [{ "label": "amt", "index": 2 }],
        "indices": [0, 2],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "amount=5: use coin 5",
        "transientMessage": "dp[5] = dp[0]+1 = 1 (single coin!)",
        "arrayState": [0, 1, 1, 2, 2, 1, "∞", "∞", "∞", "∞", "∞", "∞"],
        "pointers": [{ "label": "amt", "index": 5 }],
        "indices": [0, 5],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Building up to amount=11",
        "transientMessage": "dp[11] = min(dp[10]+1, dp[9]+1, dp[6]+1)",
        "arrayState": [0, 1, 1, 2, 2, 1, 2, 2, 3, 3, 2, 3],
        "pointers": [{ "label": "amt", "index": 11 }],
        "indices": [6, 9, 10, 11],
        "color": "accent"
    },
    {
        "step": 6,
        "visual": "Answer: 3 coins (5+5+1)",
        "transientMessage": "Minimum coins for 11 = 3 ✅",
        "arrayState": [0, 1, 1, 2, 2, 1, 2, 2, 3, 3, 2, 3],
        "pointers": [],
        "indices": [5, 5, 1],
        "color": "success"
    }
];

// Enhanced animation steps for number-of-islands (BFS/DFS)
const enhancedNumberOfIslands = [
    {
        "step": 1,
        "visual": "Grid 4x5 with 1s and 0s",
        "transientMessage": "Scan grid for unvisited land ('1')",
        "arrayState": [["1", "1", "1", "1", "0"], ["1", "1", "0", "1", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "0", "0", "0"]],
        "pointers": [{ "label": "scan", "index": 0 }],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Found '1' at (0,0)",
        "transientMessage": "Start DFS/BFS → Mark all connected land as visited",
        "arrayState": [["1", "1", "1", "1", "0"], ["1", "1", "0", "1", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "0", "0", "0"]],
        "pointers": [{ "label": "start", "index": 0 }],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "DFS spreads to connected cells",
        "transientMessage": "Marking: (0,0)→(0,1)→(0,2)→(0,3)→(1,0)→(1,1)→(1,3)→(2,0)→(2,1)",
        "arrayState": [["X", "X", "X", "X", "0"], ["X", "X", "0", "X", "0"], ["X", "X", "0", "0", "0"], ["0", "0", "0", "0", "0"]],
        "pointers": [],
        "indices": [0, 1, 2, 3, 5, 6, 8, 10, 11],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Island 1 complete! Continue scanning...",
        "transientMessage": "No more unvisited '1's found. Total islands = 1 ✅",
        "arrayState": [["X", "X", "X", "X", "0"], ["X", "X", "0", "X", "0"], ["X", "X", "0", "0", "0"], ["0", "0", "0", "0", "0"]],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for invert-binary-tree
const enhancedInvertBinaryTree = [
    {
        "step": 1,
        "visual": "    4\n   / \\\n  2   7\n / \\ / \\\n1  3 6  9",
        "transientMessage": "Recursively swap left and right children",
        "arrayState": [4, 2, 7, 1, 3, 6, 9],
        "pointers": [{ "label": "root", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "At node 4: swap children",
        "transientMessage": "4.left ↔ 4.right → 2 ↔ 7",
        "arrayState": [4, 7, 2, 1, 3, 6, 9],
        "pointers": [{ "label": "swap", "index": 0 }],
        "indices": [1, 2],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "At node 7 (now left): swap children",
        "transientMessage": "7.left ↔ 7.right → 6 ↔ 9",
        "arrayState": [4, 7, 2, 9, 6, 3, 1],
        "pointers": [{ "label": "swap", "index": 1 }],
        "indices": [3, 4],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "At node 2 (now right): swap children",
        "transientMessage": "2.left ↔ 2.right → 1 ↔ 3",
        "arrayState": [4, 7, 2, 9, 6, 3, 1],
        "pointers": [{ "label": "swap", "index": 2 }],
        "indices": [5, 6],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "    4\n   / \\\n  7   2\n / \\ / \\\n9  6 3  1",
        "transientMessage": "Tree inverted! ✅",
        "arrayState": [4, 7, 2, 9, 6, 3, 1],
        "pointers": [],
        "indices": [0, 1, 2, 3, 4, 5, 6],
        "color": "success"
    }
];

// Enhanced animation steps for majority-element (Boyer-Moore)
const enhancedMajorityElement = [
    {
        "step": 1,
        "visual": "nums = [3, 2, 3]",
        "transientMessage": "candidate=null, count=0",
        "arrayState": [3, 2, 3],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "i=0: num=3, count=0",
        "transientMessage": "count==0 → candidate=3, count=1",
        "arrayState": [3, 2, 3],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "i=1: num=2 ≠ candidate(3)",
        "transientMessage": "count-- → count=0",
        "arrayState": [3, 2, 3],
        "pointers": [{ "label": "i", "index": 1 }],
        "indices": [1],
        "color": "warning"
    },
    {
        "step": 4,
        "visual": "i=2: num=3, count=0",
        "transientMessage": "count==0 → candidate=3, count=1",
        "arrayState": [3, 2, 3],
        "pointers": [{ "label": "i", "index": 2 }],
        "indices": [0, 2],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: 3",
        "transientMessage": "Majority element is 3 (appears 2 times) ✅",
        "arrayState": [3, 2, 3],
        "pointers": [],
        "indices": [0, 2],
        "color": "success"
    }
];

// Enhanced animation steps for group-anagrams
const enhancedGroupAnagrams = [
    {
        "step": 1,
        "visual": "strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]",
        "transientMessage": "Create hashmap: sorted_word → [words]",
        "arrayState": ["eat", "tea", "tan", "ate", "nat", "bat"],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "\"eat\" → sorted: \"aet\"",
        "transientMessage": "map[\"aet\"] = [\"eat\"]",
        "arrayState": ["eat", "tea", "tan", "ate", "nat", "bat"],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "\"tea\" → sorted: \"aet\"",
        "transientMessage": "map[\"aet\"] = [\"eat\", \"tea\"]",
        "arrayState": ["eat", "tea", "tan", "ate", "nat", "bat"],
        "pointers": [{ "label": "i", "index": 1 }],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "\"tan\" → sorted: \"ant\"",
        "transientMessage": "map[\"ant\"] = [\"tan\"]",
        "arrayState": ["eat", "tea", "tan", "ate", "nat", "bat"],
        "pointers": [{ "label": "i", "index": 2 }],
        "indices": [2],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Continue grouping...",
        "transientMessage": "map[\"aet\"]=[eat,tea,ate], map[\"ant\"]=[tan,nat], map[\"abt\"]=[bat]",
        "arrayState": ["eat", "tea", "tan", "ate", "nat", "bat"],
        "pointers": [],
        "indices": [0, 1, 3],
        "color": "accent"
    },
    {
        "step": 6,
        "visual": "Groups: [[eat,tea,ate],[tan,nat],[bat]]",
        "transientMessage": "Return all hashmap values ✅",
        "arrayState": ["eat", "tea", "tan", "ate", "nat", "bat"],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for longest-consecutive-sequence
const enhancedLongestConsecutiveSequence = [
    {
        "step": 1,
        "visual": "nums = [100, 4, 200, 1, 3, 2]",
        "transientMessage": "Create set: {100, 4, 200, 1, 3, 2}",
        "arrayState": [100, 4, 200, 1, 3, 2],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Check 100: is 99 in set?",
        "transientMessage": "No → 100 is sequence START. Length=1",
        "arrayState": [100, 4, 200, 1, 3, 2],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "Check 1: is 0 in set?",
        "transientMessage": "No → 1 is sequence START. Extend: 1→2→3→4",
        "arrayState": [100, 4, 200, 1, 3, 2],
        "pointers": [{ "label": "start", "index": 3 }],
        "indices": [1, 3, 4, 5],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Sequence from 1: length=4",
        "transientMessage": "1,2,3,4 are consecutive. maxLength=4",
        "arrayState": [100, 4, 200, 1, 3, 2],
        "pointers": [],
        "indices": [1, 3, 4, 5],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: 4",
        "transientMessage": "Longest consecutive sequence is [1,2,3,4] ✅",
        "arrayState": [100, 4, 200, 1, 3, 2],
        "pointers": [],
        "indices": [1, 3, 4, 5],
        "color": "success"
    }
];

// Enhanced animation steps for contains-duplicate-ii
const enhancedContainsDuplicateII = [
    {
        "step": 1,
        "visual": "nums = [1,2,3,1], k = 3",
        "transientMessage": "Sliding window of size k. Track indices in hashmap.",
        "arrayState": [1, 2, 3, 1],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "i=0: num=1",
        "transientMessage": "1 not seen. map[1]=0",
        "arrayState": [1, 2, 3, 1],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "i=1: num=2",
        "transientMessage": "2 not seen. map[2]=1",
        "arrayState": [1, 2, 3, 1],
        "pointers": [{ "label": "i", "index": 1 }],
        "indices": [1],
        "color": "accent"
    },
    {
        "step": 4,
        "visual": "i=2: num=3",
        "transientMessage": "3 not seen. map[3]=2",
        "arrayState": [1, 2, 3, 1],
        "pointers": [{ "label": "i", "index": 2 }],
        "indices": [2],
        "color": "accent"
    },
    {
        "step": 5,
        "visual": "i=3: num=1 seen before!",
        "transientMessage": "1 at index 0. |3-0|=3 ≤ k=3 → TRUE! 🎯",
        "arrayState": [1, 2, 3, 1],
        "pointers": [{ "label": "i", "index": 3 }],
        "indices": [0, 3],
        "color": "success"
    },
    {
        "step": 6,
        "visual": "Answer: true",
        "transientMessage": "Duplicate found within distance k ✅",
        "arrayState": [1, 2, 3, 1],
        "pointers": [],
        "indices": [0, 3],
        "color": "success"
    }
];

// Main function
function main() {
    console.log('Reading solutions.json...');
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    const updates = [
        { slug: 'maximum-subarray', steps: enhancedMaximumSubarray },
        { slug: 'climbing-stairs', steps: enhancedClimbingStairs },
        { slug: 'valid-parentheses', steps: enhancedValidParentheses },
        { slug: 'binary-search', steps: enhancedBinarySearch },
        { slug: 'linked-list-cycle', steps: enhancedLinkedListCycle },
        { slug: 'coin-change', steps: enhancedCoinChange },
        { slug: 'number-of-islands', steps: enhancedNumberOfIslands, type: 'grid' },
        { slug: 'invert-binary-tree', steps: enhancedInvertBinaryTree, type: 'tree' },
        { slug: 'majority-element', steps: enhancedMajorityElement },
        { slug: 'group-anagrams', steps: enhancedGroupAnagrams },
        { slug: 'longest-consecutive-sequence', steps: enhancedLongestConsecutiveSequence },
        { slug: 'contains-duplicate-ii', steps: enhancedContainsDuplicateII }
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
