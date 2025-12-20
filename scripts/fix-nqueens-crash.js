/**
 * Script to fix N-Queens II crash
 * Run: node scripts/fix-nqueens-crash.js
 */

const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../data/solutions.json');

// Reuse N-Queens logic for N-Queens II visual
const enhancedNQueens = [
    {
        "step": 1,
        "visual": "board (4x4)",
        "transientMessage": "Goal: Count valid 4-queens configurations.",
        "arrayState": [
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.']
        ],
        "pointers": [],
        "indices": [],
        "color": "accent"
    },
    {
        "step": 2,
        "visual": "Finding Solution 1...",
        "transientMessage": "Found configuration 1",
        "arrayState": [
            ['.', 'Q', '.', '.'],
            ['.', '.', '.', 'Q'],
            ['Q', '.', '.', '.'],
            ['.', '.', 'Q', '.']
        ],
        "pointers": [],
        "indices": [[0, 1], [1, 3], [2, 0], [3, 2]],
        "color": "success"
    },
    {
        "step": 3,
        "visual": "Finding Solution 2...",
        "transientMessage": "Found configuration 2",
        "arrayState": [
            ['.', '.', 'Q', '.'],
            ['Q', '.', '.', '.'],
            ['.', '.', '.', 'Q'],
            ['.', 'Q', '.', '.']
        ],
        "pointers": [],
        "indices": [[0, 2], [1, 0], [2, 3], [3, 1]],
        "color": "success"
    },
    {
        "step": 4,
        "visual": "Answer: 2",
        "transientMessage": "Total solutions found: 2 ✅",
        "arrayState": [
            ['.', '.', 'Q', '.'],
            ['Q', '.', '.', '.'],
            ['.', '.', '.', 'Q'],
            ['.', 'Q', '.', '.']
        ],
        "pointers": [],
        "indices": [],
        "color": "success"
    }
];

function main() {
    console.log('Reading solutions.json...');
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));

    // Update n-queens-ii
    if (data.solutions['n-queens-ii']) {
        data.solutions['n-queens-ii'].visualizationType = 'grid';
        // IMPT: Fix the initialState to be 2D array
        data.solutions['n-queens-ii'].initialState = [
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.']
        ];
        data.solutions['n-queens-ii'].animationSteps = enhancedNQueens;
        console.log('✓ Fixed n-queens-ii (crash fix)');
    } else {
        console.log('✗ n-queens-ii not found');
    }

    // Double check n-queens
    if (data.solutions['n-queens']) {
        // Ensure it has steps
        if (!data.solutions['n-queens'].animationSteps || data.solutions['n-queens'].animationSteps.length === 0) {
            console.log('⚠ n-queens has no steps? (Should have been fixed in batch11)');
        } else {
            console.log('✓ n-queens looks OK');
        }
    }

    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(data, null, 2));
    console.log('✅ Done! Fixed N-Queens II crash.');
}

main();
