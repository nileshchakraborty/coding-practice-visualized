const fs = require('fs');
const path = require('path');

const PROBLEMS_PATH = path.join(__dirname, '../api/data/problems.json');
const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

// Mappings for normalization (canonical form -> aliases)
// The key is the standardized name we WANT. The values are the mess we HAVE.
const MAPPINGS = {
    "1-D Dynamic Programming": ["1D DP", "1d Dp", "Dynamic Programming (1D)", "Dp (1D)"],
    "2-D Dynamic Programming": ["2D DP", "2d Dp", "Dynamic Programming (2D)"],
    "Backtracking": ["Backtracking (Decision Tree)", "Backtracking (Matrix)"],
    "Bit Manipulation": ["Bit Manipulation / BFS", "Bit by Bit", "Bit Counting"],
    "Breadth-First Search": ["BFS", "BFS (Queue)", "BFS + Direction Flag", "BFS / Bellman-Ford", "Multi-source BFS", "Bfs - Min Depth"],
    "Depth-First Search": ["DFS", "DFS (Helpers)", "DFS (Recursion)", "DFS + Global Max", "DFS Traversal", "DFS from Border", "DFS on Grid", "DFS with Memoization", "DFS with Range", "Dfs - Diameter"],
    "Design": [],
    "Divide & Conquer": ["Divide and Conquer", "Divide and Conquer / Heap"],
    "Graph": ["Graph (Hashtable + DFS)", "Graph BFS/DFS", "Graph BFS", "Graph General"],
    "Greedy": ["Greedy Algorithm", "Greedy BFS", "Greedy Interval", "Greedy with HashMap", "Greedy with Last Occurrence Tracking", "Greedy with Range Tracking", "Greedy On Bits", "Two Pass Greedy"],
    "Hash Map": ["Hashmap", "Hash Map (Bi-directional)", "Hash Map + Dynamic Array", "Hash Map + Heap", "Hash Map + Slopes", "Hash Map / Counter", "Hash Map / Interweaving", "Hash Map / Sorting", "Sorting + Hashmap"],
    "Heap": ["Min Heap", "Heap (Priority Queue)", "Heap / QuickSelect", "Priority Queue", "Frequency Heap", "Distance-Based Heap"],
    "Linked List": ["Linked List / Two Pointers", "Linked List Manipulation", "Linked List Math", "Linked List Reversal + Merge"],
    "Math": ["Math & Geometry", "Geometry + Hash Map"],
    "Merge Sort": ["Sort + Merge", "Sorting + Merge"],
    "Prefix Sum": ["Prefix Sums", "Prefix/Suffix Products", "Math / Prefix-Sum Idea"],
    "Queue": ["Monotonic Queue", "Queue Rotation"],
    "Stack": ["Monotonic Stack", "Stack (Signs)", "Stack (Two Stacks)", "Stack + Queue"],
    "Sliding Window": ["Sliding Window + Hash Map", "Sliding Window + Hash Set", "Sliding Window / Hash Map"],
    "Sorting": ["Sorting + Min Heap", "Sorting + Diff"],
    "Topological Sort": ["Topological Sort (DFS/BFS)"],
    "Tree": ["Tree Recursion", "Tree Traversal", "Tree Traversal + Subtree Matching", "Binary Search on Tree", "Binary Tree BFS", "Binary Tree General", "Lca In Bst", "Rebalancing"],
    "Trie": [],
    "Two Pointers": ["Two Pointers + Sort", "Two Pointers + Sorting", "Two Pointers / Expand", "Two Pointers / Split", "Two Pointers + Sorted Array", "Two-Pointer Mountains", "Two-Sum In Bst"],
    "Union Find": ["Union-Find", "Union-Find (Disjoint Set)", "Union-Find / DFS"],
    "String": ["String Dp", "Recursive String Build"] // Example consolidation
};

function normalize(val) {
    if (!val) return val;

    // Check exact matches in values
    for (const [canonical, aliases] of Object.entries(MAPPINGS)) {
        if (val === canonical) return canonical;
        if (aliases.includes(val)) return canonical;
        // Case insensitive match
        if (aliases.some(a => a.toLowerCase() === val.toLowerCase())) return canonical;
    }

    // Partial Match Logic (Dangerous? Maybe. Let's start conservative)
    if (val.toLowerCase().includes("1d dp")) return "1-D Dynamic Programming";
    if (val.toLowerCase().includes("2d dp")) return "2-D Dynamic Programming";

    return val;
}

function main() {
    console.log("Normalizing Subtopics...");

    const problemsData = JSON.parse(fs.readFileSync(PROBLEMS_PATH, 'utf8'));
    const solutionsData = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    let changed = 0;
    let added = 0;

    // 1. Normalize Existing Subtopics & 2. Fill Missing
    if (problemsData.categories) {
        problemsData.categories.forEach(cat => {
            if (cat.problems) {
                cat.problems.forEach(p => {
                    // Normalize
                    if (p.subTopic) {
                        const original = p.subTopic;
                        const normed = normalize(original);
                        if (original !== normed) {
                            console.log(`[NORM] ${p.title}: "${original}" -> "${normed}"`);
                            p.subTopic = normed;
                            changed++;
                        }
                    }

                    // Fill Missing
                    // Also check for "General" or empty
                    if (!p.subTopic || p.subTopic === "General" || p.subTopic === "") {
                        const sol = Object.values(solutionsData.solutions).find(s => s.title === p.title);
                        if (sol && sol.pattern) {
                            const potentialSub = normalize(sol.pattern);
                            if (potentialSub && !["Array"].includes(potentialSub)) {
                                console.log(`[FILL] ${p.title}: Missing -> "${potentialSub}"`);
                                p.subTopic = potentialSub;
                                added++;
                            }
                        }
                    }
                });
            }
        });
    }

    // Write back
    fs.writeFileSync(PROBLEMS_PATH, JSON.stringify(problemsData, null, 2));
    console.log(`\nDone! Normalized ${changed} entries. Filled ${added} missing subtopics.`);
}

main();
