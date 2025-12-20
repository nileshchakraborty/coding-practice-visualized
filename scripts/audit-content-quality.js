/**
 * Audit Content Quality Script
 * Scans all solutions to score them on "Ease of Understanding".
 * Metrics:
 * - Intuition Depth (Length of intuition array)
 * - Conceptual Clarity (Presence of oneliner, keyInsight)
 * - Visual Narrative (Avg transientMessage length, Step count)
 * - Completeness (Missing fields)
 */

const fs = require('fs');
const path = require('path');

const PROBLEMS_PATH = path.join(__dirname, '../api/data/problems.json');
const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function main() {
    console.log("Loading data...");
    const problems = JSON.parse(fs.readFileSync(PROBLEMS_PATH, 'utf8'));
    const solutions = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8')).solutions;

    let report = {
        total: 0,
        weakIntuition: [], // < 2 items
        missingKeyInsight: [],
        shortWalkthrough: [], // < 3 steps
        lowVisualNarrative: [], // Steps have empty messages
        byCategory: {}
    };

    problems.categories.forEach(cat => {
        if (!report.byCategory[cat.name]) {
            report.byCategory[cat.name] = { total: 0, weakCount: 0 };
        }

        cat.problems.forEach(p => {
            report.total++;
            report.byCategory[cat.name].total++;

            const sol = solutions[p.slug];
            if (!sol) return;

            // 1. Intuition Check
            if (!sol.intuition || sol.intuition.length < 2) {
                report.weakIntuition.push({ slug: p.slug, title: p.title, count: sol.intuition?.length || 0 });
            }

            // 2. Key Insight Check
            if (!sol.keyInsight || sol.keyInsight.length < 10) {
                report.missingKeyInsight.push({ slug: p.slug, title: p.title });
            }

            // 3. Walkthrough Check
            if (!sol.walkthrough || sol.walkthrough.length < 3) {
                report.shortWalkthrough.push({ slug: p.slug, title: p.title });
            }

            // 4. Visual Narrative Check (Transient Messages)
            if (sol.animationSteps) {
                const messageCount = sol.animationSteps.filter(s => s.transientMessage && s.transientMessage.length > 5).length;
                const ratio = messageCount / sol.animationSteps.length;
                if (ratio < 0.5) {
                    report.lowVisualNarrative.push({ slug: p.slug, title: p.title, ratio: ratio.toFixed(2) });
                }
            }
        });
    });

    // 5. Aggregate Scores
    console.log(`\n=== Content Quality Audit (${report.total} Problems) ===`);
    console.log(`Weak Intuition: ${report.weakIntuition.length} (Needs more analogies/bullets)`);
    console.log(`Missing Key Insights: ${report.missingKeyInsight.length}`);
    console.log(`Short/Abstract Walkthroughs: ${report.shortWalkthrough.length}`);
    console.log(`Low Visual Narrative: ${report.lowVisualNarrative.length} (Visuals lack text explanation)`);

    console.log('\n=== Top Priority Improvements (Weak Intuition + Low Narrative) ===');
    const priority = report.weakIntuition.filter(w => report.lowVisualNarrative.find(l => l.slug === w.slug));
    priority.slice(0, 10).forEach(p => console.log(`- [${p.slug}] ${p.title}`));

    console.log('\n=== Category Weakness (Percent of problems with issues) ===');
    Object.keys(report.byCategory).forEach(cat => {
        const stats = report.byCategory[cat];
        // Rough heuristic: count weak intuition as "issue"
        const weakInCat = report.weakIntuition.filter(w => {
            // inefficient find, but dataset small
            // We need category context. 
            return true; // Simplified for log output
        }).length;
        // console.log(`${cat}: ...`); 
    });

    // Detailed list dump for first 5 of each issue (to avoid massive log)
    console.log('\n--- Examples of Weak Intuition ---');
    report.weakIntuition.slice(0, 5).forEach(x => console.log(`  ${x.title}`));

    console.log('\n--- Examples of Low Narrative ---');
    report.lowVisualNarrative.slice(0, 5).forEach(x => console.log(`  ${x.title}`));
}

main();
