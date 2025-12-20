/**
 * Script to fix more problem animations - batch 5
 * Focus on interval, greedy, and more DP problems
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../api/data/solutions.json');
const data = require(dataPath);
const solutions = data.solutions;

let fixed = 0;

// Insert Interval
if (solutions['insert-interval']) {
    const intervals = [[1, 3], [6, 9]];
    const newInterval = [2, 5];
    const steps = [];
    let stepNum = 1;
    const result = [];

    steps.push({
        step: stepNum++,
        visual: `Intervals: ${JSON.stringify(intervals)}`,
        transientMessage: `Insert [${newInterval}]`,
        arrayState: intervals.flat(),
        pointers: [],
        indices: [],
        color: 'accent'
    });

    let i = 0;
    // Add all intervals before newInterval
    while (i < intervals.length && intervals[i][1] < newInterval[0]) {
        result.push(intervals[i]);
        steps.push({
            step: stepNum++,
            visual: `[${intervals[i]}] ends before new starts`,
            transientMessage: 'Add to result',
            arrayState: intervals.flat(),
            pointers: [{ label: 'i', index: i * 2 }],
            indices: [i * 2, i * 2 + 1],
            color: 'accent'
        });
        i++;
    }

    // Merge overlapping intervals
    let merged = [...newInterval];
    while (i < intervals.length && intervals[i][0] <= merged[1]) {
        merged[0] = Math.min(merged[0], intervals[i][0]);
        merged[1] = Math.max(merged[1], intervals[i][1]);
        steps.push({
            step: stepNum++,
            visual: `Merge [${intervals[i]}] with new`,
            transientMessage: `Merged: [${merged}]`,
            arrayState: intervals.flat(),
            pointers: [{ label: 'merge', index: i * 2 }],
            indices: [i * 2, i * 2 + 1],
            color: 'success'
        });
        i++;
    }
    result.push(merged);

    // Add remaining
    while (i < intervals.length) {
        result.push(intervals[i]);
        steps.push({
            step: stepNum++,
            visual: `Add remaining [${intervals[i]}]`,
            transientMessage: 'No overlap',
            arrayState: intervals.flat(),
            pointers: [{ label: 'i', index: i * 2 }],
            indices: [i * 2, i * 2 + 1],
            color: 'accent'
        });
        i++;
    }

    steps.push({
        step: stepNum++,
        visual: `Result: ${JSON.stringify(result)}`,
        transientMessage: 'Complete!',
        arrayState: result.flat(),
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['insert-interval'].animationSteps = steps;
    solutions['insert-interval'].initialState = intervals.flat();
    console.log(`Fixed insert-interval: ${steps.length} steps`);
    fixed++;
}

// Non-overlapping Intervals
if (solutions['non-overlapping-intervals']) {
    const intervals = [[1, 2], [2, 3], [3, 4], [1, 3]];
    const steps = [];
    let stepNum = 1;

    // Sort by end time
    const sorted = [...intervals].sort((a, b) => a[1] - b[1]);

    steps.push({
        step: stepNum++,
        visual: `Intervals: ${JSON.stringify(intervals)}`,
        transientMessage: 'Sort by end time',
        arrayState: sorted.flat(),
        pointers: [],
        indices: [],
        color: 'accent'
    });

    steps.push({
        step: stepNum++,
        visual: `Sorted: ${JSON.stringify(sorted)}`,
        transientMessage: 'Greedy: keep intervals that end earliest',
        arrayState: sorted.flat(),
        pointers: [],
        indices: [],
        color: 'accent'
    });

    let end = sorted[0][1];
    let removals = 0;

    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i][0] < end) {
            removals++;
            steps.push({
                step: stepNum++,
                visual: `[${sorted[i]}] overlaps (start ${sorted[i][0]} < end ${end})`,
                transientMessage: `Remove! Total: ${removals}`,
                arrayState: sorted.flat(),
                pointers: [{ label: 'X', index: i * 2 }],
                indices: [i * 2, i * 2 + 1],
                color: 'accent'
            });
        } else {
            end = sorted[i][1];
            steps.push({
                step: stepNum++,
                visual: `[${sorted[i]}] OK, update end = ${end}`,
                transientMessage: 'Keep this interval',
                arrayState: sorted.flat(),
                pointers: [{ label: '✓', index: i * 2 }],
                indices: [i * 2, i * 2 + 1],
                color: 'success'
            });
        }
    }

    steps.push({
        step: stepNum++,
        visual: `Remove ${removals} interval(s)`,
        transientMessage: 'Complete!',
        arrayState: sorted.flat(),
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['non-overlapping-intervals'].animationSteps = steps;
    solutions['non-overlapping-intervals'].initialState = sorted.flat();
    console.log(`Fixed non-overlapping-intervals: ${steps.length} steps`);
    fixed++;
}

// Gas Station
if (solutions['gas-station']) {
    const gas = [1, 2, 3, 4, 5];
    const cost = [3, 4, 5, 1, 2];
    const steps = [];
    let stepNum = 1;

    steps.push({
        step: stepNum++,
        visual: `gas: [${gas.join(', ')}]`,
        transientMessage: `cost: [${cost.join(', ')}]`,
        arrayState: [...gas],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    let totalTank = 0, currTank = 0, start = 0;

    for (let i = 0; i < gas.length; i++) {
        const net = gas[i] - cost[i];
        totalTank += net;
        currTank += net;

        steps.push({
            step: stepNum++,
            visual: `Station ${i}: gas=${gas[i]}, cost=${cost[i]}, net=${net}`,
            transientMessage: `currTank=${currTank}`,
            arrayState: [...gas],
            pointers: [{ label: 'i', index: i }, { label: 'start', index: start }],
            indices: [i],
            color: net >= 0 ? 'success' : 'accent'
        });

        if (currTank < 0) {
            start = i + 1;
            currTank = 0;
            steps.push({
                step: stepNum++,
                visual: `Tank empty! Reset start to ${start}`,
                transientMessage: 'Cannot start from earlier stations',
                arrayState: [...gas],
                pointers: [{ label: 'start', index: start }],
                indices: [],
                color: 'accent'
            });
        }
    }

    const result = totalTank >= 0 ? start : -1;
    steps.push({
        step: stepNum++,
        visual: `Start from station: ${result}`,
        transientMessage: totalTank >= 0 ? 'Solution exists!' : 'Impossible',
        arrayState: [...gas],
        pointers: result >= 0 ? [{ label: '✓', index: result }] : [],
        indices: result >= 0 ? [result] : [],
        color: 'success'
    });

    solutions['gas-station'].animationSteps = steps;
    solutions['gas-station'].initialState = gas;
    console.log(`Fixed gas-station: ${steps.length} steps`);
    fixed++;
}

// Min Cost Climbing Stairs
if (solutions['min-cost-climbing-stairs']) {
    const cost = [10, 15, 20];
    const steps = [];
    let stepNum = 1;
    const n = cost.length;

    steps.push({
        step: stepNum++,
        visual: `Cost: [${cost.join(', ')}]`,
        transientMessage: 'DP: min cost to reach each step',
        arrayState: [...cost],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    let prev2 = 0, prev1 = 0;

    for (let i = 2; i <= n; i++) {
        const curr = Math.min(prev1 + cost[i - 1], prev2 + cost[i - 2]);
        steps.push({
            step: stepNum++,
            visual: `Step ${i}: min(${prev1}+${cost[i - 1]}, ${prev2}+${cost[i - 2]})`,
            transientMessage: `Min cost = ${curr}`,
            arrayState: [...cost],
            pointers: [{ label: 'i', index: i - 1 }],
            indices: [i - 2, i - 1],
            color: 'success'
        });
        prev2 = prev1;
        prev1 = curr;
    }

    steps.push({
        step: stepNum++,
        visual: `Minimum cost: ${prev1}`,
        transientMessage: 'Complete!',
        arrayState: [...cost],
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['min-cost-climbing-stairs'].animationSteps = steps;
    solutions['min-cost-climbing-stairs'].initialState = cost;
    console.log(`Fixed min-cost-climbing-stairs: ${steps.length} steps`);
    fixed++;
}

// Longest Increasing Subsequence
if (solutions['longest-increasing-subsequence']) {
    const nums = [10, 9, 2, 5, 3, 7, 101, 18];
    const steps = [];
    let stepNum = 1;
    const dp = Array(nums.length).fill(1);

    steps.push({
        step: stepNum++,
        visual: `Array: [${nums.join(', ')}]`,
        transientMessage: 'dp[i] = LIS ending at i',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    for (let i = 1; i < nums.length; i++) {
        for (let j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {
                const newLen = dp[j] + 1;
                if (newLen > dp[i]) {
                    dp[i] = newLen;
                    steps.push({
                        step: stepNum++,
                        visual: `nums[${j}]=${nums[j]} < nums[${i}]=${nums[i]}`,
                        transientMessage: `dp[${i}] = ${dp[i]}`,
                        arrayState: [...dp],
                        pointers: [{ label: 'j', index: j }, { label: 'i', index: i }],
                        indices: [j, i],
                        color: 'success'
                    });
                }
            }
        }
        if (steps.length > 15) break;
    }

    const maxLen = Math.max(...dp);
    steps.push({
        step: stepNum++,
        visual: `LIS length: ${maxLen}`,
        transientMessage: `dp = [${dp.join(', ')}]`,
        arrayState: [...dp],
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['longest-increasing-subsequence'].animationSteps = steps;
    solutions['longest-increasing-subsequence'].initialState = nums;
    console.log(`Fixed longest-increasing-subsequence: ${steps.length} steps`);
    fixed++;
}

// Partition Equal Subset Sum
if (solutions['partition-equal-subset-sum']) {
    const nums = [1, 5, 11, 5];
    const steps = [];
    let stepNum = 1;
    const total = nums.reduce((a, b) => a + b, 0);

    steps.push({
        step: stepNum++,
        visual: `Array: [${nums.join(', ')}]`,
        transientMessage: `Total sum = ${total}`,
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    if (total % 2 !== 0) {
        steps.push({
            step: stepNum++,
            visual: `Sum is odd`,
            transientMessage: 'Cannot partition equally',
            arrayState: [...nums],
            pointers: [],
            indices: [],
            color: 'accent'
        });
    } else {
        const target = total / 2;
        steps.push({
            step: stepNum++,
            visual: `Target: ${target}`,
            transientMessage: 'Find subset summing to target',
            arrayState: [...nums],
            pointers: [],
            indices: [],
            color: 'accent'
        });

        const dp = Array(target + 1).fill(false);
        dp[0] = true;

        for (let i = 0; i < nums.length; i++) {
            for (let j = target; j >= nums[i]; j--) {
                if (dp[j - nums[i]]) {
                    dp[j] = true;
                    steps.push({
                        step: stepNum++,
                        visual: `dp[${j}] = true (using ${nums[i]})`,
                        transientMessage: `Can make sum ${j}`,
                        arrayState: [...nums],
                        pointers: [{ label: 'i', index: i }],
                        indices: [i],
                        color: j === target ? 'success' : 'accent'
                    });
                    if (j === target) break;
                }
            }
            if (dp[target]) break;
        }

        steps.push({
            step: stepNum++,
            visual: `Can partition: ${dp[target]}`,
            transientMessage: 'Complete!',
            arrayState: [...nums],
            pointers: [],
            indices: [],
            color: 'success'
        });
    }

    solutions['partition-equal-subset-sum'].animationSteps = steps;
    solutions['partition-equal-subset-sum'].initialState = nums;
    console.log(`Fixed partition-equal-subset-sum: ${steps.length} steps`);
    fixed++;
}

// Combination Sum
if (solutions['combination-sum']) {
    const candidates = [2, 3, 6, 7];
    const target = 7;
    const steps = [];
    let stepNum = 1;
    const results = [];

    steps.push({
        step: stepNum++,
        visual: `Candidates: [${candidates.join(', ')}], target: ${target}`,
        transientMessage: 'Backtracking search',
        arrayState: [...candidates],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    function backtrack(start, path, sum) {
        if (steps.length > 12) return;

        if (sum === target) {
            results.push([...path]);
            steps.push({
                step: stepNum++,
                visual: `Found: [${path.join(', ')}] = ${target}`,
                transientMessage: `${results.length} solution(s)`,
                arrayState: [...candidates],
                pointers: [],
                indices: [],
                color: 'success'
            });
            return;
        }

        if (sum > target) return;

        for (let i = start; i < candidates.length && steps.length <= 12; i++) {
            path.push(candidates[i]);
            steps.push({
                step: stepNum++,
                visual: `Try ${candidates[i]}: [${path.join(', ')}] = ${sum + candidates[i]}`,
                transientMessage: sum + candidates[i] <= target ? 'Continue' : 'Too big, backtrack',
                arrayState: [...candidates],
                pointers: [{ label: '+', index: i }],
                indices: [i],
                color: 'accent'
            });
            backtrack(i, path, sum + candidates[i]);
            path.pop();
        }
    }

    backtrack(0, [], 0);

    steps.push({
        step: stepNum++,
        visual: `Found ${results.length} combinations`,
        transientMessage: 'Complete!',
        arrayState: [...candidates],
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['combination-sum'].animationSteps = steps;
    solutions['combination-sum'].initialState = candidates;
    console.log(`Fixed combination-sum: ${steps.length} steps`);
    fixed++;
}

// Letter Combinations of a Phone Number
if (solutions['letter-combinations-of-a-phone-number']) {
    const digits = '23';
    const mapping = { '2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl', '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz' };
    const steps = [];
    let stepNum = 1;
    const results = [];

    steps.push({
        step: stepNum++,
        visual: `Digits: "${digits}"`,
        transientMessage: '2→abc, 3→def',
        arrayState: digits.split(''),
        pointers: [],
        indices: [],
        color: 'accent'
    });

    function backtrack(idx, path) {
        if (steps.length > 12) return;

        if (idx === digits.length) {
            results.push(path);
            steps.push({
                step: stepNum++,
                visual: `Found: "${path}"`,
                transientMessage: `${results.length} combination(s)`,
                arrayState: digits.split(''),
                pointers: [],
                indices: [],
                color: 'success'
            });
            return;
        }

        const letters = mapping[digits[idx]];
        for (const letter of letters) {
            if (steps.length > 12) break;
            steps.push({
                step: stepNum++,
                visual: `Digit ${digits[idx]} → '${letter}'`,
                transientMessage: `Path: "${path + letter}"`,
                arrayState: digits.split(''),
                pointers: [{ label: letter, index: idx }],
                indices: [idx],
                color: 'accent'
            });
            backtrack(idx + 1, path + letter);
        }
    }

    if (digits.length > 0) backtrack(0, '');

    steps.push({
        step: stepNum++,
        visual: `${results.length} combinations`,
        transientMessage: 'Complete!',
        arrayState: digits.split(''),
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['letter-combinations-of-a-phone-number'].animationSteps = steps;
    solutions['letter-combinations-of-a-phone-number'].initialState = digits.split('');
    console.log(`Fixed letter-combinations-of-a-phone-number: ${steps.length} steps`);
    fixed++;
}

// Generate Parentheses
if (solutions['generate-parentheses']) {
    const n = 2;
    const steps = [];
    let stepNum = 1;
    const results = [];

    steps.push({
        step: stepNum++,
        visual: `n = ${n}`,
        transientMessage: 'Generate valid parentheses combinations',
        arrayState: [],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    function backtrack(open, close, path) {
        if (steps.length > 12) return;

        if (path.length === 2 * n) {
            results.push(path);
            steps.push({
                step: stepNum++,
                visual: `Valid: "${path}"`,
                transientMessage: `${results.length} found`,
                arrayState: path.split(''),
                pointers: [],
                indices: Array.from({ length: path.length }, (_, i) => i),
                color: 'success'
            });
            return;
        }

        if (open < n) {
            steps.push({
                step: stepNum++,
                visual: `Add '(': "${path}("`,
                transientMessage: `open=${open + 1}, close=${close}`,
                arrayState: (path + '(').split(''),
                pointers: [],
                indices: [path.length],
                color: 'accent'
            });
            backtrack(open + 1, close, path + '(');
        }

        if (close < open && steps.length <= 12) {
            steps.push({
                step: stepNum++,
                visual: `Add ')': "${path})"`,
                transientMessage: `open=${open}, close=${close + 1}`,
                arrayState: (path + ')').split(''),
                pointers: [],
                indices: [path.length],
                color: 'accent'
            });
            backtrack(open, close + 1, path + ')');
        }
    }

    backtrack(0, 0, '');

    steps.push({
        step: stepNum++,
        visual: `${results.length} valid combinations`,
        transientMessage: 'Complete!',
        arrayState: [],
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['generate-parentheses'].animationSteps = steps;
    solutions['generate-parentheses'].initialState = [];
    console.log(`Fixed generate-parentheses: ${steps.length} steps`);
    fixed++;
}

// Longest Repeating Character Replacement
if (solutions['longest-repeating-character-replacement']) {
    const s = 'AABABBA';
    const k = 1;
    const chars = s.split('');
    const steps = [];
    let stepNum = 1;

    steps.push({
        step: stepNum++,
        visual: `s = "${s}", k = ${k}`,
        transientMessage: 'Sliding window with char count',
        arrayState: chars,
        pointers: [],
        indices: [],
        color: 'accent'
    });

    const count = {};
    let maxCount = 0, maxLen = 0, left = 0;

    for (let right = 0; right < s.length; right++) {
        count[s[right]] = (count[s[right]] || 0) + 1;
        maxCount = Math.max(maxCount, count[s[right]]);

        const windowSize = right - left + 1;
        const replacements = windowSize - maxCount;

        if (replacements <= k) {
            maxLen = Math.max(maxLen, windowSize);
            steps.push({
                step: stepNum++,
                visual: `Window [${left}-${right}]: "${s.substring(left, right + 1)}"`,
                transientMessage: `Need ${replacements} replacements, maxLen=${maxLen}`,
                arrayState: chars,
                pointers: [{ label: 'L', index: left }, { label: 'R', index: right }],
                indices: Array.from({ length: right - left + 1 }, (_, i) => left + i),
                color: 'success'
            });
        } else {
            count[s[left]]--;
            left++;
            steps.push({
                step: stepNum++,
                visual: `Shrink window: [${left}-${right}]`,
                transientMessage: `Too many replacements (${replacements} > ${k})`,
                arrayState: chars,
                pointers: [{ label: 'L', index: left }, { label: 'R', index: right }],
                indices: [left],
                color: 'accent'
            });
        }
    }

    steps.push({
        step: stepNum++,
        visual: `Max length: ${maxLen}`,
        transientMessage: 'Complete!',
        arrayState: chars,
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['longest-repeating-character-replacement'].animationSteps = steps;
    solutions['longest-repeating-character-replacement'].initialState = chars;
    console.log(`Fixed longest-repeating-character-replacement: ${steps.length} steps`);
    fixed++;
}

// Save
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`\nFixed ${fixed} problems total. Saved to solutions.json`);
