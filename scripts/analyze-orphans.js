const fs = require('fs');
const path = require('path');

const PROBLEMS_PATH = path.join(__dirname, '../api/data/problems.json');
const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function main() {
    console.log("=== Analyzing Orphans & GFG ===");
    const problemsData = JSON.parse(fs.readFileSync(PROBLEMS_PATH, 'utf8'));
    const solutionsData = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    // 1. Get all valid problem slugs
    const validSlugs = new Set();
    const slugToTitle = {};

    if (problemsData.categories) {
        problemsData.categories.forEach(cat => {
            cat.problems.forEach(p => {
                validSlugs.add(p.slug);
                slugToTitle[p.slug] = p.title;
            });
        });
    }

    // 2. Find orphans in solutions
    const solutionKeys = Object.keys(solutionsData.solutions);
    let orphans = 0;

    solutionKeys.forEach(key => {
        if (!validSlugs.has(key)) {
            console.log(`[ORPHAN] Solution key "${key}" (Title: "${solutionsData.solutions[key].title}") has no matching Problem Listing.`);
            orphans++;
        }
    });

    // 3. Check GFG specifically
    // "GFG - Reverse first K elements of a Queue"
    const gfgProb = Object.values(slugToTitle).find(t => t.includes("Reverse first K elements"));
    if (gfgProb) {
        // Find slug for this title
        const gfgSlug = Object.keys(slugToTitle).find(s => slugToTitle[s] === gfgProb);
        console.log(`\n[GFG DEBUGGER]`);
        console.log(`Problem Title: "${gfgProb}"`);
        console.log(`Problem Slug: "${gfgSlug}"`);
        console.log(`Has Solution? ${solutionsData.solutions[gfgSlug] ? "YES" : "NO"}`);

        if (!solutionsData.solutions[gfgSlug]) {
            // Try to find a solution that looks like it
            const candidate = Object.values(solutionsData.solutions).find(s => s.title && s.title.includes("Reverse first K"));
            if (candidate) {
                console.log(`Found candidate solution with title: "${candidate.title}"`);
            }
        }
    }
}

main();
