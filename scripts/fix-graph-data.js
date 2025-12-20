/**
 * Script to fix Graph and Grid data structures in solutions.json
 * Populates graphNodes/graphEdges for 'graph' type and initialState for 'grid' type.
 * Run: node scripts/fix-graph-data.js
 */

const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../data/solutions.json');

// Helper to create graph data
function createGraphData(nodes, edges, directed = true) {
    return {
        graphNodes: nodes.map(id => ({ id, label: String(id) })),
        graphEdges: edges.map(e => ({ from: e[0], to: e[1], weight: e[2] }))
    };
}

// 1. Clone Graph
const cloneGraphData = createGraphData(
    [1, 2, 3, 4],
    [[1, 2], [1, 4], [2, 3], [3, 4]],
    false // Undirected
);
// Adjust for undirected visualization if needed, but GraphVisualizer supports `directed` prop.
// solution.json doesn't have `directed` field usually, defaults to true.
// I'll stick to directed edges for now or double edges if needed.

// 2. Course Schedule II
const courseScheduleData = createGraphData(
    [0, 1, 2, 3],
    [[1, 0], [2, 0], [3, 1], [3, 2]] // Prereq [1,0] means 0->1? No, usually course depends on prereq.
    // [1,0] means to take 1 you need 0. So 0 -> 1.
);

// 3. Redundant Connection
const redundantConnectionData = createGraphData(
    [1, 2, 3],
    [[1, 2], [1, 3], [2, 3]],
    false
);

// 4. Alien Dictionary
const alienDictionaryData = createGraphData(
    ['w', 'e', 'r', 't', 'f'],
    [['t', 'f'], ['w', 'e'], ['r', 't'], ['e', 'r']]
    // w->e, e->r, r->t, t->f
);


// Grid Data (initialState)
const surroundedRegionsGrid = [
    ['X', 'X', 'X', 'X'],
    ['X', 'O', 'O', 'X'],
    ['X', 'X', 'O', 'X'],
    ['X', 'O', 'X', 'X']
];

const rottingOrangesGrid = [[2, 1, 1], [1, 1, 0], [0, 1, 1]];

const maxAreaOfIslandGrid = [[0, 0, 1, 0], [0, 1, 1, 0]];


function main() {
    console.log('Reading solutions.json...');
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    const updates = [
        {
            slug: 'clone-graph',
            ...cloneGraphData,
            directed: false
        },
        {
            slug: 'course-schedule-ii',
            ...courseScheduleData
        },
        {
            slug: 'redundant-connection',
            ...redundantConnectionData,
            directed: false
        },
        {
            slug: 'alien-dictionary',
            ...alienDictionaryData
        },
        {
            slug: 'surrounded-regions',
            initialState: surroundedRegionsGrid
        },
        {
            slug: 'rotting-oranges',
            initialState: rottingOrangesGrid
        },
        {
            slug: 'max-area-of-island',
            initialState: maxAreaOfIslandGrid
        }
    ];

    let count = 0;
    for (const update of updates) {
        const sol = data.solutions[update.slug];
        if (sol) {
            if (update.graphNodes) sol.graphNodes = update.graphNodes;
            if (update.graphEdges) sol.graphEdges = update.graphEdges;
            if (update.initialState) sol.initialState = update.initialState;

            // Basic directed flag handling if I were to add it to SmartVisualizer,
            // currently strict types might block it, but let's see. 
            // GraphVisualizer has `directed` prop but SmartVisualizer passes `directed={true}` hardcoded?
            // Let's check SmartVisualizer... currently it defaults to true.

            console.log(`✓ Fixed data for ${update.slug}`);
            count++;
        } else {
            console.log(`✗ Not found: ${update.slug}`);
        }
    }

    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(data, null, 2));
    console.log(`✅ Done! Fixed data for ${count} solutions.`);
}

main();
