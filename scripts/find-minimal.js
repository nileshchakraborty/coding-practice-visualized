const fs = require('fs');
const path = require('path');

const PROBLEMS_PATH = path.join(__dirname, '../data/problems.json');
const SOLUTIONS_PATH = path.join(__dirname, '../data/solutions.json');

const problemsData = JSON.parse(fs.readFileSync(PROBLEMS_PATH, 'utf8'));
const solutionsData = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

// Flatten problems
const allProblems = [];
if (problemsData.categories) {
    problemsData.categories.forEach(cat => {
        allProblems.push(...cat.problems);
    });
}

const minimalSolutions = [];
const minimalByTopic = {};

allProblems.forEach(p => {
    const sol = solutionsData.solutions[p.slug];
    if (sol && sol.animationSteps) {
        const steps = sol.animationSteps;

        // Strict criteria: Must have NO pointers to be considered 'minimal'
        // If it has pointers, we assume it's one of our enhanced ones.
        const hasPointers = steps.some(s => s.pointers && s.pointers.length > 0);

        // Also capture extremely short ones just in case (e.g. placeholders)
        // But if I enhanced it, it should have pointers.

        if (!hasPointers) {
            minimalSolutions.push({
                slug: p.slug,
                title: p.title,
                steps: steps.length,
                description: sol.description || p.description,
                subTopic: p.subTopic
            });

            const topic = p.subTopic || 'Uncategorized';
            if (!minimalByTopic[topic]) minimalByTopic[topic] = [];
            minimalByTopic[topic].push(p.slug);
        }
    }
});

console.log(`Total Solutions to Enhance (No Pointers): ${minimalSolutions.length}`);
console.log('\nBy Topic (Top 10):');

const sortedTopics = Object.entries(minimalByTopic).sort((a, b) => b[1].length - a[1].length);

sortedTopics.slice(0, 10).forEach(([topic, list]) => {
    console.log(`${topic}: ${list.length}`);
});

const outPath = path.join(__dirname, 'solutions-to-enhance.json');
fs.writeFileSync(outPath, JSON.stringify(minimalSolutions, null, 2));
console.log(`\nCreated ${outPath}`);
