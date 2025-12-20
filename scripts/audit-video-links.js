const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function main() {
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));
    let total = 0;
    let missing = 0;
    let invalid = 0;
    let duplicates = 0;
    const seenUrls = new Set();

    console.log("=== Video Link Audit ===");

    Object.values(data.solutions).forEach(sol => {
        total++;
        if (!sol.videoUrl) {
            console.log(`[MISSING] ${sol.title}`);
            missing++;
        } else {
            const url = sol.videoUrl;
            // Basic frequency check
            if (seenUrls.has(url)) {
                console.log(`[DUPLICATE] ${sol.title} shares URL with another problem: ${url}`);
                duplicates++;
            }
            seenUrls.add(url);

            // Regex check for youtube
            // Supports: youtube.com/watch?v=ID, youtu.be/ID, embed/ID
            const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/;
            if (!ytRegex.test(url)) {
                console.log(`[INVALID FORMAT] ${sol.title}: ${url}`);
                invalid++;
            }
        }
    });

    console.log(`\nStats:`);
    console.log(`Total Solutions: ${total}`);
    console.log(`Missing Videos: ${missing}`);
    console.log(`Invalid URLs: ${invalid}`);
    console.log(`Duplicate URLs: ${duplicates}`); // Might be okay if it's the same video covering multiple problems, but worth noting.
}

main();
