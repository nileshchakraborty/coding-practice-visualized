const fs = require('fs');
const path = require('path');

const PROBLEMS_PATH = path.join(__dirname, '../api/data/problems.json');

function main() {
    const data = JSON.parse(fs.readFileSync(PROBLEMS_PATH, 'utf8'));

    // Collect all subtopics
    const subtopics = new Set();
    if (data.categories) {
        data.categories.forEach(cat => {
            cat.problems.forEach(p => {
                if (p.subTopic) subtopics.add(p.subTopic);
            });
        });
    }

    // Sort and display
    const sorted = Array.from(subtopics).sort();
    console.log(`\n=== Found ${sorted.length} Unique Subtopics ===`);
    sorted.forEach(s => console.log(`"${s}"`));

    // Check for suspicious similarity (e.g. "Arrays" vs "Array")
    console.log("\n=== Potential Duplicates (Levenstein/Casing) ===");
    for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
            const a = sorted[i].toLowerCase();
            const b = sorted[j].toLowerCase();
            if (a !== b && (a.includes(b) || b.includes(a) || Math.abs(a.length - b.length) < 3)) {
                // Simple heuristic
                if (a.replace(/s$/, '') === b.replace(/s$/, '')) {
                    console.log(`Warning: "${sorted[i]}" vs "${sorted[j]}"`);
                }
            }
        }
    }
}

main();
