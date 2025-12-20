/**
 * Narrative Enhancement Script
 * Injects descriptive 'transientMessage' into animation steps for problems identified as having "Low Narrative".
 */

const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

// Map of improved messages for key steps in specific problems
const NARRATIVE_MAP = {
    "integer-to-roman": {
        "step_pattern": (step) => {
            if (step.visual.includes("Subtract")) return `Value is large enough. We subtract ${step.visual.match(/\d+/)[0]} and append the symbol.`;
            return "Checking if value fits current symbol...";
        }
    },
    "zigzag-conversion": {
        "step_pattern": (step) => {
            if (step.visual.includes("Down")) return "Moving DOWN the column.";
            if (step.visual.includes("Up")) return "Moving DIAGONALLY UP to the right.";
            return "Placing character at current grid position.";
        }
    },
    // Generic fallback for others: slightly more verbose default
    "default": (step, index) => {
        if (step.pointers && step.pointers.length > 0) {
            return `Checking position ${step.pointers[0].index}...`;
        }
        return `Step ${index}: updating state...`;
    }
};

function enhanceNarrative() {
    console.log("Reading solutions...");
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));
    const solutions = data.solutions;

    const TARGETS = [
        "integer-to-roman",
        "zigzag-conversion",
        "find-the-index-of-the-first-occurrence-in-a-string",
        "text-justification",
        "find-all-numbers-disappeared-in-an-array",
        "delete-node-in-a-bst",
        "insert-into-a-binary-search-tree",
        "palindrome-linked-list",
        "gfg---reverse-first-k-elements-of-a-queue",
        "two-sum-ii---input-array-is-sorted",
        "squares-of-a-sorted-array",
        "longest-mountain-in-array",
        "insert-delete-getrandom-o1",
        "how-many-numbers-are-smaller-than-the-current-number",
        "basic-calculator",
        "lru-cache",
        "binary-search-tree-iterator",
        "lowest-common-ancestor-of-a-binary-search-tree",
        "lowest-common-ancestor-of-a-bst",
        "evaluate-division",
        "cheapest-flights-within-k-stops",
        "snakes-and-ladders",
        "implement-trie-prefix-tree",
        "design-add-and-search-words-data-structure",
        "word-search-ii",
        "combinations",
        "edit-distance",
        "unique-paths"
    ];

    let count = 0;

    TARGETS.forEach(slug => {
        const sol = solutions[slug];
        if (!sol || !sol.animationSteps) return;

        let modified = false;
        sol.animationSteps = sol.animationSteps.map((step, idx) => {
            // Only enhance if message is missing or too short
            if (!step.transientMessage || step.transientMessage.length < 5) {
                modified = true;
                let newMessage = "";

                // 1. Specific Logic
                if (NARRATIVE_MAP[slug]) {
                    newMessage = NARRATIVE_MAP[slug].step_pattern(step);
                }
                // 2. Generic Heuristics
                else if (step.transientMessage) {
                    // Expand existing short message
                    newMessage = `Processing: ${step.transientMessage}`;
                } else {
                    // Generate based on visual state
                    if (step.indices && step.indices.length > 0) {
                        newMessage = `Updating index ${step.indices.join(', ')}.`;
                    } else {
                        newMessage = `Proceeding to next logical step.`;
                    }
                }

                return { ...step, transientMessage: newMessage };
            }
            return step;
        });

        if (modified) {
            console.log(`✓ Enhanced narrative for: ${slug}`);
            count++;
        }
    });

    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(data, null, 2));
    console.log(`\n🎉 Narrative Injection Complete! Updated ${count} solutions.`);
}

enhanceNarrative();
