/**
 * Script to fix DP and array problem animations
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../api/data/solutions.json');
const data = require(dataPath);
const solutions = data.solutions;

let fixed = 0;

// Climbing Stairs - DP visualization
if (solutions['climbing-stairs']) {
    const n = 5;
    const steps = [];
    let stepNum = 1;
    const dp = [1, 1];

    steps.push({
        step: stepNum++,
        visual: `n = ${n}, ways to climb stairs`,
        transientMessage: 'dp[0] = 1, dp[1] = 1 (base cases)',
        arrayState: [...dp, 0, 0, 0, 0],
        pointers: [],
        indices: [0, 1],
        color: 'accent'
    });

    for (let i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
        steps.push({
            step: stepNum++,
            visual: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]}`,
            transientMessage: `dp[${i}] = ${dp[i]}`,
            arrayState: [...dp],
            pointers: [{ label: 'i', index: i }],
            indices: [i - 2, i - 1, i],
            color: 'success'
        });
    }

    steps.push({
        step: stepNum++,
        visual: `Result: ${dp[n]} ways`,
        transientMessage: 'Complete!',
        arrayState: [...dp],
        pointers: [{ label: '✓', index: n }],
        indices: [n],
        color: 'success'
    });

    solutions['climbing-stairs'].animationSteps = steps;
    solutions['climbing-stairs'].initialState = [1, 1, 0, 0, 0, 0];
    console.log(`Fixed climbing-stairs: ${steps.length} steps`);
    fixed++;
}

// House Robber - DP
if (solutions['house-robber']) {
    const nums = [2, 7, 9, 3, 1];
    const steps = [];
    let stepNum = 1;

    let prev2 = 0, prev1 = 0;

    steps.push({
        step: stepNum++,
        visual: `Houses: [${nums.join(', ')}]`,
        transientMessage: 'prev2 = 0, prev1 = 0',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    for (let i = 0; i < nums.length; i++) {
        const curr = Math.max(prev1, prev2 + nums[i]);
        steps.push({
            step: stepNum++,
            visual: `House ${i}: rob=${prev2 + nums[i]}, skip=${prev1}`,
            transientMessage: `Max = ${curr}`,
            arrayState: [...nums],
            pointers: [{ label: 'i', index: i }],
            indices: [i],
            color: curr > prev1 ? 'success' : 'accent'
        });
        prev2 = prev1;
        prev1 = curr;
    }

    steps.push({
        step: stepNum++,
        visual: `Max profit: ${prev1}`,
        transientMessage: 'Complete!',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['house-robber'].animationSteps = steps;
    solutions['house-robber'].initialState = nums;
    console.log(`Fixed house-robber: ${steps.length} steps`);
    fixed++;
}

// Coin Change - DP
if (solutions['coin-change']) {
    const coins = [1, 2, 5];
    const amount = 11;
    const steps = [];
    let stepNum = 1;
    const dp = Array(amount + 1).fill(Infinity);
    dp[0] = 0;

    steps.push({
        step: stepNum++,
        visual: `coins=[${coins.join(',')}], amount=${amount}`,
        transientMessage: 'dp[0]=0, rest=∞',
        arrayState: dp.slice(0, 12).map(v => v === Infinity ? '∞' : v),
        pointers: [],
        indices: [0],
        color: 'accent'
    });

    for (let i = 1; i <= amount; i++) {
        for (const coin of coins) {
            if (coin <= i && dp[i - coin] + 1 < dp[i]) {
                dp[i] = dp[i - coin] + 1;
                steps.push({
                    step: stepNum++,
                    visual: `dp[${i}] = dp[${i - coin}] + 1 = ${dp[i]} (using coin ${coin})`,
                    transientMessage: `Amount ${i} needs ${dp[i]} coins`,
                    arrayState: dp.slice(0, 12).map(v => v === Infinity ? '∞' : v),
                    pointers: [{ label: 'i', index: i }],
                    indices: [i - coin, i],
                    color: 'success'
                });
            }
        }
    }

    steps.push({
        step: stepNum++,
        visual: `Result: ${dp[amount]} coins`,
        transientMessage: 'Minimum coins found!',
        arrayState: dp.slice(0, 12).map(v => v === Infinity ? '∞' : v),
        pointers: [{ label: '✓', index: amount }],
        indices: [amount],
        color: 'success'
    });

    solutions['coin-change'].animationSteps = steps;
    solutions['coin-change'].initialState = dp.slice(0, 12).map(v => v === Infinity ? '∞' : v);
    console.log(`Fixed coin-change: ${steps.length} steps`);
    fixed++;
}

// Maximum Subarray (Kadane's)
if (solutions['maximum-subarray']) {
    const nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
    const steps = [];
    let stepNum = 1;
    let maxSum = nums[0];
    let currentSum = nums[0];

    steps.push({
        step: stepNum++,
        visual: `Array: [${nums.join(', ')}]`,
        transientMessage: `currentSum=${currentSum}, maxSum=${maxSum}`,
        arrayState: [...nums],
        pointers: [{ label: 'i', index: 0 }],
        indices: [0],
        color: 'accent'
    });

    for (let i = 1; i < nums.length; i++) {
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        const isNewMax = currentSum > maxSum;
        if (isNewMax) maxSum = currentSum;

        steps.push({
            step: stepNum++,
            visual: `nums[${i}]=${nums[i]}: extend or start new?`,
            transientMessage: `currentSum=${currentSum}, maxSum=${maxSum}`,
            arrayState: [...nums],
            pointers: [{ label: 'i', index: i }],
            indices: [i],
            color: isNewMax ? 'success' : 'accent'
        });
    }

    steps.push({
        step: stepNum++,
        visual: `Maximum subarray sum: ${maxSum}`,
        transientMessage: 'Complete!',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['maximum-subarray'].animationSteps = steps;
    solutions['maximum-subarray'].initialState = nums;
    console.log(`Fixed maximum-subarray: ${steps.length} steps`);
    fixed++;
}

// Product of Array Except Self
if (solutions['product-of-array-except-self']) {
    const nums = [1, 2, 3, 4];
    const n = nums.length;
    const result = Array(n).fill(1);
    const steps = [];
    let stepNum = 1;

    steps.push({
        step: stepNum++,
        visual: `Array: [${nums.join(', ')}]`,
        transientMessage: 'Calculate product except self for each position',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    // Left pass
    let leftProduct = 1;
    for (let i = 0; i < n; i++) {
        result[i] = leftProduct;
        steps.push({
            step: stepNum++,
            visual: `Left pass: result[${i}] = ${leftProduct}`,
            transientMessage: `Product of elements to the left`,
            arrayState: [...result],
            pointers: [{ label: 'L', index: i }],
            indices: [i],
            color: 'accent'
        });
        leftProduct *= nums[i];
    }

    // Right pass
    let rightProduct = 1;
    for (let i = n - 1; i >= 0; i--) {
        result[i] *= rightProduct;
        steps.push({
            step: stepNum++,
            visual: `Right pass: result[${i}] *= ${rightProduct} = ${result[i]}`,
            transientMessage: `Multiply by product of elements to the right`,
            arrayState: [...result],
            pointers: [{ label: 'R', index: i }],
            indices: [i],
            color: 'success'
        });
        rightProduct *= nums[i];
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

    solutions['product-of-array-except-self'].animationSteps = steps;
    solutions['product-of-array-except-self'].initialState = nums;
    console.log(`Fixed product-of-array-except-self: ${steps.length} steps`);
    fixed++;
}

// Contains Duplicate
if (solutions['contains-duplicate']) {
    const nums = [1, 2, 3, 1];
    const steps = [];
    let stepNum = 1;
    const seen = new Set();

    steps.push({
        step: stepNum++,
        visual: `Array: [${nums.join(', ')}]`,
        transientMessage: 'Check for duplicates using HashSet',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    for (let i = 0; i < nums.length; i++) {
        if (seen.has(nums[i])) {
            steps.push({
                step: stepNum++,
                visual: `nums[${i}]=${nums[i]} already in set!`,
                transientMessage: 'Duplicate found! Return true',
                arrayState: [...nums],
                pointers: [{ label: '!', index: i }],
                indices: [i],
                color: 'success'
            });
            break;
        }
        seen.add(nums[i]);
        steps.push({
            step: stepNum++,
            visual: `Add ${nums[i]} to set`,
            transientMessage: `Set: {${[...seen].join(', ')}}`,
            arrayState: [...nums],
            pointers: [{ label: 'i', index: i }],
            indices: [i],
            color: 'accent'
        });
    }

    solutions['contains-duplicate'].animationSteps = steps;
    solutions['contains-duplicate'].initialState = nums;
    console.log(`Fixed contains-duplicate: ${steps.length} steps`);
    fixed++;
}

// Best Time to Buy and Sell Stock
if (solutions['best-time-to-buy-and-sell-stock']) {
    const prices = [7, 1, 5, 3, 6, 4];
    const steps = [];
    let stepNum = 1;
    let minPrice = prices[0];
    let maxProfit = 0;

    steps.push({
        step: stepNum++,
        visual: `Prices: [${prices.join(', ')}]`,
        transientMessage: `minPrice=${minPrice}, maxProfit=${maxProfit}`,
        arrayState: [...prices],
        pointers: [{ label: 'buy', index: 0 }],
        indices: [0],
        color: 'accent'
    });

    for (let i = 1; i < prices.length; i++) {
        if (prices[i] < minPrice) {
            minPrice = prices[i];
            steps.push({
                step: stepNum++,
                visual: `Day ${i}: price ${prices[i]} < minPrice`,
                transientMessage: `New minPrice = ${minPrice}`,
                arrayState: [...prices],
                pointers: [{ label: 'buy', index: i }],
                indices: [i],
                color: 'accent'
            });
        } else {
            const profit = prices[i] - minPrice;
            const isNewMax = profit > maxProfit;
            if (isNewMax) maxProfit = profit;
            steps.push({
                step: stepNum++,
                visual: `Day ${i}: sell at ${prices[i]}, profit=${profit}`,
                transientMessage: isNewMax ? `New maxProfit = ${maxProfit}!` : `maxProfit still ${maxProfit}`,
                arrayState: [...prices],
                pointers: [{ label: 'sell', index: i }],
                indices: [i],
                color: isNewMax ? 'success' : 'accent'
            });
        }
    }

    steps.push({
        step: stepNum++,
        visual: `Max profit: ${maxProfit}`,
        transientMessage: 'Complete!',
        arrayState: [...prices],
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['best-time-to-buy-and-sell-stock'].animationSteps = steps;
    solutions['best-time-to-buy-and-sell-stock'].initialState = prices;
    console.log(`Fixed best-time-to-buy-and-sell-stock: ${steps.length} steps`);
    fixed++;
}

// Merge Intervals
if (solutions['merge-intervals']) {
    const intervals = [[1, 3], [2, 6], [8, 10], [15, 18]];
    const flat = intervals.flat();
    const steps = [];
    let stepNum = 1;
    const merged = [[...intervals[0]]];

    steps.push({
        step: stepNum++,
        visual: `Intervals: ${JSON.stringify(intervals)}`,
        transientMessage: 'Start with first interval',
        arrayState: flat,
        pointers: [],
        indices: [0, 1],
        color: 'accent'
    });

    for (let i = 1; i < intervals.length; i++) {
        const last = merged[merged.length - 1];
        const current = intervals[i];

        if (current[0] <= last[1]) {
            last[1] = Math.max(last[1], current[1]);
            steps.push({
                step: stepNum++,
                visual: `[${current}] overlaps with [${last}]`,
                transientMessage: `Merge to [${last}]`,
                arrayState: flat,
                pointers: [{ label: 'merge', index: i * 2 }],
                indices: [i * 2, i * 2 + 1],
                color: 'success'
            });
        } else {
            merged.push([...current]);
            steps.push({
                step: stepNum++,
                visual: `[${current}] doesn't overlap`,
                transientMessage: 'Add as new interval',
                arrayState: flat,
                pointers: [{ label: 'new', index: i * 2 }],
                indices: [i * 2, i * 2 + 1],
                color: 'accent'
            });
        }
    }

    steps.push({
        step: stepNum++,
        visual: `Result: ${JSON.stringify(merged)}`,
        transientMessage: 'Complete!',
        arrayState: flat,
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['merge-intervals'].animationSteps = steps;
    solutions['merge-intervals'].initialState = flat;
    console.log(`Fixed merge-intervals: ${steps.length} steps`);
    fixed++;
}

// Rotate Array
if (solutions['rotate-array']) {
    const nums = [1, 2, 3, 4, 5, 6, 7];
    const k = 3;
    const steps = [];
    let stepNum = 1;
    let arr = [...nums];

    steps.push({
        step: stepNum++,
        visual: `Array: [${arr.join(', ')}], k=${k}`,
        transientMessage: 'Rotate right by k steps using reversal',
        arrayState: [...arr],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    // Reverse all
    arr.reverse();
    steps.push({
        step: stepNum++,
        visual: `Reverse entire array`,
        transientMessage: `[${arr.join(', ')}]`,
        arrayState: [...arr],
        pointers: [],
        indices: Array.from({ length: arr.length }, (_, i) => i),
        color: 'accent'
    });

    // Reverse first k
    const first = arr.slice(0, k).reverse();
    arr = [...first, ...arr.slice(k)];
    steps.push({
        step: stepNum++,
        visual: `Reverse first ${k} elements`,
        transientMessage: `[${arr.join(', ')}]`,
        arrayState: [...arr],
        pointers: [],
        indices: Array.from({ length: k }, (_, i) => i),
        color: 'accent'
    });

    // Reverse rest
    const rest = arr.slice(k).reverse();
    arr = [...arr.slice(0, k), ...rest];
    steps.push({
        step: stepNum++,
        visual: `Reverse remaining elements`,
        transientMessage: `[${arr.join(', ')}]`,
        arrayState: [...arr],
        pointers: [],
        indices: Array.from({ length: arr.length - k }, (_, i) => i + k),
        color: 'success'
    });

    steps.push({
        step: stepNum++,
        visual: `Result: [${arr.join(', ')}]`,
        transientMessage: 'Rotation complete!',
        arrayState: [...arr],
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['rotate-array'].animationSteps = steps;
    solutions['rotate-array'].initialState = nums;
    console.log(`Fixed rotate-array: ${steps.length} steps`);
    fixed++;
}

// Valid Parentheses (stack)
if (solutions['valid-parentheses']) {
    const s = '({[]})';
    const chars = s.split('');
    const steps = [];
    let stepNum = 1;
    const stack = [];
    const pairs = { ')': '(', '}': '{', ']': '[' };

    steps.push({
        step: stepNum++,
        visual: `String: "${s}"`,
        transientMessage: 'Use stack to match brackets',
        arrayState: [...chars],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if ('({['.includes(c)) {
            stack.push(c);
            steps.push({
                step: stepNum++,
                visual: `Push '${c}' onto stack`,
                transientMessage: `Stack: [${stack.join(', ')}]`,
                arrayState: [...chars],
                pointers: [{ label: 'i', index: i }],
                indices: [i],
                color: 'accent'
            });
        } else {
            const top = stack.pop();
            const match = top === pairs[c];
            steps.push({
                step: stepNum++,
                visual: `Pop '${top}' for '${c}'`,
                transientMessage: match ? 'Match!' : 'No match!',
                arrayState: [...chars],
                pointers: [{ label: 'i', index: i }],
                indices: [i],
                color: match ? 'success' : 'accent'
            });
        }
    }

    steps.push({
        step: stepNum++,
        visual: `Stack empty: ${stack.length === 0}`,
        transientMessage: stack.length === 0 ? 'Valid!' : 'Invalid!',
        arrayState: [...chars],
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['valid-parentheses'].animationSteps = steps;
    solutions['valid-parentheses'].initialState = chars;
    console.log(`Fixed valid-parentheses: ${steps.length} steps`);
    fixed++;
}

// Save
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`\nFixed ${fixed} problems total. Saved to solutions.json`);
