/**
 * Script to fix animation steps for key array-based problems
 * Focuses on two-pointer and sliding window algorithms
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../api/data/solutions.json');
const data = require(dataPath);

// Helper to generate two-pointer animations
function generateTwoPointerSteps(arr, problemType) {
    const steps = [];
    let stepNum = 1;
    let left = 0;
    let right = arr.length - 1;

    // Initial step
    steps.push({
        step: stepNum++,
        visual: `Array: [${arr.join(', ')}]`,
        transientMessage: `Initialize left=0, right=${arr.length - 1}`,
        arrayState: [...arr],
        pointers: [{ label: 'L', index: left }, { label: 'R', index: right }],
        indices: [left, right],
        color: 'accent'
    });

    if (problemType === 'container') {
        // Container With Most Water
        let maxArea = 0;
        while (left < right) {
            const height = Math.min(arr[left], arr[right]);
            const width = right - left;
            const area = height * width;
            const isNewMax = area > maxArea;
            if (isNewMax) maxArea = area;

            steps.push({
                step: stepNum++,
                visual: `height=${arr[left]}, width=${width}, area=${area}`,
                transientMessage: isNewMax ? `New max area: ${maxArea}` : `Area ${area} < max ${maxArea}`,
                arrayState: [...arr],
                pointers: [{ label: 'L', index: left }, { label: 'R', index: right }],
                indices: [left, right],
                color: isNewMax ? 'success' : 'accent'
            });

            if (arr[left] < arr[right]) {
                left++;
                steps.push({
                    step: stepNum++,
                    visual: `left[${left - 1}]=${arr[left - 1]} < right[${right}]=${arr[right]}`,
                    transientMessage: 'Move left pointer right',
                    arrayState: [...arr],
                    pointers: [{ label: 'L', index: left }, { label: 'R', index: right }],
                    indices: [left],
                    color: 'accent'
                });
            } else {
                right--;
                steps.push({
                    step: stepNum++,
                    visual: `left[${left}]=${arr[left]} >= right[${right + 1}]=${arr[right + 1]}`,
                    transientMessage: 'Move right pointer left',
                    arrayState: [...arr],
                    pointers: [{ label: 'L', index: left }, { label: 'R', index: right }],
                    indices: [right],
                    color: 'accent'
                });
            }
        }
        steps.push({
            step: stepNum++,
            visual: `Result: ${maxArea}`,
            transientMessage: 'Pointers crossed - Maximum area found!',
            arrayState: [...arr],
            pointers: [],
            indices: [],
            color: 'success'
        });
    } else if (problemType === 'twoSum') {
        // Two Sum II (sorted array)
        const target = arr[0] + arr[arr.length - 1]; // Use actual endpoints as target for demo
        while (left < right) {
            const sum = arr[left] + arr[right];
            steps.push({
                step: stepNum++,
                visual: `arr[${left}] + arr[${right}] = ${arr[left]} + ${arr[right]} = ${sum}`,
                transientMessage: sum === target ? 'Found target!' : sum < target ? 'Sum too small, move left right' : 'Sum too big, move right left',
                arrayState: [...arr],
                pointers: [{ label: 'L', index: left }, { label: 'R', index: right }],
                indices: [left, right],
                color: sum === target ? 'success' : 'accent'
            });
            if (sum === target) break;
            if (sum < target) left++;
            else right--;
        }
    } else if (problemType === 'threeSum') {
        // 3Sum - show one iteration
        for (let i = 0; i < Math.min(3, arr.length - 2); i++) {
            left = i + 1;
            right = arr.length - 1;
            steps.push({
                step: stepNum++,
                visual: `Fix arr[${i}]=${arr[i]}, left=${left}, right=${right}`,
                transientMessage: 'Start two-pointer search',
                arrayState: [...arr],
                pointers: [{ label: 'i', index: i }, { label: 'L', index: left }, { label: 'R', index: right }],
                indices: [i, left, right],
                color: 'accent'
            });

            while (left < right) {
                const sum = arr[i] + arr[left] + arr[right];
                steps.push({
                    step: stepNum++,
                    visual: `${arr[i]} + ${arr[left]} + ${arr[right]} = ${sum}`,
                    transientMessage: sum === 0 ? 'Found triplet!' : sum < 0 ? 'Sum < 0, move left right' : 'Sum > 0, move right left',
                    arrayState: [...arr],
                    pointers: [{ label: 'i', index: i }, { label: 'L', index: left }, { label: 'R', index: right }],
                    indices: [i, left, right],
                    color: sum === 0 ? 'success' : 'accent'
                });
                if (sum === 0) { left++; right--; }
                else if (sum < 0) left++;
                else right--;

                if (steps.length > 20) break; // Limit steps
            }
            if (steps.length > 20) break;
        }
    } else if (problemType === 'trappingWater') {
        // Trapping Rain Water
        let leftMax = 0, rightMax = 0, water = 0;
        while (left < right) {
            if (arr[left] < arr[right]) {
                if (arr[left] >= leftMax) {
                    leftMax = arr[left];
                    steps.push({
                        step: stepNum++,
                        visual: `Update leftMax = ${leftMax}`,
                        transientMessage: 'New left boundary',
                        arrayState: [...arr],
                        pointers: [{ label: 'L', index: left }, { label: 'R', index: right }],
                        indices: [left],
                        color: 'accent'
                    });
                } else {
                    const trapped = leftMax - arr[left];
                    water += trapped;
                    steps.push({
                        step: stepNum++,
                        visual: `Trap ${trapped} water at index ${left}`,
                        transientMessage: `Total water: ${water}`,
                        arrayState: [...arr],
                        pointers: [{ label: 'L', index: left }, { label: 'R', index: right }],
                        indices: [left],
                        color: 'success'
                    });
                }
                left++;
            } else {
                if (arr[right] >= rightMax) {
                    rightMax = arr[right];
                    steps.push({
                        step: stepNum++,
                        visual: `Update rightMax = ${rightMax}`,
                        transientMessage: 'New right boundary',
                        arrayState: [...arr],
                        pointers: [{ label: 'L', index: left }, { label: 'R', index: right }],
                        indices: [right],
                        color: 'accent'
                    });
                } else {
                    const trapped = rightMax - arr[right];
                    water += trapped;
                    steps.push({
                        step: stepNum++,
                        visual: `Trap ${trapped} water at index ${right}`,
                        transientMessage: `Total water: ${water}`,
                        arrayState: [...arr],
                        pointers: [{ label: 'L', index: left }, { label: 'R', index: right }],
                        indices: [right],
                        color: 'success'
                    });
                }
                right--;
            }
        }
        steps.push({
            step: stepNum++,
            visual: `Result: ${water} units of water`,
            transientMessage: 'Complete!',
            arrayState: [...arr],
            pointers: [],
            indices: [],
            color: 'success'
        });
    }

    return steps;
}

// Fix specific problems
const fixes = {
    'container-with-most-water': {
        arr: [1, 8, 6, 2, 5, 4, 8, 3, 7],
        type: 'container'
    },
    'two-sum-ii-input-array-is-sorted': {
        arr: [2, 7, 11, 15],
        type: 'twoSum'
    },
    '3sum': {
        arr: [-1, 0, 1, 2, -1, -4],
        type: 'threeSum'
    },
    'trapping-rain-water': {
        arr: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1],
        type: 'trappingWater'
    }
};

let fixed = 0;
for (const [slug, config] of Object.entries(fixes)) {
    if (data.solutions[slug]) {
        const steps = generateTwoPointerSteps(config.arr, config.type);
        data.solutions[slug].animationSteps = steps;
        data.solutions[slug].initialState = config.arr;
        console.log(`Fixed ${slug}: ${steps.length} steps`);
        fixed++;
    }
}

// Save
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`\nFixed ${fixed} problems. Saved to solutions.json`);
