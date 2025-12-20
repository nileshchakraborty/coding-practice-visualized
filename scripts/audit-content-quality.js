const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function main() {
    console.log("=== Content Quality Audit ===\n");
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    const issues = {
        missingOneliner: [],
        shortOneliner: [],
        missingIntuition: [],
        shortIntuition: [],
        missingKeyInsight: [],
        missingDescription: [],
        shortDescription: [],
        missingExamples: [],
        missingConstraints: [],
        missingHints: [],
        missingMentalModel: [],
        placeholderText: [],
        missingTestCases: [],
        emptyApproachIntuition: []
    };

    Object.entries(data.solutions).forEach(([slug, sol]) => {
        // Oneliner
        if (!sol.oneliner) issues.missingOneliner.push(slug);
        else if (sol.oneliner.length < 20) issues.shortOneliner.push({ slug, len: sol.oneliner.length });

        // Intuition
        if (!sol.intuition || sol.intuition.length === 0) issues.missingIntuition.push(slug);
        else if (sol.intuition.length < 2) issues.shortIntuition.push({ slug, count: sol.intuition.length });

        // Key Insight
        if (!sol.keyInsight || sol.keyInsight.length < 10) issues.missingKeyInsight.push(slug);

        // Description
        if (!sol.description && !sol.problemStatement) issues.missingDescription.push(slug);
        else if ((sol.description || sol.problemStatement || '').length < 50) issues.shortDescription.push(slug);

        // Examples
        if (!sol.examples || sol.examples.length === 0) issues.missingExamples.push(slug);

        // Constraints
        if (!sol.constraints || sol.constraints.length === 0) issues.missingConstraints.push(slug);

        // Hints
        if (!sol.hints || sol.hints.length === 0) issues.missingHints.push(slug);

        // Mental Model
        if (!sol.mentalModel) issues.missingMentalModel.push(slug);

        // Test Cases
        if (!sol.testCases || sol.testCases.length === 0) issues.missingTestCases.push(slug);

        // Placeholder text
        const allText = JSON.stringify(sol).toLowerCase();
        if (allText.includes('todo') || allText.includes('coming soon') || allText.includes('placeholder')) {
            issues.placeholderText.push(slug);
        }

        // Approach intuition check
        if (sol.approaches) {
            sol.approaches.forEach((app, i) => {
                if (!app.intuition || app.intuition.length === 0) {
                    issues.emptyApproachIntuition.push(`${slug}:${app.name}`);
                }
            });
        }
    });

    // Report
    console.log("📊 QUALITY AUDIT RESULTS\n");

    Object.entries(issues).forEach(([key, arr]) => {
        if (arr.length > 0) {
            console.log(`[${key}]: ${arr.length} issues`);
            if (arr.length <= 5) {
                arr.forEach(item => console.log(`  - ${typeof item === 'string' ? item : JSON.stringify(item)}`));
            } else {
                arr.slice(0, 3).forEach(item => console.log(`  - ${typeof item === 'string' ? item : JSON.stringify(item)}`));
                console.log(`  ... and ${arr.length - 3} more`);
            }
        }
    });

    const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`\n🎯 Total Issues: ${totalIssues}`);
}

main();
