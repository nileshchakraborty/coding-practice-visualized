const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');
const PROBLEMS_PATH = path.join(__dirname, '../api/data/problems.json');

// Pattern-based example templates
const EXAMPLE_TEMPLATES = {
    "Two Pointers": [
        { input: "nums = [1, 2, 3, 4]", output: "[result]", explanation: "Two pointers traverse from both ends." },
        { input: "nums = [0, 1]", output: "[result]", explanation: "Edge case with minimum input." }
    ],
    "Sliding Window": [
        { input: "s = \"abcabcbb\"", output: "3", explanation: "Sliding window expands until duplicate, then shrinks." },
        { input: "s = \"bbbbb\"", output: "1", explanation: "All same characters." }
    ],
    "Dynamic Programming": [
        { input: "nums = [1, 2, 3]", output: "[result]", explanation: "Build solution from smaller subproblems." },
        { input: "nums = [1]", output: "[base case]", explanation: "Base case with single element." }
    ],
    "Binary Search": [
        { input: "nums = [1, 2, 3, 4, 5], target = 3", output: "2", explanation: "Target found at index 2." },
        { input: "nums = [1, 2, 3], target = 0", output: "-1", explanation: "Target not found." }
    ],
    "Hash Map": [
        { input: "nums = [2, 7, 11, 15], target = 9", output: "[0, 1]", explanation: "Hash map stores complements." },
        { input: "nums = [3, 3], target = 6", output: "[0, 1]", explanation: "Same values, different indices." }
    ],
    "Tree": [
        { input: "root = [1, 2, 3]", output: "[result]", explanation: "Traverse tree structure." },
        { input: "root = []", output: "null", explanation: "Empty tree edge case." }
    ],
    "Linked List": [
        { input: "head = [1, 2, 3, 4, 5]", output: "[result]", explanation: "Process linked list nodes." },
        { input: "head = [1]", output: "[1]", explanation: "Single node edge case." }
    ],
    "Graph": [
        { input: "n = 4, edges = [[0,1],[1,2],[2,3]]", output: "[result]", explanation: "Graph traversal." },
        { input: "n = 1, edges = []", output: "[result]", explanation: "Single node, no edges." }
    ],
    "Stack": [
        { input: "s = \"()[]{}\"", output: "true", explanation: "Valid parentheses matching." },
        { input: "s = \"(]\"", output: "false", explanation: "Mismatched brackets." }
    ],
    "Backtracking": [
        { input: "nums = [1, 2, 3]", output: "[[1,2,3], [1,3,2], ...]", explanation: "Generate all permutations." },
        { input: "nums = [1]", output: "[[1]]", explanation: "Single element." }
    ]
};

// Pattern-based constraints
const CONSTRAINT_TEMPLATES = {
    "Two Pointers": ["1 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "Array is sorted (if applicable)"],
    "Sliding Window": ["1 <= s.length <= 10^5", "s consists of printable ASCII characters"],
    "Dynamic Programming": ["1 <= n <= 10^4", "0 <= values[i] <= 10^4"],
    "Binary Search": ["1 <= nums.length <= 10^4", "-10^4 <= nums[i] <= 10^4", "Array is sorted"],
    "Hash Map": ["1 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "Only one valid answer exists"],
    "Tree": ["Number of nodes: [0, 10^4]", "-10^4 <= Node.val <= 10^4"],
    "Linked List": ["Number of nodes: [0, 10^4]", "-10^4 <= Node.val <= 10^4"],
    "Graph": ["1 <= n <= 10^3", "0 <= edges.length <= n * (n - 1) / 2"],
    "Stack": ["1 <= s.length <= 10^4", "s consists of brackets: ()[]{}"],
    "Backtracking": ["1 <= nums.length <= 10", "All elements are unique"]
};

const DEFAULT_EXAMPLES = [
    { input: "Example input", output: "Expected output", explanation: "Basic case." },
    { input: "Edge case input", output: "Edge output", explanation: "Handles edge cases." }
];

const DEFAULT_CONSTRAINTS = ["1 <= n <= 10^4", "Valid input guaranteed"];

function getPatternKey(pattern) {
    if (!pattern) return null;
    return Object.keys(EXAMPLE_TEMPLATES).find(k =>
        pattern.toLowerCase().includes(k.toLowerCase())
    );
}

function main() {
    console.log("=== Filling Missing Examples & Constraints ===");
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    let filledExamples = 0;
    let filledConstraints = 0;

    Object.values(data.solutions).forEach(sol => {
        const patternKey = getPatternKey(sol.pattern);

        // Fill examples
        if (!sol.examples || sol.examples.length === 0) {
            sol.examples = EXAMPLE_TEMPLATES[patternKey] || DEFAULT_EXAMPLES;
            filledExamples++;
        }

        // Fill constraints
        if (!sol.constraints || sol.constraints.length === 0) {
            sol.constraints = CONSTRAINT_TEMPLATES[patternKey] || DEFAULT_CONSTRAINTS;
            filledConstraints++;
        }
    });

    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(data, null, 2));
    console.log(`Filled ${filledExamples} examples and ${filledConstraints} constraints.`);
}

main();
