/**
 * Script to fix more common problem animations
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../api/data/solutions.json');
const data = require(dataPath);

// Binary Search animation
function generateBinarySearchSteps(arr, target) {
    const steps = [];
    let stepNum = 1;
    let left = 0;
    let right = arr.length - 1;

    steps.push({
        step: stepNum++,
        visual: `Search for ${target} in [${arr.join(', ')}]`,
        transientMessage: `Initialize left=0, right=${arr.length - 1}`,
        arrayState: [...arr],
        pointers: [{ label: 'L', index: left }, { label: 'R', index: right }],
        indices: [left, right],
        color: 'accent'
    });

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        steps.push({
            step: stepNum++,
            visual: `mid = (${left} + ${right}) / 2 = ${mid}`,
            transientMessage: `Check arr[${mid}] = ${arr[mid]}`,
            arrayState: [...arr],
            pointers: [{ label: 'L', index: left }, { label: 'M', index: mid }, { label: 'R', index: right }],
            indices: [mid],
            color: 'accent'
        });

        if (arr[mid] === target) {
            steps.push({
                step: stepNum++,
                visual: `arr[${mid}] = ${target} ✓`,
                transientMessage: `Found target at index ${mid}!`,
                arrayState: [...arr],
                pointers: [{ label: '✓', index: mid }],
                indices: [mid],
                color: 'success'
            });
            break;
        } else if (arr[mid] < target) {
            steps.push({
                step: stepNum++,
                visual: `${arr[mid]} < ${target}`,
                transientMessage: 'Target is in right half, move left',
                arrayState: [...arr],
                pointers: [{ label: 'L', index: mid + 1 }, { label: 'R', index: right }],
                indices: [mid + 1, right],
                color: 'accent'
            });
            left = mid + 1;
        } else {
            steps.push({
                step: stepNum++,
                visual: `${arr[mid]} > ${target}`,
                transientMessage: 'Target is in left half, move right',
                arrayState: [...arr],
                pointers: [{ label: 'L', index: left }, { label: 'R', index: mid - 1 }],
                indices: [left, mid - 1],
                color: 'accent'
            });
            right = mid - 1;
        }
    }

    return steps;
}

// Two Sum (hash map approach) animation
function generateTwoSumSteps(arr, target) {
    const steps = [];
    let stepNum = 1;
    const seen = {};

    steps.push({
        step: stepNum++,
        visual: `Find two numbers that sum to ${target}`,
        transientMessage: 'Initialize empty hash map',
        arrayState: [...arr],
        pointers: [{ label: 'i', index: 0 }],
        indices: [0],
        color: 'accent'
    });

    for (let i = 0; i < arr.length; i++) {
        const complement = target - arr[i];

        steps.push({
            step: stepNum++,
            visual: `Check arr[${i}] = ${arr[i]}`,
            transientMessage: `Need complement: ${target} - ${arr[i]} = ${complement}`,
            arrayState: [...arr],
            pointers: [{ label: 'i', index: i }],
            indices: [i],
            color: 'accent'
        });

        if (complement in seen) {
            steps.push({
                step: stepNum++,
                visual: `Found ${complement} at index ${seen[complement]}!`,
                transientMessage: `Return [${seen[complement]}, ${i}]`,
                arrayState: [...arr],
                pointers: [{ label: 'j', index: seen[complement] }, { label: 'i', index: i }],
                indices: [seen[complement], i],
                color: 'success'
            });
            break;
        }

        seen[arr[i]] = i;
        steps.push({
            step: stepNum++,
            visual: `Store ${arr[i]} → index ${i} in map`,
            transientMessage: `Map: {${Object.entries(seen).map(([k, v]) => `${k}:${v}`).join(', ')}}`,
            arrayState: [...arr],
            pointers: [{ label: 'i', index: i }],
            indices: [i],
            color: 'accent'
        });
    }

    return steps;
}

// Sliding Window Maximum animation
function generateSlidingWindowSteps(arr, k) {
    const steps = [];
    let stepNum = 1;
    const result = [];
    const deque = []; // indices

    steps.push({
        step: stepNum++,
        visual: `Find max in each window of size ${k}`,
        transientMessage: 'Initialize empty deque',
        arrayState: [...arr],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    for (let i = 0; i < arr.length; i++) {
        // Remove elements outside window
        while (deque.length && deque[0] < i - k + 1) {
            const removed = deque.shift();
            steps.push({
                step: stepNum++,
                visual: `Remove index ${removed} (outside window)`,
                transientMessage: `Deque: [${deque.join(', ')}]`,
                arrayState: [...arr],
                pointers: [{ label: 'i', index: i }],
                indices: deque.slice(0, 3),
                color: 'accent'
            });
        }

        // Remove smaller elements
        while (deque.length && arr[deque[deque.length - 1]] < arr[i]) {
            const removed = deque.pop();
            steps.push({
                step: stepNum++,
                visual: `Remove ${arr[removed]} < ${arr[i]}`,
                transientMessage: 'Smaller element removed',
                arrayState: [...arr],
                pointers: [{ label: 'i', index: i }],
                indices: [removed],
                color: 'accent'
            });
        }

        deque.push(i);
        steps.push({
            step: stepNum++,
            visual: `Add index ${i} (val=${arr[i]})`,
            transientMessage: `Deque: [${deque.join(', ')}]`,
            arrayState: [...arr],
            pointers: [{ label: 'i', index: i }],
            indices: [i],
            color: 'accent'
        });

        if (i >= k - 1) {
            result.push(arr[deque[0]]);
            steps.push({
                step: stepNum++,
                visual: `Window max: ${arr[deque[0]]}`,
                transientMessage: `Result: [${result.join(', ')}]`,
                arrayState: [...arr],
                pointers: [{ label: 'max', index: deque[0] }],
                indices: Array.from({ length: k }, (_, j) => i - k + 1 + j),
                color: 'success'
            });
        }

        if (steps.length > 25) break;
    }

    return steps;
}

// Fix specific problems
const solutions = data.solutions;

// Binary Search
if (solutions['binary-search']) {
    const arr = [-1, 0, 3, 5, 9, 12];
    solutions['binary-search'].animationSteps = generateBinarySearchSteps(arr, 9);
    solutions['binary-search'].initialState = arr;
    console.log(`Fixed binary-search: ${solutions['binary-search'].animationSteps.length} steps`);
}

// Two Sum
if (solutions['two-sum']) {
    const arr = [2, 7, 11, 15];
    solutions['two-sum'].animationSteps = generateTwoSumSteps(arr, 9);
    solutions['two-sum'].initialState = arr;
    console.log(`Fixed two-sum: ${solutions['two-sum'].animationSteps.length} steps`);
}

// Sliding Window Maximum
if (solutions['sliding-window-maximum']) {
    const arr = [1, 3, -1, -3, 5, 3, 6, 7];
    solutions['sliding-window-maximum'].animationSteps = generateSlidingWindowSteps(arr, 3);
    solutions['sliding-window-maximum'].initialState = arr;
    console.log(`Fixed sliding-window-maximum: ${solutions['sliding-window-maximum'].animationSteps.length} steps`);
}

// Search in Rotated Sorted Array
if (solutions['search-in-rotated-sorted-array']) {
    const arr = [4, 5, 6, 7, 0, 1, 2];
    solutions['search-in-rotated-sorted-array'].animationSteps = generateBinarySearchSteps(arr, 0);
    solutions['search-in-rotated-sorted-array'].initialState = arr;
    console.log(`Fixed search-in-rotated-sorted-array: ${solutions['search-in-rotated-sorted-array'].animationSteps.length} steps`);
}

// Find Minimum in Rotated Sorted Array  
if (solutions['find-minimum-in-rotated-sorted-array']) {
    const arr = [3, 4, 5, 1, 2];
    solutions['find-minimum-in-rotated-sorted-array'].animationSteps = generateBinarySearchSteps(arr, 1);
    solutions['find-minimum-in-rotated-sorted-array'].initialState = arr;
    console.log(`Fixed find-minimum-in-rotated-sorted-array: ${solutions['find-minimum-in-rotated-sorted-array'].animationSteps.length} steps`);
}

// Save
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('\nSaved to solutions.json');
