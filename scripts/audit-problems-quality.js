const fs = require('fs');
const path = require('path');

const PROBLEMS_PATH = path.join(__dirname, '../api/data/problems.json');
const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function main() {
    console.log("=== Problems Quality Audit ===\n");
    const problems = JSON.parse(fs.readFileSync(PROBLEMS_PATH, 'utf8'));
    const solutions = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    const issues = {
        missingDescription: [],
        shortDescription: [],
        missingSubTopic: [],
        missingUrl: [],
        invalidDifficulty: [],
        noMatchingSolution: [],
        emptyTitle: []
    };

    let totalProblems = 0;

    if (problems.categories) {
        problems.categories.forEach(cat => {
            cat.problems.forEach(p => {
                totalProblems++;

                // Title
                if (!p.title || p.title.length < 3) {
                    issues.emptyTitle.push(p.slug);
                }

                // Description
                if (!p.description) {
                    issues.missingDescription.push(p.slug);
                } else if (p.description.length < 30) {
                    issues.shortDescription.push({ slug: p.slug, len: p.description.length });
                }

                // SubTopic
                if (!p.subTopic || p.subTopic === 'General') {
                    issues.missingSubTopic.push(p.slug);
                }

                // URL
                if (!p.url) {
                    issues.missingUrl.push(p.slug);
                }

                // Difficulty
                if (!['Easy', 'Medium', 'Hard'].includes(p.difficulty)) {
                    issues.invalidDifficulty.push({ slug: p.slug, diff: p.difficulty });
                }

                // Matching Solution
                if (!solutions.solutions[p.slug]) {
                    issues.noMatchingSolution.push(p.slug);
                }
            });
        });
    }

    // Report
    console.log(`📊 PROBLEMS QUALITY AUDIT (${totalProblems} total)\n`);

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
