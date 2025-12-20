const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../data/solutions.json');
const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

let total = 0;
let withAnimation = 0;
let withoutAnimation = 0;

const missingContent = [];

Object.entries(data.solutions).forEach(([slug, sol]) => {
    total++;
    if (sol.animationSteps && sol.animationSteps.length > 0) {
        withAnimation++;
    } else {
        withoutAnimation++;
        missingContent.push(slug);
    }
});

console.log(`Total Solutions: ${total}`);
console.log(`With Animation Steps: ${withAnimation}`);
console.log(`Without Animation Steps: ${withoutAnimation}`);

console.log('\nSample missing content:');
console.log(missingContent.slice(0, 10));
