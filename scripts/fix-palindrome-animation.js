/**
 * Script to generate detailed animation steps for Valid Palindrome
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../api/data/solutions.json');
const data = require(dataPath);
const sol = data.solutions['valid-palindrome'];

// Generate detailed animation steps for two-pointer palindrome
const str = 'A man, a plan, a canal: Panama';
const chars = str.split('');
const steps = [];

// Helper to check if char is alphanumeric
const isAlphaNum = c => /[a-zA-Z0-9]/.test(c);

let left = 0;
let right = str.length - 1;
let stepNum = 1;

// Initial step
steps.push({
    step: stepNum++,
    visual: `s = "${str}"`,
    transientMessage: `Initialize left=0, right=${str.length - 1}`,
    arrayState: [...chars],
    pointers: [{ label: 'L', index: left }, { label: 'R', index: right }],
    indices: [left, right],
    color: 'accent'
});

while (left < right) {
    // Skip non-alphanumeric on left
    while (left < right && !isAlphaNum(str[left])) {
        const skipped = str[left];
        left++;
        steps.push({
            step: stepNum++,
            visual: `Skip non-alphanumeric '${skipped}' on left`,
            transientMessage: 'Left pointer moves right past non-alphanumeric',
            arrayState: [...chars],
            pointers: [{ label: 'L', index: left }, { label: 'R', index: right }],
            indices: [left],
            color: 'accent'
        });
    }

    // Skip non-alphanumeric on right
    while (left < right && !isAlphaNum(str[right])) {
        const skipped = str[right];
        right--;
        steps.push({
            step: stepNum++,
            visual: `Skip non-alphanumeric '${skipped}' on right`,
            transientMessage: 'Right pointer moves left past non-alphanumeric',
            arrayState: [...chars],
            pointers: [{ label: 'L', index: left }, { label: 'R', index: right }],
            indices: [right],
            color: 'accent'
        });
    }

    if (left >= right) break;

    // Compare characters
    const leftChar = str[left].toLowerCase();
    const rightChar = str[right].toLowerCase();
    const match = leftChar === rightChar;

    steps.push({
        step: stepNum++,
        visual: `Compare '${str[left]}' (idx ${left}) vs '${str[right]}' (idx ${right})`,
        transientMessage: match
            ? `'${leftChar}' == '${rightChar}' ✓ Match! Move pointers inward`
            : `'${leftChar}' != '${rightChar}' ✗ Not a palindrome!`,
        arrayState: [...chars],
        pointers: [{ label: 'L', index: left }, { label: 'R', index: right }],
        indices: [left, right],
        color: match ? 'success' : 'accent'
    });

    if (!match) break;

    left++;
    right--;
}

// Final step
steps.push({
    step: stepNum++,
    visual: 'Result: true',
    transientMessage: "Pointers crossed - It's a palindrome! ✅",
    arrayState: [...chars],
    pointers: [],
    indices: [],
    color: 'success'
});

console.log('Generated', steps.length, 'steps');

// Update the solution
sol.animationSteps = steps;

// Write back
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('Updated solutions.json');
