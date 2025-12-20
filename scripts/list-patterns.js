const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function main() {
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));
    const solutions = Object.values(data.solutions);

    const patterns = new Set();
    solutions.forEach(s => {
        if (s.pattern) patterns.add(s.pattern);
    });

    console.log("Unique Patterns:");
    const sorted = Array.from(patterns).sort();
    sorted.forEach(p => console.log(p));
}

main();
