const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function main() {
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));
    const solutions = Object.values(data.solutions);

    const missing = solutions.filter(s => !s.mentalModel);
    console.log(`Missing Mental Models: ${missing.length} / ${solutions.length}`);

    const missingPatterns = {};
    missing.forEach(s => {
        const p = s.pattern || 'Unknown';
        missingPatterns[p] = (missingPatterns[p] || 0) + 1;
    });

    console.log("\nTop Patterns needing Analogies:");
    Object.entries(missingPatterns)
        .sort((a, b) => b[1] - a[1])
        .forEach(([p, count]) => console.log(`${p}: ${count}`));

    console.log("\nSample Missing Titles:");
    missing.slice(0, 5).forEach(m => console.log(`- ${m.title} (${m.pattern})`));
}

main();
