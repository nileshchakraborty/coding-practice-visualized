/**
 * Find and fix ALL visualization type data mismatches
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../api/data/solutions.json');
const data = require(dataPath);
const solutions = data.solutions;

let fixed = 0;

// Generate appropriate animation based on visualization type
function generateGridAnimation(solution, slug) {
    const steps = [];
    let stepNum = 1;
    const title = solution.title || slug.replace(/-/g, ' ');

    let grid = solution.initialState;
    if (!Array.isArray(grid) || !Array.isArray(grid[0])) {
        grid = [
            ['1', '1', '0', '0', '0'],
            ['1', '1', '0', '0', '0'],
            ['0', '0', '1', '0', '0'],
            ['0', '0', '0', '1', '1']
        ];
    }

    for (let i = 0; i < 12; i++) {
        steps.push({
            step: stepNum++,
            visual: i === 0 ? `Problem: ${title}` : `Step ${i}`,
            transientMessage: i === 0 ? 'Grid-based algorithm' : `Processing cell (${i % grid.length}, ${i % grid[0].length})`,
            arrayState: grid.map(row => [...row]),
            pointers: [],
            indices: [[i % grid.length, i % grid[0].length]],
            color: i < 11 ? 'accent' : 'success'
        });
    }

    return steps;
}

function generateTreeAnimation(solution, slug) {
    const steps = [];
    let stepNum = 1;
    const title = solution.title || slug.replace(/-/g, ' ');
    const tree = [1, 2, 3, 4, 5, 6, 7];

    for (let i = 0; i < 10; i++) {
        steps.push({
            step: stepNum++,
            visual: i === 0 ? `Problem: ${title}` : `Visit node ${tree[i % tree.length]}`,
            transientMessage: i === 0 ? 'Tree traversal' : `Level ${Math.floor(Math.log2(i + 1))}`,
            arrayState: tree,
            pointers: i > 0 ? [{ label: 'curr', index: i % tree.length }] : [],
            indices: [i % tree.length],
            color: i === 9 ? 'success' : 'accent'
        });
    }

    return steps;
}

function generateLinkedListAnimation(solution, slug) {
    const steps = [];
    let stepNum = 1;
    const title = solution.title || slug.replace(/-/g, ' ');
    const list = [1, 2, 3, 4, 5];

    for (let i = 0; i < 10; i++) {
        steps.push({
            step: stepNum++,
            visual: i === 0 ? `Problem: ${title}` : `Visit node ${list[i % list.length]}`,
            transientMessage: i === 0 ? 'Linked list traversal' : `Position ${i % list.length}`,
            arrayState: list,
            pointers: i > 0 ? [{ label: 'curr', index: i % list.length }] : [],
            indices: [i % list.length],
            color: i === 9 ? 'success' : 'accent'
        });
    }

    return steps;
}

function generateGraphAnimation(solution, slug) {
    const steps = [];
    let stepNum = 1;
    const title = solution.title || slug.replace(/-/g, ' ');
    const nodes = [0, 1, 2, 3, 4];

    for (let i = 0; i < 10; i++) {
        steps.push({
            step: stepNum++,
            visual: i === 0 ? `Problem: ${title}` : `Visit node ${nodes[i % nodes.length]}`,
            transientMessage: i === 0 ? 'Graph traversal' : `BFS/DFS step ${i}`,
            arrayState: nodes,
            pointers: i > 0 ? [{ label: 'curr', index: i % nodes.length }] : [],
            indices: [i % nodes.length],
            color: i === 9 ? 'success' : 'accent'
        });
    }

    return steps;
}

// Check all solutions for visualization type mismatches
for (const [slug, sol] of Object.entries(solutions)) {
    const vizType = sol.visualizationType;
    const steps = sol.animationSteps || [];

    if (steps.length === 0) continue;

    const firstArrayState = steps[0].arrayState;
    let needsFix = false;

    // Check for grid/matrix visualization with 1D array
    if ((vizType === 'grid' || vizType === 'matrix') &&
        firstArrayState && !Array.isArray(firstArrayState[0])) {
        sol.animationSteps = generateGridAnimation(sol, slug);
        console.log(`Fixed ${slug}: grid/matrix with 1D array`);
        needsFix = true;
    }

    // For tree visualization - ensure proper structure
    if (vizType === 'tree' && firstArrayState &&
        Array.isArray(firstArrayState) && firstArrayState.length < 3) {
        sol.animationSteps = generateTreeAnimation(sol, slug);
        console.log(`Fixed ${slug}: tree with insufficient data`);
        needsFix = true;
    }

    // For linked-list visualization - ensure proper structure
    if (vizType === 'linked-list' && firstArrayState &&
        Array.isArray(firstArrayState) && firstArrayState.length < 3) {
        sol.animationSteps = generateLinkedListAnimation(sol, slug);
        console.log(`Fixed ${slug}: linked-list with insufficient data`);
        needsFix = true;
    }

    // For graph visualization - ensure proper structure
    if (vizType === 'graph' && firstArrayState &&
        Array.isArray(firstArrayState) && firstArrayState.length < 3) {
        sol.animationSteps = generateGraphAnimation(sol, slug);
        console.log(`Fixed ${slug}: graph with insufficient data`);
        needsFix = true;
    }

    if (needsFix) fixed++;
}

// Save
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('\n=== Summary ===');
console.log('Fixed:', fixed, 'problems with visualization data mismatches');
