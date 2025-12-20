const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function main() {
    console.log("=== Audit: Missing Video Links ===\n");
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    const missing = [];
    const present = [];

    Object.entries(data.solutions).forEach(([slug, sol]) => {
        if (!sol.videoId) {
            missing.push({ slug, title: sol.title });
        } else {
            present.push({ slug, videoId: sol.videoId });
        }
    });

    console.log(`✅ With Video: ${present.length}`);
    console.log(`❌ Missing Video: ${missing.length}\n`);

    console.log("Missing videos (first 20):");
    missing.slice(0, 20).forEach(m => console.log(`  - ${m.slug}`));
    if (missing.length > 20) console.log(`  ... and ${missing.length - 20} more`);
}

main();
