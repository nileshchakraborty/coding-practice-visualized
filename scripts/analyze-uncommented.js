const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

function main() {
    console.log("=== Analyzing Uncommented Solutions ===");
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));
    let uncommentedCount = 0;

    Object.keys(data.solutions).forEach(slug => {
        const sol = data.solutions[slug];
        const lines = sol.code.split('\n');

        // simple heuristic: does it have ANY "# " comment that is NOT a TODO or structure def?
        // Actually structure defs trigger "#" check.
        // My previous script added comments like "  # Comment".
        // Let's check for "  # " specifically or just look at lines that are code but NO comment.

        let hasInjectedComment = false;
        lines.forEach(line => {
            if (line.includes("  # ")) hasInjectedComment = true;
        });

        if (!hasInjectedComment) {
            console.log(`\n[MISSING] ${slug}`);
            console.log("Code snippet:");
            // Print first few lines of code (skipping docstring)
            let printed = 0;
            let inDoc = false;
            for (const line of lines) {
                if (line.trim().startsWith('"""')) { inDoc = !inDoc; continue; }
                if (inDoc) continue;
                if (line.trim().startsWith("#")) continue; // Skip structure
                if (line.trim().startsWith("def ")) continue;
                if (!line.trim()) continue;

                console.log(`  ${line}`);
                printed++;
                if (printed > 5) break;
            }
            uncommentedCount++;
        }
    });

    console.log(`\nTotal Missing: ${uncommentedCount}`);
}

main();
