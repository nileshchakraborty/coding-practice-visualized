const fs = require('fs');
const path = require('path');

const PROBLEMS_PATH = path.join(__dirname, '../api/data/problems.json');
const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function main() {
    console.log("=== Purging Orphans ===");
    const problemsData = JSON.parse(fs.readFileSync(PROBLEMS_PATH, 'utf8'));
    const solutionsData = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    // 1. Get all valid problem slugs
    const validSlugs = new Set();
    if (problemsData.categories) {
        problemsData.categories.forEach(cat => {
            cat.problems.forEach(p => {
                validSlugs.add(p.slug);
            });
        });
    }

    // 2. Filter solutions
    const newSolutions = {};
    let deleted = 0;

    Object.keys(solutionsData.solutions).forEach(key => {
        if (validSlugs.has(key)) {
            newSolutions[key] = solutionsData.solutions[key];
        } else {
            console.log(`[DELETE] Orphan solution: "${key}"`);
            deleted++;
        }
    });

    solutionsData.solutions = newSolutions;

    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(solutionsData, null, 2));
    console.log(`\nDeleted ${deleted} orphaned/duplicate solutions.`);
}

main();
