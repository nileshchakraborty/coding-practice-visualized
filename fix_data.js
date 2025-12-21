const fs = require('fs');
const path = require('path');

const solutionsPath = path.join(__dirname, 'api/data/solutions.json');
const data = require(solutionsPath);

const problems = data.solutions;
const problemKeys = Object.keys(problems);

// Group by pattern for "Next Question" logic
const byPattern = {};
problemKeys.forEach(key => {
    const p = problems[key];
    if (!p.pattern) return;
    if (!byPattern[p.pattern]) byPattern[p.pattern] = [];
    byPattern[p.pattern].push(key);
});

let updatedCount = 0;

problemKeys.forEach(key => {
    let p = problems[key];
    let modified = false;

    // 1. Fix LeetCode Link
    if (!p.leetcodeLink) {
        p.leetcodeLink = `https://leetcode.com/problems/${key}/`;
        modified = true;
    }

    // 2. Fix NeetCode Link
    if (!p.neetcodeLink) {
        p.neetcodeLink = `https://neetcode.io/problems/${key}`;
        modified = true;
    }

    // 3. Fix Suggested Next Question
    if (!p.suggestedNextQuestion && p.pattern) {
        const patternGroup = byPattern[p.pattern];
        const currentIndex = patternGroup.indexOf(key);
        // Pick next in group, or wrap around
        const nextKey = patternGroup[(currentIndex + 1) % patternGroup.length];

        // Don't suggest self if it's the only one
        if (nextKey !== key) {
            const nextProblem = problems[nextKey];
            p.suggestedNextQuestion = {
                slug: nextKey,
                title: nextProblem.title,
                difficulty: nextProblem.difficulty || "Medium", // Fallback
                pattern: nextProblem.pattern
            };
            modified = true;
        }
    }

    // Ensure difficulty exists (heuristic based? or just leave missing?)
    // The previous script showed "difficulty" missing for "solutions" (the root key issue)
    // but looking at valid-palindrome it has "difficulty": "Easy".
    // I won't guess difficulty for now to avoid wrong info.

    if (modified) {
        updatedCount++;
    }
});

fs.writeFileSync(solutionsPath, JSON.stringify(data, null, 2));
console.log(`Updated ${updatedCount} problems.`);
