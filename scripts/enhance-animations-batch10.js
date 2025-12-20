/**
 * Script to enhance animation steps - Batch 10 (Graphs) + Clone Graph Fix
 * Adds final "Answer" step to ensure clear conclusion.
 * Run: node scripts/enhance-animations-batch10.js
 */

const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../data/solutions.json');

// 0. Clone Graph (Fix: Add Step 5)
const enhancedCloneGraph = [
    {
        "step": 1,
        "visual": "Node 1 → [2,4], Node 2 → [1,3]...",
        "transientMessage": "BFS/DFS with hashmap to track clones",
        "arrayState": [1, 2, 3, 4],
        "pointers": [{ "label": "curr", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Clone node 1",
        "transientMessage": "visited[1] = clone(1)",
        "arrayState": [1, 2, 3, 4],
        "pointers": [{ "label": "curr", "index": 0 }],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Process neighbors: 2, 4",
        "transientMessage": "Clone 2, clone 4. Connect to clone(1)",
        "arrayState": [1, 2, 3, 4],
        "pointers": [],
        "indices": [0, 1, 3],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Continuously processed all nodes",
        "transientMessage": "Nodes 1, 2, 3, 4 scanned and connected",
        "arrayState": [1, 2, 3, 4],
        "pointers": [],
        "indices": [0, 1, 2, 3],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: Return clone(1)",
        "transientMessage": "Deep copy complete ✅",
        "arrayState": [1, 2, 3, 4],
        "pointers": [],
        "indices": [0, 1, 2, 3],
        "color": "success"
    }
];

// 1. Surrounded Regions (Grid DFS)
const enhancedSurroundedRegions = [
    {
        "step": 1,
        "visual": "board = [['X','X','X','X'],['X','O','O','X'],['X','X','O','X'],['X','O','X','X']]",
        "transientMessage": "Goal: Capture surrounded 'O's. First, find 'O's connected to border.",
        "arrayState": [
            ['X', 'X', 'X', 'X'],
            ['X', 'O', 'O', 'X'],
            ['X', 'X', 'O', 'X'],
            ['X', 'O', 'X', 'X']
        ],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Board border scan",
        "transientMessage": "Found 'O' at [3,1] (border). Start DFS to mark safe.",
        "arrayState": [
            ['X', 'X', 'X', 'X'],
            ['X', 'O', 'O', 'X'],
            ['X', 'X', 'O', 'X'],
            ['X', 'O', 'X', 'X']
        ],
        "pointers": [{ "label": "DFS", "index": [3, 1] }],
        "indices": [[3, 1]],
        "color": "warning"
    },
    {
        "step": 3,
        "visual": "DFS from [3,1]",
        "transientMessage": "Mark [3,1] as Safe (S). Check neighbors.",
        "arrayState": [
            ['X', 'X', 'X', 'X'],
            ['X', 'O', 'O', 'X'],
            ['X', 'X', 'O', 'X'],
            ['X', 'S', 'X', 'X']
        ],
        "pointers": [{ "label": "curr", "index": [3, 1] }],
        "indices": [[3, 1]],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Flip remaining 'O's",
        "transientMessage": "All other 'O's are surrounded → Flip to 'X'",
        "arrayState": [
            ['X', 'X', 'X', 'X'],
            ['X', 'X', 'X', 'X'],
            ['X', 'X', 'X', 'X'],
            ['X', 'O', 'X', 'X']
        ],
        "pointers": [],
        "indices": [[1, 1], [1, 2], [2, 2]],
        "color": "accent"
    },
    {
        "step": 5,
        "visual": "Final Board State",
        "transientMessage": "Safe 'O's restored. Surrounded 'O's captured ✅",
        "arrayState": [
            ['X', 'X', 'X', 'X'],
            ['X', 'X', 'X', 'X'],
            ['X', 'X', 'X', 'X'],
            ['X', 'O', 'X', 'X']
        ],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// 2. Rotting Oranges (Grid BFS)
// 0=Empty, 1=Fresh, 2=Rotten
const enhancedRottingOranges = [
    {
        "step": 1,
        "visual": "grid = [[2,1,1],[1,1,0],[0,1,1]]",
        "transientMessage": "Minute 0: Find all Rotten (2) oranges",
        "arrayState": [[2, 1, 1], [1, 1, 0], [0, 1, 1]],
        "pointers": [{ "label": "Q", "index": [0, 0] }],
        "indices": [[0, 0]],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Minute 1: Expand from [0,0]",
        "transientMessage": "Rot neighbors: [0,1], [1,0] become 2",
        "arrayState": [[2, 2, 1], [2, 1, 0], [0, 1, 1]],
        "pointers": [{ "label": "New", "index": [0, 1] }, { "label": "New", "index": [1, 0] }],
        "indices": [[0, 1], [1, 0]],
        "color": "warning"
    },
    {
        "step": 3,
        "visual": "Minute 2: Expand from new rotten",
        "transientMessage": "[0,2], [1,1] become 2",
        "arrayState": [[2, 2, 2], [2, 2, 0], [0, 1, 1]],
        "pointers": [{ "label": "New", "index": [0, 2] }, { "label": "New", "index": [1, 1] }],
        "indices": [[0, 2], [1, 1]],
        "color": "warning"
    },
    {
        "step": 4,
        "visual": "Minute 4: Final State",
        "transientMessage": "[2,2] unreachable (island). Fresh orange remains.",
        "arrayState": [[2, 2, 2], [2, 2, 0], [0, 1, 1]],
        "pointers": [],
        "indices": [[2, 2]],
        "color": "accent"
    },
    {
        "step": 5,
        "visual": "Answer: -1",
        "transientMessage": "Impossible to rot all oranges ✅",
        "arrayState": [[2, 2, 2], [2, 2, 0], [0, 1, 1]],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// 3. Max Area of Island (Grid DFS)
const enhancedMaxArea = [
    {
        "step": 1,
        "visual": "grid = [[0,0,1,0],[0,1,1,0]]",
        "transientMessage": "Scan for '1'. MaxArea = 0",
        "arrayState": [[0, 0, 1, 0], [0, 1, 1, 0]],
        "pointers": [{ "label": "scan", "index": [0, 0] }],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Found '1' at [0,2]",
        "transientMessage": "Start DFS. Area = 1",
        "arrayState": [[0, 0, 2, 0], [0, 1, 1, 0]],
        "pointers": [{ "label": "dfs", "index": [0, 2] }],
        "indices": [[0, 2]],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "DFS neighbor [1,2]",
        "transientMessage": "Area = 1 + 1 = 2",
        "arrayState": [[0, 0, 2, 0], [0, 1, 2, 0]],
        "pointers": [{ "label": "dfs", "index": [1, 2] }],
        "indices": [[0, 2], [1, 2]],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "DFS neighbor [1,1]",
        "transientMessage": "Area = 3. Island complete.",
        "arrayState": [[0, 0, 2, 0], [0, 2, 2, 0]],
        "pointers": [],
        "indices": [[0, 2], [1, 2], [1, 1]],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: 3",
        "transientMessage": "Max area found is 3 ✅",
        "arrayState": [[0, 0, 2, 0], [0, 2, 2, 0]],
        "pointers": [],
        "indices": [[0, 2], [1, 2], [1, 1]],
        "color": "success"
    }
];

// 4. Course Schedule II (Graph Topological Sort)
const enhancedCourseSchedule = [
    {
        "step": 1,
        "visual": "numCourses=4, prerequisites=[[1,0],[2,0],[3,1],[3,2]]",
        "transientMessage": "Build Graph + Indegrees. 0→1, 0→2, 1→3, 2→3",
        "arrayState": [0, 1, 2, 3],
        "pointers": [{ "label": "Indeg:0", "index": 0 }],
        "indices": [0],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Queue: [0]",
        "transientMessage": "Take 0. Decrement neighbors (1, 2)",
        "arrayState": [0, 1, 2, 3],
        "pointers": [{ "label": "taken", "index": 0 }],
        "indices": [0],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Queue: [1, 2]",
        "transientMessage": "Take 1. Decrement neighbor (3)",
        "arrayState": [0, 1, 2, 3],
        "pointers": [{ "label": "taken", "index": 1 }],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Queue: [2, 3] (3 ready now)",
        "transientMessage": "Take 2, then 3. Order found.",
        "arrayState": [0, 1, 2, 3],
        "pointers": [],
        "indices": [0, 1, 2, 3],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: [0, 1, 2, 3]",
        "transientMessage": "Valid topological ordering ✅",
        "arrayState": [0, 1, 2, 3],
        "pointers": [],
        "indices": [0, 1, 2, 3],
        "color": "success"
    }
];

// 5. Redundant Connection (Union Find) - Already had 5 steps, ensuring it's kept
const enhancedRedundantConnection = [
    {
        "step": 1,
        "visual": "edges = [[1,2], [1,3], [2,3]]",
        "transientMessage": "Union-Find: Start with isolated sets {1}, {2}, {3}",
        "arrayState": [1, 2, 3],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Edge [1, 2]",
        "transientMessage": "Union(1, 2) → Success. Set: {1, 2}, {3}",
        "arrayState": [1, 2, 3],
        "pointers": [{ "label": "U", "index": 0 }, { "label": "U", "index": 1 }],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Edge [1, 3]",
        "transientMessage": "Union(1, 3) → Success. Set: {1, 2, 3}",
        "arrayState": [1, 2, 3],
        "pointers": [{ "label": "U", "index": 0 }, { "label": "U", "index": 2 }],
        "indices": [0, 2],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Edge [2, 3]",
        "transientMessage": "Find(2)=1, Find(3)=1. Same parent! Cycle detected.",
        "arrayState": [1, 2, 3],
        "pointers": [{ "label": "Cycle", "index": 1 }, { "label": "Cycle", "index": 2 }],
        "indices": [1, 2],
        "color": "warning"
    },
    {
        "step": 5,
        "visual": "Answer: [2, 3]",
        "transientMessage": "Redundant edge identified ✅",
        "arrayState": [1, 2, 3],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

// 6. Alien Dictionary (Topological Sort)
const enhancedAlienDictionary = [
    {
        "step": 1,
        "visual": "words = [\"wrt\",\"wrf\",\"er\",\"ett\",\"rftt\"]",
        "transientMessage": "Build graph from adjacent word chars",
        "arrayState": ["t", "f", "w", "e", "r"],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "wrt vs wrf → t before f",
        "transientMessage": "Edge: t → f",
        "arrayState": ["t", "f", "w", "e", "r"],
        "pointers": [{ "label": "src", "index": 0 }, { "label": "dst", "index": 1 }],
        "indices": [0, 1],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "wrf vs er → w before e",
        "transientMessage": "Edge: w → e",
        "arrayState": ["t", "f", "w", "e", "r"],
        "pointers": [{ "label": "src", "index": 2 }, { "label": "dst", "index": 3 }],
        "indices": [2, 3],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Topological Sort",
        "transientMessage": "Result: w → e → r → t → f",
        "arrayState": ["w", "e", "r", "t", "f"],
        "pointers": [],
        "indices": [0, 1, 2, 3, 4],
        "color": "success"
    },
    {
        "step": 5,
        "visual": "Answer: \"wertf\"",
        "transientMessage": "Alien order determined ✅",
        "arrayState": ["w", "e", "r", "t", "f"],
        "pointers": [],
        "indices": [0, 1, 2, 3, 4],
        "color": "success"
    }
];

function main() {
    console.log('Reading solutions.json...');
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    const updates = [
        { slug: 'clone-graph', steps: enhancedCloneGraph, type: 'graph' },
        { slug: 'surrounded-regions', steps: enhancedSurroundedRegions, type: 'grid' },
        { slug: 'rotting-oranges', steps: enhancedRottingOranges, type: 'grid' },
        { slug: 'max-area-of-island', steps: enhancedMaxArea, type: 'grid' },
        { slug: 'course-schedule-ii', steps: enhancedCourseSchedule, type: 'graph' },
        { slug: 'redundant-connection', steps: enhancedRedundantConnection, type: 'graph' },
        { slug: 'alien-dictionary', steps: enhancedAlienDictionary, type: 'graph' }
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

    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(data, null, 2));
    console.log(`✅ Done! Enhanced animation steps with FINAL state for ${count} solutions.`);
}

main();
