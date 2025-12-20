const fs = require('fs');
const path = require('path');

const PROBLEMS_PATH = path.join(__dirname, '../api/data/problems.json');
const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function main() {
    console.log("=== Fixing Data Mismatches ===");
    const problems = JSON.parse(fs.readFileSync(PROBLEMS_PATH, 'utf8'));
    const solutions = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    let fixed = 0;

    if (problems.categories) {
        problems.categories.forEach(cat => {
            cat.problems.forEach(p => {
                // Lookup by slug
                const sol = solutions.solutions[p.slug]; // Assuming solutions keyed by slug?
                // Actually solutions.json keys seem to be slugs based on previous edits.
                // Let's verify. Yes, previous diffs show keys like "insert-into-a-binary-search-tree"

                if (sol) {
                    let changed = false;

                    // Fix Title
                    if (p.title !== sol.title) {
                        console.log(`[FIX-TITLE] "${p.title}" -> "${sol.title}"`);
                        p.title = sol.title;
                        changed = true;
                    }

                    // Fix Difficulty (Source of Truth is Solution)
                    if (sol.difficulty && p.difficulty !== sol.difficulty) {
                        console.log(`[FIX-DIFF] "${p.title}" ${p.difficulty} -> ${sol.difficulty}`);
                        p.difficulty = sol.difficulty;
                        changed = true;
                    }

                    if (changed) fixed++;
                }
            });
        });
    }

    fs.writeFileSync(PROBLEMS_PATH, JSON.stringify(problems, null, 2));
    console.log(`\nFixed ${fixed} entries.`);
}

main();
