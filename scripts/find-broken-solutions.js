const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function main() {
    console.log("=== Finding Broken Solutions (v2) ===\n");
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    const issues = [];

    Object.entries(data.solutions).forEach(([slug, sol]) => {
        const problems = [];

        // Check for missing/empty critical fields
        if (!sol.title) problems.push("missing title");
        if (!sol.code || sol.code.length < 10) problems.push("missing/short code");
        if (!sol.oneliner) problems.push("missing oneliner");
        if (!sol.intuition || sol.intuition.length === 0) problems.push("missing intuition");
        if (!sol.pattern) problems.push("missing pattern");
        if (!sol.timeComplexity) problems.push("missing timeComplexity");
        if (!sol.spaceComplexity) problems.push("missing spaceComplexity");

        // Check approaches
        if (sol.approaches) {
            sol.approaches.forEach((app, i) => {
                if (!app.code || app.code.length < 10) problems.push(`approach[${i}].code missing/short`);
                if (!app.intuition || app.intuition.length === 0) problems.push(`approach[${i}].intuition missing`);
            });
        }

        // Check for actual null VALUES in fields (not text content)
        function hasNullValue(obj) {
            for (let key in obj) {
                if (obj[key] === null) return true;
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    if (hasNullValue(obj[key])) return true;
                }
            }
            return false;
        }

        if (hasNullValue(sol)) {
            problems.push("contains null values in fields");
        }

        if (problems.length > 0) {
            issues.push({ slug, problems });
        }
    });

    console.log(`Found ${issues.length} solutions with potential issues:\n`);
    issues.forEach(({ slug, problems }) => {
        console.log(`[${slug}]`);
        problems.forEach(p => console.log(`  - ${p}`));
    });

    if (issues.length === 0) {
        console.log("No critical issues found!");
    }
}

main();
