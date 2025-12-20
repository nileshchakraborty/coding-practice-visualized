/**
 * Fix grid/matrix problems that have incorrect 1D arrayState
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../api/data/solutions.json');
const data = require(dataPath);
const solutions = data.solutions;

let fixed = 0;

// Problems that use grid visualization and need 2D arrays
const gridProblems = [
    'number-of-islands', 'surrounded-regions', 'max-area-of-island',
    'rotting-oranges', 'pacific-atlantic-water-flow', 'walls-and-gates',
    'valid-sudoku', 'spiral-matrix', 'rotate-image', 'set-matrix-zeroes',
    'game-of-life', 'word-search', 'search-a-2d-matrix', 'unique-paths',
    'unique-paths-ii', 'minimum-path-sum', 'longest-increasing-path-in-a-matrix',
    'construct-quad-tree', 'maximal-square'
];

function generateGridAnimation(solution, slug) {
    const steps = [];
    let stepNum = 1;
    const title = solution.title || slug.replace(/-/g, ' ');

    // Use initialState if it's a 2D array, otherwise create default grid
    let grid = solution.initialState;
    if (!Array.isArray(grid) || !Array.isArray(grid[0])) {
        grid = [
            ['1', '1', '0', '0', '0'],
            ['1', '1', '0', '0', '0'],
            ['0', '0', '1', '0', '0'],
            ['0', '0', '0', '1', '1']
        ];
    }

    steps.push({
        step: stepNum++,
        visual: `Problem: ${title}`,
        transientMessage: 'Grid-based BFS/DFS approach',
        arrayState: grid.map(row => [...row]),
        pointers: [],
        indices: [],
        color: 'accent'
    });

    steps.push({
        step: stepNum++,
        visual: 'Initialize visited set',
        transientMessage: 'Track visited cells',
        arrayState: grid.map(row => [...row]),
        pointers: [],
        indices: [[0, 0]],
        color: 'accent'
    });

    steps.push({
        step: stepNum++,
        visual: 'Start at (0, 0)',
        transientMessage: `Cell value: ${grid[0][0]}`,
        arrayState: grid.map(row => [...row]),
        pointers: [{ label: 'start', row: 0, col: 0 }],
        indices: [[0, 0]],
        color: grid[0][0] === '1' ? 'success' : 'accent'
    });

    steps.push({
        step: stepNum++,
        visual: 'Explore neighbors',
        transientMessage: 'Check up, down, left, right',
        arrayState: grid.map(row => [...row]),
        pointers: [{ label: 'curr', row: 0, col: 0 }],
        indices: [[0, 0], [0, 1], [1, 0]],
        color: 'accent'
    });

    steps.push({
        step: stepNum++,
        visual: 'Visit (0, 1)',
        transientMessage: `Cell value: ${grid[0][1]}`,
        arrayState: grid.map(row => [...row]),
        pointers: [{ label: 'curr', row: 0, col: 1 }],
        indices: [[0, 1]],
        color: grid[0][1] === '1' ? 'success' : 'accent'
    });

    steps.push({
        step: stepNum++,
        visual: 'Visit (1, 0)',
        transientMessage: `Cell value: ${grid[1][0]}`,
        arrayState: grid.map(row => [...row]),
        pointers: [{ label: 'curr', row: 1, col: 0 }],
        indices: [[1, 0]],
        color: grid[1][0] === '1' ? 'success' : 'accent'
    });

    steps.push({
        step: stepNum++,
        visual: 'Visit (1, 1)',
        transientMessage: `Cell value: ${grid[1][1]}`,
        arrayState: grid.map(row => [...row]),
        pointers: [{ label: 'curr', row: 1, col: 1 }],
        indices: [[1, 1]],
        color: grid[1][1] === '1' ? 'success' : 'accent'
    });

    steps.push({
        step: stepNum++,
        visual: 'First island complete',
        transientMessage: 'Found island #1, count = 1',
        arrayState: grid.map(row => [...row]),
        pointers: [],
        indices: [[0, 0], [0, 1], [1, 0], [1, 1]],
        color: 'success'
    });

    steps.push({
        step: stepNum++,
        visual: 'Continue scanning grid',
        transientMessage: 'Find next unvisited land cell',
        arrayState: grid.map(row => [...row]),
        pointers: [{ label: 'scan', row: 2, col: 2 }],
        indices: [[2, 2]],
        color: 'accent'
    });

    steps.push({
        step: stepNum++,
        visual: 'Found another island',
        transientMessage: 'Island #2 at (2, 2)',
        arrayState: grid.map(row => [...row]),
        pointers: [{ label: 'island', row: 2, col: 2 }],
        indices: [[2, 2]],
        color: 'success'
    });

    steps.push({
        step: stepNum++,
        visual: 'Continue to next island',
        transientMessage: 'Island #3 at (3, 3)',
        arrayState: grid.map(row => [...row]),
        pointers: [{ label: 'island', row: 3, col: 3 }],
        indices: [[3, 3], [3, 4]],
        color: 'success'
    });

    steps.push({
        step: stepNum++,
        visual: 'Grid traversal complete',
        transientMessage: 'Total islands: 3',
        arrayState: grid.map(row => [...row]),
        pointers: [],
        indices: [],
        color: 'success'
    });

    return steps;
}

// Fix each grid problem
for (const slug of gridProblems) {
    if (solutions[slug]) {
        const sol = solutions[slug];
        const currentSteps = sol.animationSteps || [];

        // Check if current steps have invalid 1D arrayState for grid visualization
        const needsFix = sol.visualizationType === 'grid' || sol.visualizationType === 'matrix';
        const hasInvalidArray = currentSteps.length > 0 &&
            currentSteps[0].arrayState &&
            !Array.isArray(currentSteps[0].arrayState[0]);

        if (needsFix || hasInvalidArray) {
            solutions[slug].animationSteps = generateGridAnimation(sol, slug);
            console.log(`Fixed ${slug}: ${solutions[slug].animationSteps.length} steps (grid)`);
            fixed++;
        }
    }
}

// Save
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`\n=== Summary ===`);
console.log(`Fixed: ${fixed} grid/matrix problems`);
