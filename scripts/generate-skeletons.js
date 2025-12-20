const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

// Structure Definitions
const STRUCT_DEFS = {
    "Tree": `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right`,
    "Linked List": `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next`,
    "Graph": `# Definition for a Node.
# class Node:
#     def __init__(self, val = 0, neighbors = None):
#         self.val = val
#         self.neighbors = neighbors if neighbors is not None else []`
};

function getStructureComment(pattern, code) {
    if (!pattern) return "";
    let defToUse = "";

    // Heuristic matching
    if (pattern.includes("Tree") || code.includes("TreeNode")) defToUse = STRUCT_DEFS["Tree"];
    else if (pattern.includes("Linked List") || code.includes("ListNode")) defToUse = STRUCT_DEFS["Linked List"];
    else if (pattern.includes("Graph") && code.includes("Node")) defToUse = STRUCT_DEFS["Graph"];

    if (!defToUse) return "";

    // Check if already present to avoid double add
    if (code.includes("# Definition for")) return "";

    return defToUse + "\n";
}

function generateSkeleton(code) {
    // Python matcher: def func(...):
    // We want to capture the def line.
    const lines = code.split('\n');
    let defLine = "";
    let indent = "";

    for (const line of lines) {
        if (line.trim().startsWith("def ")) {
            defLine = line;
            // Capture indentation of the next line usually, but for LeetCode root functions, it's 0 indent usually? 
            // Actually python uses indentation. The def line itself has 0 indent usually.
            // The body has 4 spaces.
            indent = "    ";
            break;
        }
        if (line.trim().startsWith("class Solution:")) {
            // If class wrapper exists
            indent = "        ";
        }
    }

    if (!defLine) return code; // Fallback if no def found

    // Construct skeleton
    // If it's a class method, it might need 'self'. 
    // Most of our data is just `def func`.

    return `${defLine}\n${indent}pass`;
}

function generateDocstring(intuition, steps) {
    if ((!intuition || intuition.length === 0) && (!steps || steps.length === 0)) return "";

    let doc = '    """\n';
    if (intuition) {
        doc += '    Intuition:\n';
        intuition.forEach(line => doc += `    - ${line}\n`);
    }
    if (steps) {
        doc += '\n    Algorithm:\n';
        steps.forEach(s => doc += `    ${s.step}. ${s.title} - ${s.explanation}\n`);
    }
    doc += '    """\n';
    return doc;
}

function main() {
    console.log("=== Generating Skeletons & Comments ===");
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));
    let updated = 0;

    Object.values(data.solutions).forEach(sol => {
        const originalCode = sol.code || "";

        // 1. Structure Definition
        const structComment = getStructureComment(sol.pattern, originalCode);

        // 2. Docstring (for Explain Mode)
        const docstring = generateDocstring(sol.intuition, sol.steps);

        // Insert docstring after the def line
        let explainCode = originalCode;
        if (docstring) {
            const lines = explainCode.split('\n');
            const defIndex = lines.findIndex(l => l.trim().startsWith("def "));
            if (defIndex !== -1) {
                // Insert after def
                lines.splice(defIndex + 1, 0, docstring.trimEnd());
                explainCode = lines.join('\n');
            }
        }

        // Prepend structure to Explain Code
        if (structComment) {
            explainCode = structComment + explainCode;
        }

        // 3. Skeleton (for Playground)
        let skeleton = generateSkeleton(originalCode);

        // Prepend structure to Skeleton
        if (structComment) {
            skeleton = structComment + skeleton;
        }

        // Update Solution Object
        // We update 'code' to be the rich version
        // We add 'initialCode' as the skeleton

        // Only update if changes are meaningful
        if (sol.code !== explainCode || sol.initialCode !== skeleton) {
            sol.code = explainCode;
            sol.initialCode = skeleton;
            updated++;
        }
    });

    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(data, null, 2));
    console.log(`Updated ${updated} solutions with skeletons and comments.`);
}

main();
