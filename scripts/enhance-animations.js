/**
 * Script to enhance animation steps in solutions.json
 * Run: node scripts/enhance-animations.js
 */

const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../data/solutions.json');

// Enhanced animation steps for merge-sorted-array
const enhancedMergeSortedArray = [
    {
        "step": 1,
        "visual": "nums1: [1,2,3,0,0,0]    nums2: [2,5,6]",
        "transientMessage": "p1 at last real element, p2 at end of nums2, write at end",
        "arrayState": [1, 2, 3, 0, 0, 0],
        "pointers": [
            { "label": "p1", "index": 2 },
            { "label": "write", "index": 5 }
        ],
        "indices": [2, 5],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Compare: nums1[p1]=3 vs nums2[p2]=6",
        "transientMessage": "6 > 3, so place 6 at write position",
        "arrayState": [1, 2, 3, 0, 0, 6],
        "pointers": [
            { "label": "p1", "index": 2 },
            { "label": "write", "index": 5 }
        ],
        "indices": [5],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Placed 6, move p2 and write left",
        "transientMessage": "p2-- → 1, write-- → 4",
        "arrayState": [1, 2, 3, 0, 0, 6],
        "pointers": [
            { "label": "p1", "index": 2 },
            { "label": "write", "index": 4 }
        ],
        "indices": [2, 4],
        "color": "accent"
    },
    {
        "step": 4,
        "visual": "Compare: nums1[p1]=3 vs nums2[p2]=5",
        "transientMessage": "5 > 3, so place 5 at write position",
        "arrayState": [1, 2, 3, 0, 5, 6],
        "pointers": [
            { "label": "p1", "index": 2 },
            { "label": "write", "index": 4 }
        ],
        "indices": [4],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Placed 5, move p2 and write left",
        "transientMessage": "p2-- → 0, write-- → 3",
        "arrayState": [1, 2, 3, 0, 5, 6],
        "pointers": [
            { "label": "p1", "index": 2 },
            { "label": "write", "index": 3 }
        ],
        "indices": [2, 3],
        "color": "accent"
    },
    {
        "step": 6,
        "visual": "Compare: nums1[p1]=3 vs nums2[p2]=2",
        "transientMessage": "3 > 2, so place 3 at write position",
        "arrayState": [1, 2, 3, 3, 5, 6],
        "pointers": [
            { "label": "p1", "index": 2 },
            { "label": "write", "index": 3 }
        ],
        "indices": [3],
        "color": "success"
    },
    {
        "step": 7,
        "visual": "Placed 3, move p1 and write left",
        "transientMessage": "p1-- → 1, write-- → 2",
        "arrayState": [1, 2, 3, 3, 5, 6],
        "pointers": [
            { "label": "p1", "index": 1 },
            { "label": "write", "index": 2 }
        ],
        "indices": [1, 2],
        "color": "accent"
    },
    {
        "step": 8,
        "visual": "Compare: nums1[p1]=2 vs nums2[p2]=2",
        "transientMessage": "Equal! Place nums2[p2]=2 at write position",
        "arrayState": [1, 2, 2, 3, 5, 6],
        "pointers": [
            { "label": "p1", "index": 1 },
            { "label": "write", "index": 2 }
        ],
        "indices": [2],
        "color": "success"
    },
    {
        "step": 9,
        "visual": "Placed 2, p2 becomes -1 (exhausted)",
        "transientMessage": "nums2 exhausted! nums1 elements already in place ✅",
        "arrayState": [1, 2, 2, 3, 5, 6],
        "pointers": [
            { "label": "p1", "index": 1 }
        ],
        "indices": [],
        "color": "success"
    },
    {
        "step": 10,
        "visual": "Final Result: [1,2,2,3,5,6]",
        "transientMessage": "Merge complete! All elements sorted in nums1",
        "arrayState": [1, 2, 2, 3, 5, 6],
        "pointers": [],
        "indices": [0, 1, 2, 3, 4, 5],
        "color": "success"
    }
];

