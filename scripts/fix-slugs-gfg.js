const fs = require('fs');
const path = require('path');

const PROBLEMS_PATH = path.join(__dirname, '../api/data/problems.json');
const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function main() {
    console.log("=== Fixing Slugs & GFG ===");
    const problems = JSON.parse(fs.readFileSync(PROBLEMS_PATH, 'utf8'));
    const solutions = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    // 1. Fix Slugs in Problems
    const slugFixes = {
        "two-sum-ii---input-array-is-sorted": "two-sum-ii-input-array-is-sorted",
        "powx,-n": "powx-n"
    };

    let fixedSlugs = 0;
    if (problems.categories) {
        problems.categories.forEach(cat => {
            cat.problems.forEach(p => {
                if (slugFixes[p.slug]) {
                    console.log(`[SLUG] "${p.title}": ${p.slug} -> ${slugFixes[p.slug]}`);
                    p.slug = slugFixes[p.slug];
                    fixedSlugs++;
                }
            });
        });
    }
    fs.writeFileSync(PROBLEMS_PATH, JSON.stringify(problems, null, 2));

    // 2. Fix GFG Difficulty in Solutions
    const gfgKey = "gfg---reverse-first-k-elements-of-a-queue";
    let fixedGFG = 0;
    if (solutions.solutions[gfgKey]) {
        if (!solutions.solutions[gfgKey].difficulty) {
            console.log(`[GFG] Adding difficulty: Medium`);
            solutions.solutions[gfgKey].difficulty = "Medium";
            fixedGFG++;
        }
    }
    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(solutions, null, 2));

    console.log(`\nFixed ${fixedSlugs} slugs listings and ${fixedGFG} solution entries.`);
}

main();
