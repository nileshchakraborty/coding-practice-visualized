const fs = require('fs');
const path = require('path');

const PROBLEMS_PATH = path.join(__dirname, '../api/data/problems.json');
const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function main() {
    console.log("=== Deep Problems Quality Audit ===\n");
    const problems = JSON.parse(fs.readFileSync(PROBLEMS_PATH, 'utf8'));
    const solutions = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    const issues = {
        shortDescription: [],
        genericDescription: [],
        missingPattern: [],
        noSubTopic: [],
        genericSubTopic: []
    };

    let totalProblems = 0;

    if (problems.categories) {
        problems.categories.forEach(cat => {
            cat.problems.forEach(p => {
                totalProblems++;

                // Short description (less than 50 chars)
                if (p.description && p.description.length < 50) {
                    issues.shortDescription.push({ slug: p.slug, len: p.description.length, desc: p.description.substring(0, 40) });
                }

                // Generic description (no specific algorithm mention)
                const desc = (p.description || '').toLowerCase();
                if (desc && (desc.includes('placeholder') || desc.includes('todo') || desc.length < 20)) {
                    issues.genericDescription.push({ slug: p.slug, desc: p.description });
                }

                // No subTopic
                if (!p.subTopic) {
                    issues.noSubTopic.push(p.slug);
                }

                // Generic subTopic (like "General")
                if (p.subTopic && (p.subTopic === 'General' || p.subTopic === 'Other' || p.subTopic === 'Unknown')) {
                    issues.genericSubTopic.push({ slug: p.slug, subTopic: p.subTopic });
                }

                // Check if solution has pattern but problem doesn't reflect it
                const sol = solutions.solutions[p.slug];
                if (sol && sol.pattern && !p.subTopic) {
                    issues.missingPattern.push({ slug: p.slug, pattern: sol.pattern });
                }
            });
        });
    }

    // Report
    console.log(`📊 DEEP PROBLEMS AUDIT (${totalProblems} total)\n`);

    Object.entries(issues).forEach(([key, arr]) => {
        if (arr.length > 0) {
            console.log(`[${key}]: ${arr.length} issues`);
            arr.slice(0, 5).forEach(item => console.log(`  - ${typeof item === 'string' ? item : JSON.stringify(item)}`));
            if (arr.length > 5) console.log(`  ... and ${arr.length - 5} more`);
        }
    });

    const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`\n🎯 Total Issues: ${totalIssues}`);

    // List sample problems for inspection
    if (totalIssues === 0) {
        console.log("\n📝 Sample problem descriptions (for manual review):");
        let count = 0;
        problems.categories.forEach(cat => {
            cat.problems.forEach(p => {
                if (count < 5) {
                    console.log(`\n[${p.slug}]`);
                    console.log(`  Title: ${p.title}`);
                    console.log(`  SubTopic: ${p.subTopic}`);
                    console.log(`  Desc: ${(p.description || '').substring(0, 80)}...`);
                    count++;
                }
            });
        });
    }
}

main();