// Enhanced animation steps for two-sum
const enhancedTwoSum = [
    {
        "step": 1,
        "visual": "nums = [2, 7, 11, 15], target = 9",
        "transientMessage": "Create empty hashmap to store seen values",
        "arrayState": [2, 7, 11, 15],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "i=0: num=2, complement=9-2=7",
        "transientMessage": "Is 7 in hashmap? No. Store {2: 0}",
        "arrayState": [2, 7, 11, 15],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "i=1: num=7, complement=9-7=2",
        "transientMessage": "Is 2 in hashmap? YES! Found at index 0 🎯",
        "arrayState": [2, 7, 11, 15],
        "pointers": [{ "label": "i", "index": 1 }],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Answer: [0, 1]",
        "transientMessage": "nums[0] + nums[1] = 2 + 7 = 9 ✅",
        "arrayState": [2, 7, 11, 15],
        "pointers": [],
        "indices": [0, 1],
        "color": "success"
    }
];

// Enhanced animation steps for valid-palindrome
const enhancedValidPalindrome = [
    {
        "step": 1,
        "visual": "s = \"A man, a plan, a canal: Panama\"",
        "transientMessage": "Set left=0, right=len-1",
        "arrayState": ["A", " ", "m", "a", "n", ",", " ", "a", " ", "p", "l", "a", "n", ",", " ", "a", " ", "c", "a", "n", "a", "l", ":", " ", "P", "a", "n", "a", "m", "a"],
        "pointers": [{ "label": "L", "index": 0 }, { "label": "R", "index": 29 }],
        "indices": [0, 29],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Compare 'A' vs 'a' (lowercase both)",
        "transientMessage": "'a' == 'a' ✓ Move pointers inward",
        "arrayState": ["A", " ", "m", "a", "n", ",", " ", "a", " ", "p", "l", "a", "n", ",", " ", "a", " ", "c", "a", "n", "a", "l", ":", " ", "P", "a", "n", "a", "m", "a"],
        "pointers": [{ "label": "L", "index": 0 }, { "label": "R", "index": 29 }],
        "indices": [0, 29],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Skip non-alphanumeric ' ' at left",
        "transientMessage": "left++ until alphanumeric found",
        "arrayState": ["A", " ", "m", "a", "n", ",", " ", "a", " ", "p", "l", "a", "n", ",", " ", "a", " ", "c", "a", "n", "a", "l", ":", " ", "P", "a", "n", "a", "m", "a"],
        "pointers": [{ "label": "L", "index": 2 }, { "label": "R", "index": 28 }],
        "indices": [2, 28],
        "color": "accent"
    },
    {
        "step": 4,
        "visual": "Compare 'm' vs 'm'",
        "transientMessage": "'m' == 'm' ✓ Continue matching",
        "arrayState": ["A", " ", "m", "a", "n", ",", " ", "a", " ", "p", "l", "a", "n", ",", " ", "a", " ", "c", "a", "n", "a", "l", ":", " ", "P", "a", "n", "a", "m", "a"],
        "pointers": [{ "label": "L", "index": 2 }, { "label": "R", "index": 28 }],
        "indices": [2, 28],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "...continuing comparisons...",
        "transientMessage": "All characters match when pointers meet!",
        "arrayState": ["A", " ", "m", "a", "n", ",", " ", "a", " ", "p", "l", "a", "n", ",", " ", "a", " ", "c", "a", "n", "a", "l", ":", " ", "P", "a", "n", "a", "m", "a"],
        "pointers": [{ "label": "L", "index": 14 }, { "label": "R", "index": 15 }],
        "indices": [14, 15],
        "color": "accent"
    },
    {
        "step": 6,
        "visual": "Result: true",
        "transientMessage": "Pointers crossed - It's a palindrome! ✅",
        "arrayState": ["A", " ", "m", "a", "n", ",", " ", "a", " ", "p", "l", "a", "n", ",", " ", "a", " ", "c", "a", "n", "a", "l", ":", " ", "P", "a", "n", "a", "m", "a"],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// Enhanced animation steps for remove-element
const enhancedRemoveElement = [
    {
        "step": 1,
        "visual": "nums = [3,2,2,3], val = 3",
        "transientMessage": "Two pointers: k=0 (write position), i=0 (scan)",
        "arrayState": [3, 2, 2, 3],
        "pointers": [{ "label": "k", "index": 0 }, { "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "i=0: nums[0]=3 == val",
        "transientMessage": "Skip this element (don't copy to k)",
        "arrayState": [3, 2, 2, 3],
        "pointers": [{ "label": "k", "index": 0 }, { "label": "i", "index": 0 }],
        "indices": [0],
        "color": "warning"
    },
    {
        "step": 3,
        "visual": "i=1: nums[1]=2 != val",
        "transientMessage": "Copy 2 to position k, then k++",
        "arrayState": [2, 2, 2, 3],
        "pointers": [{ "label": "k", "index": 1 }, { "label": "i", "index": 1 }],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "i=2: nums[2]=2 != val",
        "transientMessage": "Copy 2 to position k, then k++",
        "arrayState": [2, 2, 2, 3],
        "pointers": [{ "label": "k", "index": 2 }, { "label": "i", "index": 2 }],
        "indices": [1, 2],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "i=3: nums[3]=3 == val",
        "transientMessage": "Skip this element",
        "arrayState": [2, 2, 2, 3],
        "pointers": [{ "label": "k", "index": 2 }, { "label": "i", "index": 3 }],
        "indices": [3],
        "color": "warning"
    },
    {
        "step": 6,
        "visual": "Final: k=2, nums = [2,2,_,_]",
        "transientMessage": "Return k=2 (2 elements remaining after removal) ✅",
        "arrayState": [2, 2, 2, 3],
        "pointers": [],
        "indices": [0, 1],
        "color": "success"
    }
];

// Enhanced animation steps for contains-duplicate
const enhancedContainsDuplicate = [
    {
        "step": 1,
        "visual": "nums = [1, 2, 3, 1]",
        "transientMessage": "Create empty hash set to track seen numbers",
        "arrayState": [1, 2, 3, 1],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "i=0: num=1",
        "transientMessage": "1 not in set. Add to set: {1}",
        "arrayState": [1, 2, 3, 1],
        "pointers": [{ "label": "i", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "i=1: num=2",
        "transientMessage": "2 not in set. Add to set: {1, 2}",
        "arrayState": [1, 2, 3, 1],
        "pointers": [{ "label": "i", "index": 1 }],
        "indices": [1],
        "color": "accent"
    },
    {
        "step": 4,
        "visual": "i=2: num=3",
        "transientMessage": "3 not in set. Add to set: {1, 2, 3}",
        "arrayState": [1, 2, 3, 1],
        "pointers": [{ "label": "i", "index": 2 }],
        "indices": [2],
        "color": "accent"
    },
    {
        "step": 5,
        "visual": "i=3: num=1",
        "transientMessage": "1 IS in set! Duplicate found! 🎯",
        "arrayState": [1, 2, 3, 1],
        "pointers": [{ "label": "i", "index": 3 }],
        "indices": [0, 3],
        "color": "success"
    },
    {
        "step": 6,
        "visual": "Answer: true",
        "transientMessage": "Duplicate exists at indices 0 and 3 ✅",
        "arrayState": [1, 2, 3, 1],
        "pointers": [],
        "indices": [0, 3],
        "color": "success"
    }
];

// Enhanced animation steps for reverse-linked-list
const enhancedReverseLinkedList = [
    {
        "step": 1,
        "visual": "1 → 2 → 3 → 4 → 5 → null",
        "transientMessage": "prev=null, curr=head(1)",
        "arrayState": [1, 2, 3, 4, 5],
        "pointers": [{ "label": "prev", "index": -1 }, { "label": "curr", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Save next: next = 2",
        "transientMessage": "Reverse link: 1.next = null (prev)",
        "arrayState": [1, 2, 3, 4, 5],
        "pointers": [{ "label": "prev", "index": -1 }, { "label": "curr", "index": 0 }, { "label": "next", "index": 1 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 3,
        "visual": "null ← 1    2 → 3 → 4 → 5",
        "transientMessage": "Move: prev=1, curr=2",
        "arrayState": [1, 2, 3, 4, 5],
        "pointers": [{ "label": "prev", "index": 0 }, { "label": "curr", "index": 1 }],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "null ← 1 ← 2    3 → 4 → 5",
        "transientMessage": "Reverse link: 2.next = 1",
        "arrayState": [1, 2, 3, 4, 5],
        "pointers": [{ "label": "prev", "index": 1 }, { "label": "curr", "index": 2 }],
        "indices": [1, 2],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "null ← 1 ← 2 ← 3    4 → 5",
        "transientMessage": "Reverse link: 3.next = 2",
        "arrayState": [1, 2, 3, 4, 5],
        "pointers": [{ "label": "prev", "index": 2 }, { "label": "curr", "index": 3 }],
        "indices": [2, 3],
        "color": "success"
    },
    {
        "step": 6,
        "visual": "null ← 1 ← 2 ← 3 ← 4    5",
        "transientMessage": "Reverse link: 4.next = 3",
        "arrayState": [1, 2, 3, 4, 5],
        "pointers": [{ "label": "prev", "index": 3 }, { "label": "curr", "index": 4 }],
        "indices": [3, 4],
        "color": "success"
    },
    {
        "step": 7,
        "visual": "null ← 1 ← 2 ← 3 ← 4 ← 5",
        "transientMessage": "Reverse link: 5.next = 4, curr=null (done!)",
        "arrayState": [5, 4, 3, 2, 1],
        "pointers": [{ "label": "prev", "index": 0 }],
        "indices": [0, 1, 2, 3, 4],
        "color": "success"
    },
    {
        "step": 8,
        "visual": "5 → 4 → 3 → 2 → 1 → null",
        "transientMessage": "Return prev (new head = 5) ✅",
        "arrayState": [5, 4, 3, 2, 1],
        "pointers": [],
        "indices": [0, 1, 2, 3, 4],
        "color": "success"
    }
];

// Main function
function main() {
    console.log('Reading solutions.json...');
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    // Update merge-sorted-array
    if (data.solutions['merge-sorted-array']) {
        data.solutions['merge-sorted-array'].animationSteps = enhancedMergeSortedArray;
        console.log('✓ Updated merge-sorted-array');
    }

    // Update two-sum
    if (data.solutions['two-sum']) {
        data.solutions['two-sum'].animationSteps = enhancedTwoSum;
        console.log('✓ Updated two-sum');
    }

    // Update valid-palindrome
    if (data.solutions['valid-palindrome']) {
        data.solutions['valid-palindrome'].animationSteps = enhancedValidPalindrome;
        console.log('✓ Updated valid-palindrome');
    }

    // Update remove-element
    if (data.solutions['remove-element']) {
        data.solutions['remove-element'].animationSteps = enhancedRemoveElement;
        console.log('✓ Updated remove-element');
    }

    // Update contains-duplicate
    if (data.solutions['contains-duplicate']) {
        data.solutions['contains-duplicate'].animationSteps = enhancedContainsDuplicate;
        console.log('✓ Updated contains-duplicate');
    }

    // Update reverse-linked-list
    if (data.solutions['reverse-linked-list']) {
        data.solutions['reverse-linked-list'].animationSteps = enhancedReverseLinkedList;
        data.solutions['reverse-linked-list'].visualizationType = 'linkedlist';
        console.log('✓ Updated reverse-linked-list');
    }

    // Write back
    console.log('Writing updated solutions.json...');
    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(data, null, 2));
    console.log('✅ Done! Enhanced animation steps for 6 solutions.');
}

main();
