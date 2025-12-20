const fs = require('fs');
const path = require('path');

const PROBLEMS_PATH = path.join(__dirname, '../api/data/problems.json');

const CASE_FIXES = {
    "Bit Dp": "Bit DP",
    "Grid Dp (Paths Count)": "Grid DP (Paths Count)",
    "Dp": "DP"
};

function main() {
    const data = JSON.parse(fs.readFileSync(PROBLEMS_PATH, 'utf8'));
    let changes = 0;

    if (data.categories) {
        data.categories.forEach(cat => {
            cat.problems.forEach(p => {
                if (p.subTopic) {
                    for (const [bad, good] of Object.entries(CASE_FIXES)) {
                        if (p.subTopic.includes(bad)) {
                            // Only replace if it matches casing of 'bad'
                            const regex = new RegExp(bad, 'g');
                            if (regex.test(p.subTopic)) {
                                p.subTopic = p.subTopic.replace(regex, good);
                                changes++;
                                console.log(`Fixed casing: ${bad} -> ${good} in "${p.title}"`);
                            }
                        }
                    }
                }
            });
        });
    }

    fs.writeFileSync(PROBLEMS_PATH, JSON.stringify(data, null, 2));
    console.log(`Fixed ${changes} casing issues.`);
}

main();
