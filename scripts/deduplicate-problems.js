/**
 * Script to deduplicate problems in problems.json and solutions.json.
 * Normalizes titles to identify duplicates (e.g. "N-Queen" vs "N Queen").
 * Preserves distinct variants like "N-Queens II".
 * Run: node scripts/deduplicate-problems.js
 */

const fs = require('fs');
const path = require('path');

const PROBLEMS_PATH = path.join(__dirname, '../api/data/problems.json');
const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function normalizeTitle(title) {
    if (!title) return '';
    // Lowercase, remove special chars, keep alphanumeric and roman numerals implicitly by keeping letters
    return title.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function main() {
    console.log('Reading data files...');
    const problemsData = JSON.parse(fs.readFileSync(PROBLEMS_PATH, 'utf8'));
    let solutionsData = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    // Map to track unique problems by normalized key
    // Key: normalizedTitle -> { problem, solutionSlug, categoryIndex, problemIndex }
    const problemMap = new Map();
    const duplicates = [];

    // Traverse all categories and problems
    problemsData.categories.forEach((category, catIdx) => {
        // We'll filter this list later, so we need to be careful about indices if we were modifying in-place.
        // Instead, we'll mark duplicates for removal.
        category.problems.forEach((problem, probIdx) => {
            const rawTitle = problem.title;
            const normTitle = normalizeTitle(rawTitle);

            if (problemMap.has(normTitle)) {
                // Duplicate found!
                const existing = problemMap.get(normTitle);

                // Compare difficulty, etc. (User request: "check if they are indeed duplicate... difficulty... same")
                if (existing.problem.difficulty === problem.difficulty) {
                    duplicates.push({
                        normalized: normTitle,
                        keep: existing,
                        remove: { categoryIndex: catIdx, problemIndex: probIdx, problem: problem }
                    });
                } else {
                    console.log(`⚠ Potential duplicate '${rawTitle}' vs '${existing.problem.title}' but difficulty mismatch (${problem.difficulty} vs ${existing.problem.difficulty}). Skipping merge.`);
                }
            } else {
                problemMap.set(normTitle, {
                    problem: problem,
                    slug: problem.slug,
                    categoryIndex: catIdx,
                    problemIndex: probIdx
                });
            }
        });
    });

    console.log(`Found ${duplicates.length} duplicates.`);

    // Process duplicates
    const problemsToRemove = new Set(); // Set of "catIdx-probIdx" strings

    duplicates.forEach(dup => {
        const keepSlug = dup.keep.slug;
        const removeSlug = dup.remove.problem.slug;

        console.log(`Merging: KEEP '${dup.keep.problem.title}' (${keepSlug}) | REMOVE '${dup.remove.problem.title}' (${removeSlug})`);

        // 1. Check Solutions
        const keepSol = solutionsData.solutions[keepSlug];
        const removeSol = solutionsData.solutions[removeSlug];

        if (removeSol) {
            if (!keepSol) {
                // If the one we're keeping doesn't have a solution but the duplicate does, move the solution over!
                console.log(`  -> Moving solution from ${removeSlug} to ${keepSlug}`);
                solutionsData.solutions[keepSlug] = removeSol;
                // Update the slug inside the solution object too if strictly needed, but key is most important.
                solutionsData.solutions[keepSlug].slug = keepSlug;
            } else {
                // Both have solutions. Prefer 'keepSol'.
                // If properties are missing in keepSol but present in removeSol, could merge...
                // For simplicity, assume keepSol is the one we want.
                console.log(`  -> Both have solutions. Keeping ${keepSlug}'s solution.`);
            }
            // Delete the removed solution entry
            delete solutionsData.solutions[removeSlug];
        }

        // 2. Mark for removal from problems.json
        problemsToRemove.add(`${dup.remove.categoryIndex}-${dup.remove.problemIndex}`);
    });

    // Reconstruct problems.json categories without duplicates
    const newCategories = problemsData.categories.map((cat, cIdx) => {
        const newProblems = cat.problems.filter((_, pIdx) => !problemsToRemove.has(`${cIdx}-${pIdx}`));
        return { ...cat, problems: newProblems };
    });

    problemsData.categories = newCategories;

    // Write back
    fs.writeFileSync(PROBLEMS_PATH, JSON.stringify(problemsData, null, 4));
    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(solutionsData, null, 2));

    console.log('✅ Deduplication complete.');
}

main();
