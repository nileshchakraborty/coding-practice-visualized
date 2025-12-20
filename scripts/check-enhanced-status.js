const fs = require('fs');
const path = require('path');

const PROBLEMS_PATH = path.join(__dirname, '../api/data/problems.json');
const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function main() {
    const problems = JSON.parse(fs.readFileSync(PROBLEMS_PATH, 'utf8'));
    const solutions = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8')).solutions;

    let total = 0;
    let enhanced = 0;
    let unenhanced = [];

    problems.categories.forEach(cat => {
        cat.problems.forEach(p => {
            total++;
            const sol = solutions[p.slug];
            if (sol && sol.animationSteps && sol.animationSteps.length > 0) {
                enhanced++;
            } else {
                unenhanced.push({
                    title: p.title,
                    slug: p.slug,
                    hasSolutionEntry: !!sol,
                    category: cat.name
                });
            }
        });
    });

    console.log(`Total Problems: ${total}`);
    console.log(`Enhanced: ${enhanced}`);
    console.log(`Remaining: ${unenhanced.length}`);
    console.log('\n--- Unenhanced Candidates ---');
    unenhanced.forEach(u => {
        console.log(`[${u.category}] ${u.title} (${u.slug}) - Has Entry: ${u.hasSolutionEntry}`);
    });
}

main();
