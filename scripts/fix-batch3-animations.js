/**
 * Script to fix more common problem animations - batch 3
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../api/data/solutions.json');
const data = require(dataPath);
const solutions = data.solutions;

let fixed = 0;

// Majority Element (Boyer-Moore)
if (solutions['majority-element']) {
    const nums = [2, 2, 1, 1, 1, 2, 2];
    const steps = [];
    let stepNum = 1;
    let candidate = null;
    let count = 0;

    steps.push({
        step: stepNum++,
        visual: `Array: [${nums.join(', ')}]`,
        transientMessage: 'Boyer-Moore Voting Algorithm',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    for (let i = 0; i < nums.length; i++) {
        if (count === 0) {
            candidate = nums[i];
            count = 1;
            steps.push({
                step: stepNum++,
                visual: `New candidate: ${candidate}`,
                transientMessage: `count = ${count}`,
                arrayState: [...nums],
                pointers: [{ label: 'c', index: i }],
                indices: [i],
                color: 'success'
            });
        } else if (nums[i] === candidate) {
            count++;
            steps.push({
                step: stepNum++,
                visual: `${nums[i]} == candidate`,
                transientMessage: `count++ = ${count}`,
                arrayState: [...nums],
                pointers: [{ label: 'i', index: i }],
                indices: [i],
                color: 'success'
            });
        } else {
            count--;
            steps.push({
                step: stepNum++,
                visual: `${nums[i]} != candidate`,
                transientMessage: `count-- = ${count}`,
                arrayState: [...nums],
                pointers: [{ label: 'i', index: i }],
                indices: [i],
                color: 'accent'
            });
        }
    }

    steps.push({
        step: stepNum++,
        visual: `Majority element: ${candidate}`,
        transientMessage: 'Complete!',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['majority-element'].animationSteps = steps;
    solutions['majority-element'].initialState = nums;
    console.log(`Fixed majority-element: ${steps.length} steps`);
    fixed++;
}

// Longest Consecutive Sequence
if (solutions['longest-consecutive-sequence']) {
    const nums = [100, 4, 200, 1, 3, 2];
    const steps = [];
    let stepNum = 1;
    const set = new Set(nums);

    steps.push({
        step: stepNum++,
        visual: `Array: [${nums.join(', ')}]`,
        transientMessage: 'Add all to HashSet',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    let longest = 0;
    for (let i = 0; i < nums.length; i++) {
        const num = nums[i];
        if (!set.has(num - 1)) {
            let length = 1;
            steps.push({
                step: stepNum++,
                visual: `Start sequence at ${num}`,
                transientMessage: `${num - 1} not in set, so ${num} is start`,
                arrayState: [...nums],
                pointers: [{ label: 'start', index: i }],
                indices: [i],
                color: 'accent'
            });

            while (set.has(num + length)) {
                length++;
            }

            if (length > longest) {
                longest = length;
                steps.push({
                    step: stepNum++,
                    visual: `Sequence: ${num} to ${num + length - 1}`,
                    transientMessage: `Length ${length} - new longest!`,
                    arrayState: [...nums],
                    pointers: [{ label: 'end', index: i }],
                    indices: [i],
                    color: 'success'
                });
            }
        }
    }

    steps.push({
        step: stepNum++,
        visual: `Longest consecutive: ${longest}`,
        transientMessage: 'Complete!',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['longest-consecutive-sequence'].animationSteps = steps;
    solutions['longest-consecutive-sequence'].initialState = nums;
    console.log(`Fixed longest-consecutive-sequence: ${steps.length} steps`);
    fixed++;
}

// Valid Anagram
if (solutions['valid-anagram']) {
    const s = 'anagram';
    const t = 'nagaram';
    const chars = s.split('');
    const steps = [];
    let stepNum = 1;
    const count = {};

    steps.push({
        step: stepNum++,
        visual: `s="${s}", t="${t}"`,
        transientMessage: 'Count characters in s',
        arrayState: [...chars],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    for (let i = 0; i < s.length; i++) {
        count[s[i]] = (count[s[i]] || 0) + 1;
        steps.push({
            step: stepNum++,
            visual: `Count '${s[i]}': ${count[s[i]]}`,
            transientMessage: `Map: ${JSON.stringify(count)}`,
            arrayState: [...chars],
            pointers: [{ label: 'i', index: i }],
            indices: [i],
            color: 'accent'
        });
    }

    steps.push({
        step: stepNum++,
        visual: `Now subtract using t`,
        transientMessage: 'Check if all counts become 0',
        arrayState: t.split(''),
        pointers: [],
        indices: [],
        color: 'accent'
    });

    for (let i = 0; i < t.length; i++) {
        count[t[i]]--;
        steps.push({
            step: stepNum++,
            visual: `Subtract '${t[i]}': ${count[t[i]]}`,
            transientMessage: count[t[i]] === 0 ? 'Matched!' : 'Updated',
            arrayState: t.split(''),
            pointers: [{ label: 'i', index: i }],
            indices: [i],
            color: count[t[i]] === 0 ? 'success' : 'accent'
        });
    }

    const isAnagram = Object.values(count).every(v => v === 0);
    steps.push({
        step: stepNum++,
        visual: `Result: ${isAnagram ? 'Valid Anagram' : 'Not Anagram'}`,
        transientMessage: 'Complete!',
        arrayState: t.split(''),
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['valid-anagram'].animationSteps = steps;
    solutions['valid-anagram'].initialState = chars;
    console.log(`Fixed valid-anagram: ${steps.length} steps`);
    fixed++;
}

// Group Anagrams
if (solutions['group-anagrams']) {
    const strs = ['eat', 'tea', 'tan', 'ate', 'nat', 'bat'];
    const steps = [];
    let stepNum = 1;
    const groups = {};

    steps.push({
        step: stepNum++,
        visual: `Strings: [${strs.map(s => `"${s}"`).join(', ')}]`,
        transientMessage: 'Group by sorted characters',
        arrayState: strs,
        pointers: [],
        indices: [],
        color: 'accent'
    });

    for (let i = 0; i < strs.length; i++) {
        const sorted = strs[i].split('').sort().join('');
        if (!groups[sorted]) groups[sorted] = [];
        groups[sorted].push(strs[i]);

        steps.push({
            step: stepNum++,
            visual: `"${strs[i]}" → "${sorted}"`,
            transientMessage: `Group: [${groups[sorted].join(', ')}]`,
            arrayState: strs,
            pointers: [{ label: 'i', index: i }],
            indices: [i],
            color: groups[sorted].length > 1 ? 'success' : 'accent'
        });
    }

    steps.push({
        step: stepNum++,
        visual: `${Object.keys(groups).length} groups found`,
        transientMessage: 'Complete!',
        arrayState: strs,
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['group-anagrams'].animationSteps = steps;
    solutions['group-anagrams'].initialState = strs;
    console.log(`Fixed group-anagrams: ${steps.length} steps`);
    fixed++;
}

// Top K Frequent Elements
if (solutions['top-k-frequent-elements']) {
    const nums = [1, 1, 1, 2, 2, 3];
    const k = 2;
    const steps = [];
    let stepNum = 1;
    const freq = {};

    steps.push({
        step: stepNum++,
        visual: `Array: [${nums.join(', ')}], k=${k}`,
        transientMessage: 'Count frequencies',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    for (let i = 0; i < nums.length; i++) {
        freq[nums[i]] = (freq[nums[i]] || 0) + 1;
        steps.push({
            step: stepNum++,
            visual: `Count ${nums[i]}: ${freq[nums[i]]}`,
            transientMessage: `Freq: ${JSON.stringify(freq)}`,
            arrayState: [...nums],
            pointers: [{ label: 'i', index: i }],
            indices: [i],
            color: 'accent'
        });
    }

    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    steps.push({
        step: stepNum++,
        visual: `Sorted by freq: ${sorted.map(([n, f]) => `${n}(${f})`).join(', ')}`,
        transientMessage: `Take top ${k}`,
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    const result = sorted.slice(0, k).map(([n]) => n);
    steps.push({
        step: stepNum++,
        visual: `Result: [${result.join(', ')}]`,
        transientMessage: 'Complete!',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['top-k-frequent-elements'].animationSteps = steps;
    solutions['top-k-frequent-elements'].initialState = nums;
    console.log(`Fixed top-k-frequent-elements: ${steps.length} steps`);
    fixed++;
}

// Remove Duplicates from Sorted Array
if (solutions['remove-duplicates-from-sorted-array']) {
    const nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4];
    const steps = [];
    let stepNum = 1;
    let k = 1;

    steps.push({
        step: stepNum++,
        visual: `Array: [${nums.join(', ')}]`,
        transientMessage: 'Two pointer approach',
        arrayState: [...nums],
        pointers: [{ label: 'k', index: 0 }],
        indices: [0],
        color: 'accent'
    });

    for (let i = 1; i < nums.length; i++) {
        if (nums[i] !== nums[k - 1]) {
            nums[k] = nums[i];
            steps.push({
                step: stepNum++,
                visual: `nums[${i}]=${nums[i]} is new`,
                transientMessage: `Place at k=${k}`,
                arrayState: [...nums],
                pointers: [{ label: 'k', index: k }, { label: 'i', index: i }],
                indices: [k, i],
                color: 'success'
            });
            k++;
        } else {
            steps.push({
                step: stepNum++,
                visual: `nums[${i}]=${nums[i]} is duplicate`,
                transientMessage: 'Skip',
                arrayState: [...nums],
                pointers: [{ label: 'k', index: k - 1 }, { label: 'i', index: i }],
                indices: [i],
                color: 'accent'
            });
        }
    }

    steps.push({
        step: stepNum++,
        visual: `${k} unique elements`,
        transientMessage: 'Complete!',
        arrayState: [...nums],
        pointers: [],
        indices: Array.from({ length: k }, (_, i) => i),
        color: 'success'
    });

    solutions['remove-duplicates-from-sorted-array'].animationSteps = steps;
    solutions['remove-duplicates-from-sorted-array'].initialState = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4];
    console.log(`Fixed remove-duplicates-from-sorted-array: ${steps.length} steps`);
    fixed++;
}

// Jump Game
if (solutions['jump-game']) {
    const nums = [2, 3, 1, 1, 4];
    const steps = [];
    let stepNum = 1;
    let maxReach = 0;

    steps.push({
        step: stepNum++,
        visual: `Array: [${nums.join(', ')}]`,
        transientMessage: 'Track maximum reachable index',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    for (let i = 0; i < nums.length; i++) {
        if (i > maxReach) {
            steps.push({
                step: stepNum++,
                visual: `Cannot reach index ${i}`,
                transientMessage: 'Return false',
                arrayState: [...nums],
                pointers: [{ label: 'i', index: i }],
                indices: [i],
                color: 'accent'
            });
            break;
        }

        const newReach = i + nums[i];
        const updated = newReach > maxReach;
        if (updated) maxReach = newReach;

        steps.push({
            step: stepNum++,
            visual: `i=${i}: can reach ${i} + ${nums[i]} = ${newReach}`,
            transientMessage: updated ? `maxReach = ${maxReach}` : 'No update',
            arrayState: [...nums],
            pointers: [{ label: 'i', index: i }],
            indices: Array.from({ length: Math.min(maxReach + 1, nums.length) }, (_, j) => j),
            color: updated ? 'success' : 'accent'
        });

        if (maxReach >= nums.length - 1) {
            steps.push({
                step: stepNum++,
                visual: `Can reach the end!`,
                transientMessage: 'Return true',
                arrayState: [...nums],
                pointers: [],
                indices: [nums.length - 1],
                color: 'success'
            });
            break;
        }
    }

    solutions['jump-game'].animationSteps = steps;
    solutions['jump-game'].initialState = nums;
    console.log(`Fixed jump-game: ${steps.length} steps`);
    fixed++;
}

// Daily Temperatures (monotonic stack)
if (solutions['daily-temperatures']) {
    const temps = [73, 74, 75, 71, 69, 72, 76, 73];
    const steps = [];
    let stepNum = 1;
    const result = Array(temps.length).fill(0);
    const stack = [];

    steps.push({
        step: stepNum++,
        visual: `Temps: [${temps.join(', ')}]`,
        transientMessage: 'Monotonic decreasing stack',
        arrayState: [...temps],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    for (let i = 0; i < temps.length; i++) {
        while (stack.length && temps[i] > temps[stack[stack.length - 1]]) {
            const prev = stack.pop();
            result[prev] = i - prev;
            steps.push({
                step: stepNum++,
                visual: `${temps[i]} > ${temps[prev]}`,
                transientMessage: `result[${prev}] = ${i} - ${prev} = ${result[prev]}`,
                arrayState: [...result],
                pointers: [{ label: 'i', index: i }, { label: 'prev', index: prev }],
                indices: [prev, i],
                color: 'success'
            });
        }
        stack.push(i);
        steps.push({
            step: stepNum++,
            visual: `Push index ${i}`,
            transientMessage: `Stack: [${stack.join(', ')}]`,
            arrayState: [...result],
            pointers: [{ label: 'i', index: i }],
            indices: [i],
            color: 'accent'
        });

        if (steps.length > 20) break;
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

    solutions['daily-temperatures'].animationSteps = steps;
    solutions['daily-temperatures'].initialState = temps;
    console.log(`Fixed daily-temperatures: ${steps.length} steps`);
    fixed++;
}

// Word Break
if (solutions['word-break']) {
    const s = 'leetcode';
    const wordDict = ['leet', 'code'];
    const chars = s.split('');
    const steps = [];
    let stepNum = 1;
    const dp = Array(s.length + 1).fill(false);
    dp[0] = true;

    steps.push({
        step: stepNum++,
        visual: `s="${s}", dict=[${wordDict.join(', ')}]`,
        transientMessage: 'dp[0] = true (empty string)',
        arrayState: [...chars],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    for (let i = 1; i <= s.length; i++) {
        for (const word of wordDict) {
            if (i >= word.length && s.substring(i - word.length, i) === word && dp[i - word.length]) {
                dp[i] = true;
                steps.push({
                    step: stepNum++,
                    visual: `Found "${word}" ending at ${i}`,
                    transientMessage: `dp[${i}] = true`,
                    arrayState: [...chars],
                    pointers: [{ label: 'end', index: i - 1 }],
                    indices: Array.from({ length: word.length }, (_, j) => i - word.length + j),
                    color: 'success'
                });
                break;
            }
        }
    }

    steps.push({
        step: stepNum++,
        visual: `Result: ${dp[s.length]}`,
        transientMessage: dp[s.length] ? 'Can be segmented!' : 'Cannot be segmented',
        arrayState: [...chars],
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['word-break'].animationSteps = steps;
    solutions['word-break'].initialState = chars;
    console.log(`Fixed word-break: ${steps.length} steps`);
    fixed++;
}

// Min Stack
if (solutions['min-stack']) {
    const ops = ['push 5', 'push 3', 'push 7', 'getMin', 'pop', 'getMin'];
    const steps = [];
    let stepNum = 1;
    const stack = [];
    const minStack = [];

    steps.push({
        step: stepNum++,
        visual: 'MinStack operations',
        transientMessage: 'Track min at each level',
        arrayState: [],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    // Push 5
    stack.push(5); minStack.push(5);
    steps.push({
        step: stepNum++,
        visual: 'push(5)',
        transientMessage: `Stack: [5], Min: 5`,
        arrayState: [...stack],
        pointers: [{ label: 'top', index: 0 }],
        indices: [0],
        color: 'accent'
    });

    // Push 3
    stack.push(3); minStack.push(3);
    steps.push({
        step: stepNum++,
        visual: 'push(3)',
        transientMessage: `Stack: [5,3], Min: 3`,
        arrayState: [...stack],
        pointers: [{ label: 'top', index: 1 }],
        indices: [1],
        color: 'success'
    });

    // Push 7
    stack.push(7); minStack.push(3);
    steps.push({
        step: stepNum++,
        visual: 'push(7)',
        transientMessage: `Stack: [5,3,7], Min still: 3`,
        arrayState: [...stack],
        pointers: [{ label: 'top', index: 2 }],
        indices: [2],
        color: 'accent'
    });

    // getMin
    steps.push({
        step: stepNum++,
        visual: 'getMin() = 3',
        transientMessage: 'O(1) min access',
        arrayState: [...stack],
        pointers: [{ label: 'min', index: 1 }],
        indices: [1],
        color: 'success'
    });

    // Pop
    stack.pop(); minStack.pop();
    steps.push({
        step: stepNum++,
        visual: 'pop() removes 7',
        transientMessage: `Stack: [5,3], Min: 3`,
        arrayState: [...stack],
        pointers: [{ label: 'top', index: 1 }],
        indices: [],
        color: 'accent'
    });

    // getMin
    steps.push({
        step: stepNum++,
        visual: 'getMin() = 3',
        transientMessage: 'Min unchanged',
        arrayState: [...stack],
        pointers: [{ label: 'min', index: 1 }],
        indices: [1],
        color: 'success'
    });

    solutions['min-stack'].animationSteps = steps;
    solutions['min-stack'].initialState = [];
    console.log(`Fixed min-stack: ${steps.length} steps`);
    fixed++;
}

// Save
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`\nFixed ${fixed} problems total. Saved to solutions.json`);
