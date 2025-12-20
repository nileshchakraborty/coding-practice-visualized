const fs = require('fs');
const path = require('path');

const PROBLEMS_PATH = path.join(__dirname, '../api/data/problems.json');
const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function main() {
    console.log("=== Deep Data Audit ===");
    const problems = JSON.parse(fs.readFileSync(PROBLEMS_PATH, 'utf8'));
    const solutions = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    // 1. Validating Problems Array
    // Problems are nested in 'categories'. Flatten them first.
    let flatProblems = [];
    if (problems.categories) {
        problems.categories.forEach(cat => {
            flatProblems = flatProblems.concat(cat.problems);
        });
    } else {
        console.error("CRITICAL: problems.json missing 'categories' root key.");
        process.exit(1);
    }

    console.log(`Loaded ${flatProblems.length} problems from listings.`);

    // 2. Validate Slugs & Titles
    const problemSlugs = new Set();
    const solutionSlugs = new Set(Object.keys(solutions.solutions));

    let slugErrors = 0;
    let titleErrors = 0;

    flatProblems.forEach(p => {
        if (!p.slug) {
            console.log(`[PROBLEM] Missing slugs for "${p.title}"`);
            slugErrors++;
        }
        if (problemSlugs.has(p.slug)) {
            console.log(`[PROBLEM] Duplicate slug: ${p.slug}`);
            slugErrors++;
        }
        problemSlugs.add(p.slug);

        // Cross-ref with Solutions
        // Try finding by Slug first (Most robust)
        let sol = solutions.solutions[p.slug];

        // Fallback to title if slug key missing (Legacy structure?)
        if (!sol) {
            sol = Object.values(solutions.solutions).find(s => s.title === p.title);
        }

        if (!sol) {
            console.log(`[SYNC-CRITICAL] Problem "${p.title}" (slug: ${p.slug}) has no matching Solution.`);
        } else {
            // Check title consistency
            if (sol.title !== p.title) {
                console.log(`[TITLE-MISMATCH] "${p.title}" vs "${sol.title}"`);
                titleErrors++;
            }
            if (p.difficulty !== sol.difficulty) {
                console.log(`[MISMATCH] Difficulty "${p.title}": Listed=${p.difficulty} vs Sol=${sol.difficulty}`);
                titleErrors++;
            }
        }
    });

    // 3. Validate Solutions Content
    let animErrors = 0;
    let placeholderErrors = 0;

    Object.values(solutions.solutions).forEach(sol => {
        // Animation Steps
        if (!sol.animationSteps || sol.animationSteps.length === 0) {
            console.log(`[CONTENT] Solution "${sol.title}" has NO animation steps.`);
            animErrors++;
        }

        // Placeholders
        const str = JSON.stringify(sol).toLowerCase();
        if (str.includes("coming soon") || str.includes("todo") || str.includes("placeholder")) {
            console.log(`[CONTENT] Solution "${sol.title}" contains placeholder text.`);
            placeholderErrors++;
        }

        // Mental Models (Since we claim 100% coverage)
        if (!sol.mentalModel) {
            console.log(`[CONTENT] Solution "${sol.title}" missing Mental Model.`);
            animErrors++;
        }
    });

    console.log("\n=== Stats ===");
    console.log(`Slug/Struct Errors: ${slugErrors}`);
    console.log(`Data Mismatches: ${titleErrors}`);
    console.log(`Missing Animations/Models: ${animErrors}`);
    console.log(`Placeholder Text Found: ${placeholderErrors}`);
}

main();
