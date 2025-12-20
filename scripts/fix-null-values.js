const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function main() {
    console.log("=== Fixing Null Values in Solutions ===");
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    let fixed = 0;

    Object.entries(data.solutions).forEach(([slug, sol]) => {
        let wasFixed = false;

        // Fix null videoId
        if (sol.videoId === null) {
            delete sol.videoId;
            wasFixed = true;
        }

        // Fix null neetcodeLink
        if (sol.neetcodeLink === null) {
            delete sol.neetcodeLink;
            wasFixed = true;
        }

        // Fix null takeuforwardLink
        if (sol.takeuforwardLink === null) {
            delete sol.takeuforwardLink;
            wasFixed = true;
        }

        // Fix null leetcodeLink
        if (sol.leetcodeLink === null) {
            delete sol.leetcodeLink;
            wasFixed = true;
        }

        // Fix any other null fields
        Object.keys(sol).forEach(key => {
            if (sol[key] === null) {
                delete sol[key];
                wasFixed = true;
            }
        });

        if (wasFixed) {
            console.log(`Fixed: ${slug}`);
            fixed++;
        }
    });

    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(data, null, 2));
    console.log(`\nFixed ${fixed} solutions with null values.`);
}

main();
