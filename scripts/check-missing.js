const fs = require('fs');
const path = require('path');

const PROBLEMS_PATH = path.join(__dirname, '../data/problems.json');
const SOLUTIONS_PATH = path.join(__dirname, '../data/solutions.json');

const problemsData = JSON.parse(fs.readFileSync(PROBLEMS_PATH, 'utf8'));
const solutionsData = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

// Flatten problems from categories
const allProblems = [];
if (problemsData.categories) {
    problemsData.categories.forEach(cat => {
        allProblems.push(...cat.problems);
    });
} else if (Array.isArray(problemsData.problems)) {
    allProblems.push(...problemsData.problems);
} else {
    console.error("Unknown problems.json structure");
    process.exit(1);
}

const existingSolutions = solutionsData.solutions;
const missing = [];
const missingByTopic = {};

allProblems.forEach(p => {
    if (!existingSolutions[p.slug]) {
        missing.push(p);
        const topic = p.subTopic || 'Uncategorized';
        if (!missingByTopic[topic]) missingByTopic[topic] = [];
        missingByTopic[topic].push(p.slug);
    }
});

console.log(`Total Problems Found: ${allProblems.length}`);
console.log(`Existing Solutions: ${Object.keys(existingSolutions).length}`);
console.log(`Missing Solutions: ${missing.length}`);
console.log('\nMissing by Topic (Top 10):');

const sortedTopics = Object.entries(missingByTopic).sort((a, b) => b[1].length - a[1].length);

sortedTopics.slice(0, 10).forEach(([topic, list]) => {
    console.log(`${topic}: ${list.length} missing`);
});

const prioritizedList = missing.map(p => ({
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    subTopic: p.subTopic
}));

const outPath = path.join(__dirname, 'missing-solutions.json');
fs.writeFileSync(outPath, JSON.stringify(prioritizedList, null, 2));
console.log(`\nCreated ${outPath}`);
