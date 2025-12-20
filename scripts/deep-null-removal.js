const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function removeNulls(obj) {
    if (Array.isArray(obj)) {
        return obj.map(item => removeNulls(item)).filter(item => item !== null);
    } else if (typeof obj === 'object' && obj !== null) {
        const result = {};
        for (let key in obj) {
            if (obj[key] !== null) {
                result[key] = removeNulls(obj[key]);
            }
        }
        return result;
    }
    return obj;
}

function main() {
    console.log("=== Deep Null Removal ===");
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    let fixed = 0;

    Object.keys(data.solutions).forEach(slug => {
        const original = JSON.stringify(data.solutions[slug]);
        data.solutions[slug] = removeNulls(data.solutions[slug]);
        const cleaned = JSON.stringify(data.solutions[slug]);

        if (original !== cleaned) {
            console.log(`Fixed: ${slug}`);
            fixed++;
        }
    });

    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(data, null, 2));
    console.log(`\nRemoved null values from ${fixed} solutions.`);
}

main();
