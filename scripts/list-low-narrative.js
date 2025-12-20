/**
 * Identify Low Narrative Candidates Script
 * Outputs the list of slugs that failed the narrative check.
 */
const fs = require('fs');
const path = require('path');

const PROBLEMS_PATH = path.join(__dirname, '../api/data/problems.json');
const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function main() {
    const problems = JSON.parse(fs.readFileSync(PROBLEMS_PATH, 'utf8'));
    const solutions = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8')).solutions;
    const candidates = [];

    problems.categories.forEach(cat => {
        cat.problems.forEach(p => {
            const sol = solutions[p.slug];
            if (sol && sol.animationSteps) {
                const messageCount = sol.animationSteps.filter(s => s.transientMessage && s.transientMessage.length > 5).length;
                const ratio = messageCount / sol.animationSteps.length;
                // Strict check: ratio < 0.5 mean half the steps have no useful text
                if (ratio < 0.5) {
                    candidates.push(p.slug);
                }
            }
        });
    });

    console.log(JSON.stringify(candidates, null, 2));
}

main();
