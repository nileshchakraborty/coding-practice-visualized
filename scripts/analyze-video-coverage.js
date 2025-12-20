const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../api/data/solutions.json'), 'utf8'));
const solutions = data.solutions || data;

const keys = Object.keys(solutions);
const withVideo = keys.filter(k => solutions[k].videoId);
const withoutVideo = keys.filter(k => !solutions[k].videoId);

console.log('=== Video Coverage Analysis ===\n');
console.log('Total solutions:', keys.length);
console.log('With video ID:', withVideo.length);
console.log('Without video ID:', withoutVideo.length);
console.log('\n--- Solutions WITHOUT video ---');
withoutVideo.forEach(k => console.log(`- ${k}: ${solutions[k].title}`));
console.log('\n--- Solutions WITH video (first 20) ---');
withVideo.slice(0, 20).forEach(k => console.log(`- ${k}: ${solutions[k].videoId}`));
