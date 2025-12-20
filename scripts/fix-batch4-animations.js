/**
 * Script to fix more problem animations - batch 4
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../api/data/solutions.json');
const data = require(dataPath);
const solutions = data.solutions;

let fixed = 0;

// Single Number (XOR)
if (solutions['single-number']) {
    const nums = [4, 1, 2, 1, 2];
    const steps = [];
    let stepNum = 1;
    let result = 0;

    steps.push({
        step: stepNum++,
        visual: `Array: [${nums.join(', ')}]`,
        transientMessage: 'XOR all elements',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    for (let i = 0; i < nums.length; i++) {
        result ^= nums[i];
        steps.push({
            step: stepNum++,
            visual: `XOR ${nums[i]}: result = ${result}`,
            transientMessage: `a^a=0, a^0=a`,
            arrayState: [...nums],
            pointers: [{ label: 'i', index: i }],
            indices: [i],
            color: result === nums[i] ? 'success' : 'accent'
        });
    }

    steps.push({
        step: stepNum++,
        visual: `Single number: ${result}`,
        transientMessage: 'Complete!',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['single-number'].animationSteps = steps;
    solutions['single-number'].initialState = nums;
    console.log(`Fixed single-number: ${steps.length} steps`);
    fixed++;
}

// Missing Number
if (solutions['missing-number']) {
    const nums = [3, 0, 1];
    const n = nums.length;
    const steps = [];
    let stepNum = 1;

    steps.push({
        step: stepNum++,
        visual: `Array: [${nums.join(', ')}], n=${n}`,
        transientMessage: 'Sum formula: n*(n+1)/2',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    const expectedSum = n * (n + 1) / 2;
    steps.push({
        step: stepNum++,
        visual: `Expected sum: ${n}*${n + 1}/2 = ${expectedSum}`,
        transientMessage: 'Sum of 0 to n',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    let actualSum = 0;
    for (let i = 0; i < nums.length; i++) {
        actualSum += nums[i];
        steps.push({
            step: stepNum++,
            visual: `Add ${nums[i]}: sum = ${actualSum}`,
            transientMessage: `Running total`,
            arrayState: [...nums],
            pointers: [{ label: 'i', index: i }],
            indices: [i],
            color: 'accent'
        });
    }

    const missing = expectedSum - actualSum;
    steps.push({
        step: stepNum++,
        visual: `Missing: ${expectedSum} - ${actualSum} = ${missing}`,
        transientMessage: 'Found missing number!',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['missing-number'].animationSteps = steps;
    solutions['missing-number'].initialState = nums;
    console.log(`Fixed missing-number: ${steps.length} steps`);
    fixed++;
}

// Evaluate Reverse Polish Notation
if (solutions['evaluate-reverse-polish-notation']) {
    const tokens = ['2', '1', '+', '3', '*'];
    const steps = [];
    let stepNum = 1;
    const stack = [];

    steps.push({
        step: stepNum++,
        visual: `Tokens: [${tokens.join(', ')}]`,
        transientMessage: 'Evaluate using stack',
        arrayState: tokens,
        pointers: [],
        indices: [],
        color: 'accent'
    });

    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (['+', '-', '*', '/'].includes(t)) {
            const b = stack.pop();
            const a = stack.pop();
            let result;
            if (t === '+') result = a + b;
            else if (t === '-') result = a - b;
            else if (t === '*') result = a * b;
            else result = Math.trunc(a / b);
            stack.push(result);
            steps.push({
                step: stepNum++,
                visual: `${a} ${t} ${b} = ${result}`,
                transientMessage: `Stack: [${stack.join(', ')}]`,
                arrayState: tokens,
                pointers: [{ label: 'op', index: i }],
                indices: [i],
                color: 'success'
            });
        } else {
            stack.push(parseInt(t));
            steps.push({
                step: stepNum++,
                visual: `Push ${t}`,
                transientMessage: `Stack: [${stack.join(', ')}]`,
                arrayState: tokens,
                pointers: [{ label: 'i', index: i }],
                indices: [i],
                color: 'accent'
            });
        }
    }

    steps.push({
        step: stepNum++,
        visual: `Result: ${stack[0]}`,
        transientMessage: 'Complete!',
        arrayState: tokens,
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['evaluate-reverse-polish-notation'].animationSteps = steps;
    solutions['evaluate-reverse-polish-notation'].initialState = tokens;
    console.log(`Fixed evaluate-reverse-polish-notation: ${steps.length} steps`);
    fixed++;
}

// Kth Largest Element (QuickSelect concept)
if (solutions['kth-largest-element-in-an-array']) {
    const nums = [3, 2, 1, 5, 6, 4];
    const k = 2;
    const steps = [];
    let stepNum = 1;

    steps.push({
        step: stepNum++,
        visual: `Array: [${nums.join(', ')}], k=${k}`,
        transientMessage: 'Find kth largest (sort approach)',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    const sorted = [...nums].sort((a, b) => b - a);
    for (let i = 0; i < Math.min(k, nums.length); i++) {
        steps.push({
            step: stepNum++,
            visual: `${i + 1}th largest: ${sorted[i]}`,
            transientMessage: i === k - 1 ? 'Found kth!' : 'Continue...',
            arrayState: sorted,
            pointers: [{ label: `${i + 1}`, index: i }],
            indices: [i],
            color: i === k - 1 ? 'success' : 'accent'
        });
    }

    steps.push({
        step: stepNum++,
        visual: `Result: ${sorted[k - 1]}`,
        transientMessage: 'Complete!',
        arrayState: sorted,
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['kth-largest-element-in-an-array'].animationSteps = steps;
    solutions['kth-largest-element-in-an-array'].initialState = nums;
    console.log(`Fixed kth-largest-element-in-an-array: ${steps.length} steps`);
    fixed++;
}

// Permutations
if (solutions['permutations']) {
    const nums = [1, 2, 3];
    const steps = [];
    let stepNum = 1;
    const result = [];

    steps.push({
        step: stepNum++,
        visual: `Array: [${nums.join(', ')}]`,
        transientMessage: 'Generate all permutations',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    function permute(arr, path) {
        if (arr.length === 0) {
            result.push([...path]);
            steps.push({
                step: stepNum++,
                visual: `Found: [${path.join(', ')}]`,
                transientMessage: `${result.length} permutations`,
                arrayState: [...path],
                pointers: [],
                indices: Array.from({ length: path.length }, (_, i) => i),
                color: 'success'
            });
            return;
        }

        for (let i = 0; i < arr.length && steps.length < 15; i++) {
            const next = [...arr];
            const picked = next.splice(i, 1)[0];
            steps.push({
                step: stepNum++,
                visual: `Pick ${picked}, remaining: [${next.join(', ')}]`,
                transientMessage: `Path: [${[...path, picked].join(', ')}]`,
                arrayState: [...arr],
                pointers: [{ label: 'pick', index: i }],
                indices: [i],
                color: 'accent'
            });
            permute(next, [...path, picked]);
        }
    }

    permute(nums, []);

    steps.push({
        step: stepNum++,
        visual: `Total: ${result.length} permutations`,
        transientMessage: 'Complete!',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['permutations'].animationSteps = steps;
    solutions['permutations'].initialState = nums;
    console.log(`Fixed permutations: ${steps.length} steps`);
    fixed++;
}

// Subsets
if (solutions['subsets']) {
    const nums = [1, 2, 3];
    const steps = [];
    let stepNum = 1;
    const result = [[]];

    steps.push({
        step: stepNum++,
        visual: `Array: [${nums.join(', ')}]`,
        transientMessage: 'Start with empty set: [[]]',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    for (let i = 0; i < nums.length; i++) {
        const len = result.length;
        steps.push({
            step: stepNum++,
            visual: `Process ${nums[i]}`,
            transientMessage: `Add ${nums[i]} to each existing subset`,
            arrayState: [...nums],
            pointers: [{ label: 'i', index: i }],
            indices: [i],
            color: 'accent'
        });

        for (let j = 0; j < len; j++) {
            const newSet = [...result[j], nums[i]];
            result.push(newSet);
            steps.push({
                step: stepNum++,
                visual: `[${result[j].join(',')}] + ${nums[i]} = [${newSet.join(',')}]`,
                transientMessage: `Total: ${result.length} subsets`,
                arrayState: [...nums],
                pointers: [],
                indices: [i],
                color: 'success'
            });
        }
    }

    steps.push({
        step: stepNum++,
        visual: `Total: ${result.length} subsets`,
        transientMessage: 'Complete!',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['subsets'].animationSteps = steps;
    solutions['subsets'].initialState = nums;
    console.log(`Fixed subsets: ${steps.length} steps`);
    fixed++;
}

// Counting Bits
if (solutions['counting-bits']) {
    const n = 5;
    const steps = [];
    let stepNum = 1;
    const result = [0];

    steps.push({
        step: stepNum++,
        visual: `n = ${n}`,
        transientMessage: 'Count 1 bits for 0 to n',
        arrayState: [...result],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    for (let i = 1; i <= n; i++) {
        result.push(result[i >> 1] + (i & 1));
        const binary = i.toString(2);
        steps.push({
            step: stepNum++,
            visual: `${i} = ${binary}`,
            transientMessage: `Bits: ${result[i]} (dp[${i >> 1}] + ${i & 1})`,
            arrayState: [...result],
            pointers: [{ label: 'i', index: i }],
            indices: [i],
            color: 'success'
        });
    }

    steps.push({
        step: stepNum++,
        visual: `Result: [${result.join(', ')}]`,
        transientMessage: 'Complete!',
        arrayState: [...result],
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['counting-bits'].animationSteps = steps;
    solutions['counting-bits'].initialState = [0];
    console.log(`Fixed counting-bits: ${steps.length} steps`);
    fixed++;
}

// Number of 1 Bits
if (solutions['number-of-1-bits']) {
    const n = 11;
    const binary = n.toString(2);
    const chars = binary.split('');
    const steps = [];
    let stepNum = 1;
    let count = 0;

    steps.push({
        step: stepNum++,
        visual: `n = ${n} = ${binary}`,
        transientMessage: 'Count 1 bits',
        arrayState: chars,
        pointers: [],
        indices: [],
        color: 'accent'
    });

    for (let i = 0; i < binary.length; i++) {
        if (binary[i] === '1') {
            count++;
            steps.push({
                step: stepNum++,
                visual: `Position ${i}: 1`,
                transientMessage: `Count = ${count}`,
                arrayState: chars,
                pointers: [{ label: '1', index: i }],
                indices: [i],
                color: 'success'
            });
        } else {
            steps.push({
                step: stepNum++,
                visual: `Position ${i}: 0`,
                transientMessage: 'Skip',
                arrayState: chars,
                pointers: [{ label: '0', index: i }],
                indices: [i],
                color: 'accent'
            });
        }
    }

    steps.push({
        step: stepNum++,
        visual: `Result: ${count} ones`,
        transientMessage: 'Complete!',
        arrayState: chars,
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['number-of-1-bits'].animationSteps = steps;
    solutions['number-of-1-bits'].initialState = chars;
    console.log(`Fixed number-of-1-bits: ${steps.length} steps`);
    fixed++;
}

// Save
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`\nFixed ${fixed} problems total. Saved to solutions.json`);
