const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

const DIFF_VALUE = { "Easy": 1, "Medium": 2, "Hard": 3 };

function main() {
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));
    let violations = 0;
    let checked = 0;

    Object.values(data.solutions).forEach(sol => {
        if (sol.suggestedNextQuestion) {
            const currentDiff = sol.difficulty; // e.g. "Easy"
            const nextDiff = sol.suggestedNextQuestion.difficulty;

            if (currentDiff && nextDiff) {
                const cVal = DIFF_VALUE[currentDiff];
                const nVal = DIFF_VALUE[nextDiff];

                if (nVal < cVal) {
                    // This is a regression (e.g. Hard -> Medium) which MIGHT be okay if it's a new pattern topic, 
                    // but within the *same* pattern it should generally be ascending.
                    // Let's check pattern match.
                    if (sol.pattern === sol.suggestedNextQuestion.pattern) {
                        console.log(`[VIOLATION] ${sol.title} (${currentDiff}) -> ${sol.suggestedNextQuestion.title} (${nextDiff}) [Same Pattern: ${sol.pattern}]`);
                        violations++;
                    } else {
                        // Pattern switch: Regression is allowed (starting new topic)
                        // console.log(`[INFO-SWITCH] ${sol.title} -> ${sol.suggestedNextQuestion.title} (Diff dropped, but pattern changed)`);
                    }
                }
                checked++;
            }
        }
    });

    console.log(`Checked ${checked} links. Found ${violations} progression violations.`);
}

main();
