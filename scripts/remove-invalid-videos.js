const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

// Known invalid video IDs (manually identified or reported)
const INVALID_VIDEO_IDS = [
    'CjKJDloMnwM'  // H-Index - video unavailable
];

function main() {
    console.log("=== Removing Invalid Video IDs ===");
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    let removed = 0;

    Object.entries(data.solutions).forEach(([slug, sol]) => {
        if (sol.videoId && INVALID_VIDEO_IDS.includes(sol.videoId)) {
            console.log(`Removed invalid videoId from: ${slug} (was: ${sol.videoId})`);
            delete sol.videoId;
            removed++;
        }
    });

    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(data, null, 2));
    console.log(`\nRemoved ${removed} invalid video IDs.`);
}

main();
