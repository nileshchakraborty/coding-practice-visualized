const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

// Common mistakes by pattern
const COMMON_MISTAKES = {
    "Two Pointers": [
        "Forgetting to handle the case when array is empty",
        "Off-by-one errors in pointer movement",
        "Not considering duplicates"
    ],
    "Sliding Window": [
        "Not updating the window properly when shrinking",
        "Forgetting to reset window state",
        "Edge case: window larger than input"
    ],
    "Binary Search": [
        "Infinite loop due to wrong mid calculation",
        "Off-by-one in left/right bounds",
        "Not handling empty array"
    ],
    "Dynamic Programming": [
        "Wrong base case initialization",
        "Incorrect recurrence relation",
        "Not considering all subproblem dependencies"
    ],
    "Hash Map": [
        "Not handling duplicate keys",
        "Forgetting to check if key exists",
        "Using unhashable types as keys"
    ],
    "Tree": [
        "Not handling null/empty tree",
        "Incorrect traversal order",
        "Stack overflow on deep trees"
    ],
    "Graph": [
        "Forgetting to mark nodes as visited",
        "Not handling disconnected components",
        "Wrong initialization of distance array"
    ],
    "Linked List": [
        "Losing reference to head",
        "Not handling single node case",
        "Creating cycles accidentally"
    ],
    "Stack": [
        "Popping from empty stack",
        "Not clearing stack between operations",
        "Incorrect order of push/pop"
    ],
    "Backtracking": [
        "Not undoing choices properly",
        "Missing pruning conditions",
        "Duplicates in result"
    ]
};

const DEFAULT_MISTAKES = [
    "Not handling edge cases (empty input, single element)",
    "Integer overflow for large inputs",
    "Time limit exceeded due to inefficient approach"
];

// Interview tips by pattern
const INTERVIEW_TIPS = {
    "Two Pointers": "Clarify if array is sorted. Mention time: O(n), space: O(1).",
    "Sliding Window": "Explain window expansion/contraction. Handle 'exactly k' vs 'at most k'.",
    "Binary Search": "Mention O(log n). Discuss edge handling: left-most vs right-most.",
    "Dynamic Programming": "Start with brute force, add memoization, then optimize to tabulation.",
    "Hash Map": "Trade-off: O(n) space for O(1) lookup. Discuss collision handling.",
    "Tree": "Ask: BST or general tree? Discuss iterative vs recursive trade-offs.",
    "Graph": "Clarify: directed/undirected, weighted/unweighted. Mention BFS for shortest path.",
    "Backtracking": "Explain pruning strategy. Discuss how to avoid duplicates.",
    "Linked List": "Use dummy node to simplify edge cases. Mention in-place modification."
};

function getPatternKey(pattern) {
    if (!pattern) return null;
    return Object.keys(COMMON_MISTAKES).find(k =>
        pattern.toLowerCase().includes(k.toLowerCase())
    );
}

function main() {
    console.log("=== Deep Solutions Enhancement ===");
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    let enhanced = 0;
    let missingWalkthrough = 0;

    Object.values(data.solutions).forEach(sol => {
        const patternKey = getPatternKey(sol.pattern);

        // Add common mistakes
        if (!sol.commonMistakes || sol.commonMistakes.length === 0) {
            sol.commonMistakes = COMMON_MISTAKES[patternKey] || DEFAULT_MISTAKES;
        }

        // Add interview tips
        if (!sol.interviewTip) {
            sol.interviewTip = INTERVIEW_TIPS[patternKey] || "Discuss time/space complexity. Handle edge cases explicitly.";
        }

        // Check walkthrough
        if (!sol.walkthrough || sol.walkthrough.length < 3) {
            // Generate walkthrough from intuition
            sol.walkthrough = [
                "Understand the problem constraints",
                ...(sol.intuition || []).slice(0, 2),
                "Implement solution with proper edge case handling",
                "Test with examples and verify complexity"
            ];
            missingWalkthrough++;
        }

        enhanced++;
    });

    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(data, null, 2));
    console.log(`Enhanced ${enhanced} solutions.`);
    console.log(`Fixed ${missingWalkthrough} incomplete walkthroughs.`);
}

main();
