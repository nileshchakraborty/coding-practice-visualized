const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

const COMMON_RULES = [
    // Data Structures
    { regex: /dp\s*=\s*(.*)/, comment: "Initialize DP table to store results." },
    { regex: /stack\s*=\s*\[\]/, comment: "Initialize stack for tracking." },
    { regex: /q\s*=\s*deque/, comment: "Initialize queue for BFS." },
    { regex: /heapq\.heapify/, comment: "Convert list into a heap." },
    { regex: /seen\s*=\s*set/, comment: "Keep track of visited elements." },
    { regex: /res\s*=\s*0/, comment: "Initialize result variable." },
    { regex: /res\s*=\s*\[\]/, comment: "Initialize list to store results." },

    // Pointers & Initialization
    { regex: /l,\s*r\s*=\s*/, comment: "Initialize two pointers." },
    { regex: /p1,\s*p2\s*=\s*/, comment: "Initialize pointers for merging." },
    { regex: /slow,\s*fast\s*=\s*/, comment: "Initialize slow and fast pointers." },
    { regex: /slow\s*=\s*fast\s*=\s*head/, comment: "Initialize cycle detection pointers." },

    // Linked List
    { regex: /dummy\s*=\s*ListNode/, comment: "Use dummy node to simplify edge cases." },
    { regex: /tail\s*=\s*dummy/, comment: "Initialize tail pointer." },
    { regex: /cur\s*=\s*dummy/, comment: "Initialize current pointer." },
    { regex: /prev\s*=\s*dummy/, comment: "Initialize previous pointer." },

    // Tree Construction & Traversal
    { regex: /TreeNode\(/, comment: "Create a new Tree Node." },
    { regex: /idx_map\s*=\s*{/, comment: "Map values to indices for O(1) lookup." },
    { regex: /inorder\(.*\)/, comment: "Recursive inorder traversal." },
    { regex: /preorder\(.*\)/, comment: "Recursive preorder traversal." },

    // Math & Strings
    { regex: /sum\(nums\)/, comment: "Calculate sum of all elements." },
    { regex: /strip\(\)/, comment: "Remove whitespace." },
    { regex: /split\(\)/, comment: "Split string into list." },
    { regex: /\[::-1\]/, comment: "Reverse the sequence." },
    { regex: /\.find\(/, comment: "Find index of substring." },
    { regex: /n\s*\/\/=\s*5/, comment: "Count factors of 5." },

    // Bit Manipulation
    { regex: /n\s*&=\s*n\s*-\s*1/, comment: "Remove lowest set bit (Brian Kernighan's Algorithm)." },
    { regex: />>=\s*1/, comment: "Right shift to process next bit." },
    { regex: /<<\s*shift/, comment: "Left shift by count." },
    { regex: /n\s*&\s*1/, comment: "Check if last bit is set (odd)." },
    { regex: /a\s*\^\s*b/, comment: "XOR (Sum without carry)." },
    { regex: /a\s*&\s*b/, comment: "AND (Carry bits)." },

    // Control Flow
    { regex: /for\s+.*\s+in\s+range/, comment: "Iterate through the range." },
    { regex: /for\s+.*\s+in\s+.*:/, comment: "Iterate over elements." },
    { regex: /while\s+l\s*<\s*r:/, comment: "Continue until pointers meet." },
    { regex: /while\s+queue:/, comment: "Process nodes until queue is empty." },
    { regex: /while\s+fast\s+and\s+fast.next:/, comment: "Traverse until end of list." },
    { regex: /while\s+l1\s+or\s+l2\s+or\s+carry:/, comment: "Process digits and carry." },
    { regex: /if\s+not\s+root:/, comment: "Base case: Check if tree is empty." },
    { regex: /if\s+.*in\s+seen:/, comment: "Check if already visited." },

    // Operations & Logic (Last 5%)
    { regex: /append\(/, comment: "Add to end." },
    { regex: /pop\(/, comment: "Remove and return last element." },
    { regex: /popleft\(/, comment: "Remove from front of queue." },
    { regex: /max\(/, comment: "Take the maximum value." },
    { regex: /min\(/, comment: "Take the minimum value." },
    { regex: /n\s*\*\s*\(n\s*\+\s*1\)\s*\/\/\s*2/, comment: "Gauss formula for sum of N numbers." },
    { regex: /before.*=.*beforeHead.*=/, comment: "Initialize two lists for partitioning." },
    { regex: /if.*head\.val\s*<\s*x/, comment: "Check logic for partition." },
    { regex: /if\s+curr\.left:/, comment: "Check if left child exists." },
    { regex: /curr\s*=\s*curr\s*\*\s*10/, comment: "Append digit to current number." },
    { regex: /if\s+p\.val\s*<\s*root\.val/, comment: "Traverse based on BST property." },
    { regex: /n\s*%\s*2\s*==\s*0/, comment: "Check for even number." },
    { regex: /class\s+Node:/, comment: "Node definition with random pointer." },
    { regex: /oldToCopy\s*=\s*{/, comment: "Map old nodes to new copies." },

    // Returns
    { regex: /return\s+res/, comment: "Return the final result." },
    { regex: /return\s+dp\[-1\]/, comment: "Return the result from DP table." },
    { regex: /return\s+True/, comment: "Condition satisfied." },
    { regex: /return\s+False/, comment: "Condition not met." },
    { regex: /return\s+slow/, comment: "Return the result node." },
    { regex: /return\s+dummy.next/, comment: "Return head of the new list." }
];

const PATTERN_RULES = {
    "Tree": [
        { regex: /root\.left/, comment: "Process left child." },
        { regex: /root\.right/, comment: "Process right child." },
        { regex: /dfs\(/, comment: "Recursive DFS call." }
    ],
    "Linked List": [
        { regex: /\.next/, comment: "Move to next node." },
        { regex: /dummy/, comment: "Use dummy node to handle edge cases." }
    ],
    "Binary Search": [
        { regex: /mid\s*=\s*/, comment: "Calculate middle index." },
        { regex: /left\s*=\s*mid\s*\+\s*1/, comment: "Search right half." },
        { regex: /right\s*=\s*mid\s*-\s*1/, comment: "Search left half." }
    ]
};

function addComment(line, pattern) {
    // Determine indentation
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith('"""')) return line; // Skip comments/docstrings/empty

    let comment = "";

    // Check Pattern Specifics first
    if (pattern && PATTERN_RULES[pattern]) {
        for (const rule of PATTERN_RULES[pattern]) {
            if (rule.regex.test(trimmed)) {
                comment = rule.comment;
                break; // One comment per line max
            }
        }
    }

    // Check Common Rules fallback
    if (!comment) {
        for (const rule of COMMON_RULES) {
            if (rule.regex.test(trimmed)) {
                comment = rule.comment;
                break;
            }
        }
    }

    if (comment) {
        // Pad to ensure comment is aligned? 
        // Simple approach: 2 spaces after code
        return `${line}  # ${comment}`;
    }

    return line;
}

function main() {
    console.log("=== Injecting Line-by-Line Comments ===");
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));
    let updated = 0;

    Object.values(data.solutions).forEach(sol => {
        let lines = sol.code.split('\n');
        let newLines = [];
        let inDocstring = false;

        lines.forEach(line => {
            if (line.trim().startsWith('"""')) {
                inDocstring = !inDocstring;
                newLines.push(line);
                return;
            }
            if (inDocstring) {
                newLines.push(line);
                return;
            }

            // Inject
            // Heuristic to avoid double commenting
            if (line.includes("#")) {
                newLines.push(line); // Already commented
            } else {
                newLines.push(addComment(line, sol.pattern));
            }
        });

        const newCode = newLines.join('\n');
        if (newCode !== sol.code) {
            sol.code = newCode;
            updated++;
        }
    });

    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(data, null, 2));
    console.log(`Injected comments into ${updated} solutions.`);
}

main();
