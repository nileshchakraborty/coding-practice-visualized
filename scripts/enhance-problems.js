const fs = require('fs');
const path = require('path');

const PROBLEMS_PATH = path.join(__dirname, '../api/data/problems.json');
const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

// Algorithm hints by pattern
const ALGORITHM_HINTS = {
    "Two Pointers": "Use left/right pointers moving toward each other or same direction.",
    "Sliding Window": "Maintain a window, expand right, shrink left when condition breaks.",
    "Binary Search": "If sorted, use binary search. Eliminate half the search space each step.",
    "Dynamic Programming": "Define state, find recurrence relation, handle base cases.",
    "Hash Map": "Use hash map for O(1) lookup. Store complements or counts.",
    "Stack": "Use stack for matching pairs or monotonic sequences.",
    "Heap": "Use heap for top-k problems or priority-based processing.",
    "Tree": "Consider DFS (pre/in/post-order) or BFS (level-order).",
    "Graph": "Use BFS for shortest path, DFS for exploration, Union-Find for connectivity.",
    "Backtracking": "Try all possibilities, prune invalid branches early.",
    "Greedy": "Make locally optimal choice at each step.",
    "Linked List": "Use dummy node, slow/fast pointers, or reverse in-place.",
    "Bit Manipulation": "Use XOR, AND, OR operations. Think binary representation.",
    "Math": "Look for patterns, use modular arithmetic, or mathematical formulas.",
    "Array / String": "Consider sorting, two pointers, or hash-based approaches."
};

// Difficulty reasons
const DIFFICULTY_REASONS = {
    "Easy": "Single technique, straightforward logic, minimal edge cases.",
    "Medium": "Combines techniques, requires careful implementation, multiple edge cases.",
    "Hard": "Multiple advanced techniques, complex state management, many edge cases."
};

// Build related problems map by pattern
function buildRelatedMap(solutions) {
    const patternMap = {};
    Object.entries(solutions.solutions).forEach(([slug, sol]) => {
        const pattern = sol.pattern || 'General';
        if (!patternMap[pattern]) patternMap[pattern] = [];
        patternMap[pattern].push(slug);
    });
    return patternMap;
}

function main() {
    console.log("=== Enhancing Problems with Hints & Related ===");
    const problems = JSON.parse(fs.readFileSync(PROBLEMS_PATH, 'utf8'));
    const solutions = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    const relatedMap = buildRelatedMap(solutions);
    let enhanced = 0;

    if (problems.categories) {
        problems.categories.forEach(cat => {
            cat.problems.forEach(p => {
                const sol = solutions.solutions[p.slug];
                const pattern = sol?.pattern || p.subTopic || 'General';

                // Add algorithm hint
                const hintKey = Object.keys(ALGORITHM_HINTS).find(k =>
                    pattern.toLowerCase().includes(k.toLowerCase()) ||
                    (p.subTopic && p.subTopic.toLowerCase().includes(k.toLowerCase()))
                );
                if (!p.algorithmHint) {
                    p.algorithmHint = ALGORITHM_HINTS[hintKey] || "Analyze the constraints and look for patterns.";
                }

                // Add difficulty reason
                if (!p.difficultyReason) {
                    p.difficultyReason = DIFFICULTY_REASONS[p.difficulty] || "Standard algorithmic problem.";
                }

                // Add related problems (same pattern, excluding self)
                if (!p.relatedProblems || p.relatedProblems.length === 0) {
                    const related = (relatedMap[pattern] || [])
                        .filter(slug => slug !== p.slug)
                        .slice(0, 3);
                    p.relatedProblems = related;
                }

                enhanced++;
            });
        });
    }

    fs.writeFileSync(PROBLEMS_PATH, JSON.stringify(problems, null, 2));
    console.log(`Enhanced ${enhanced} problems with hints, reasons, and related links.`);
}

main();
