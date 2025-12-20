/**
 * Script to fix more problem animations - batch 6
 * Focus on remaining high-priority problems
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../api/data/solutions.json');
const data = require(dataPath);
const solutions = data.solutions;

let fixed = 0;

// Encode and Decode Strings
if (solutions['encode-and-decode-strings']) {
    const strs = ['hello', 'world'];
    const steps = [];
    let stepNum = 1;

    steps.push({
        step: stepNum++,
        visual: `Input: [${strs.map(s => `"${s}"`).join(', ')}]`,
        transientMessage: 'Encode using length prefix',
        arrayState: strs,
        pointers: [],
        indices: [],
        color: 'accent'
    });

    let encoded = '';
    for (let i = 0; i < strs.length; i++) {
        encoded += strs[i].length + '#' + strs[i];
        steps.push({
            step: stepNum++,
            visual: `Encode "${strs[i]}": ${strs[i].length}#${strs[i]}`,
            transientMessage: `Result: "${encoded}"`,
            arrayState: strs,
            pointers: [{ label: 'i', index: i }],
            indices: [i],
            color: 'success'
        });
    }

    steps.push({
        step: stepNum++,
        visual: `Encoded: "${encoded}"`,
        transientMessage: 'Now decode...',
        arrayState: strs,
        pointers: [],
        indices: [],
        color: 'accent'
    });

    // Decode
    const decoded = [];
    let j = 0;
    while (j < encoded.length) {
        let hash = encoded.indexOf('#', j);
        let len = parseInt(encoded.substring(j, hash));
        let str = encoded.substring(hash + 1, hash + 1 + len);
        decoded.push(str);
        steps.push({
            step: stepNum++,
            visual: `Decode: len=${len}, str="${str}"`,
            transientMessage: `Decoded: [${decoded.map(s => `"${s}"`).join(', ')}]`,
            arrayState: decoded,
            pointers: [],
            indices: [decoded.length - 1],
            color: 'success'
        });
        j = hash + 1 + len;
    }

    solutions['encode-and-decode-strings'].animationSteps = steps;
    solutions['encode-and-decode-strings'].initialState = strs;
    console.log(`Fixed encode-and-decode-strings: ${steps.length} steps`);
    fixed++;
}

// Roman to Integer
if (solutions['roman-to-integer']) {
    const s = 'MCMXCIV';
    const chars = s.split('');
    const steps = [];
    let stepNum = 1;
    const values = { 'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000 };

    steps.push({
        step: stepNum++,
        visual: `Roman: "${s}"`,
        transientMessage: 'Convert to integer',
        arrayState: chars,
        pointers: [],
        indices: [],
        color: 'accent'
    });

    let result = 0;
    for (let i = 0; i < s.length; i++) {
        const curr = values[s[i]];
        const next = i + 1 < s.length ? values[s[i + 1]] : 0;

        if (curr < next) {
            result -= curr;
            steps.push({
                step: stepNum++,
                visual: `${s[i]}=${curr} < ${s[i + 1]}=${next}`,
                transientMessage: `Subtract: result = ${result}`,
                arrayState: chars,
                pointers: [{ label: '-', index: i }],
                indices: [i],
                color: 'accent'
            });
        } else {
            result += curr;
            steps.push({
                step: stepNum++,
                visual: `${s[i]}=${curr}`,
                transientMessage: `Add: result = ${result}`,
                arrayState: chars,
                pointers: [{ label: '+', index: i }],
                indices: [i],
                color: 'success'
            });
        }
    }

    steps.push({
        step: stepNum++,
        visual: `Result: ${result}`,
        transientMessage: 'Complete!',
        arrayState: chars,
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['roman-to-integer'].animationSteps = steps;
    solutions['roman-to-integer'].initialState = chars;
    console.log(`Fixed roman-to-integer: ${steps.length} steps`);
    fixed++;
}

// Is Subsequence
if (solutions['is-subsequence']) {
    const s = 'abc';
    const t = 'ahbgdc';
    const tChars = t.split('');
    const steps = [];
    let stepNum = 1;

    steps.push({
        step: stepNum++,
        visual: `s="${s}", t="${t}"`,
        transientMessage: 'Two pointer approach',
        arrayState: tChars,
        pointers: [],
        indices: [],
        color: 'accent'
    });

    let si = 0, ti = 0;
    while (si < s.length && ti < t.length) {
        if (s[si] === t[ti]) {
            steps.push({
                step: stepNum++,
                visual: `s[${si}]='${s[si]}' == t[${ti}]='${t[ti]}'`,
                transientMessage: 'Match! Move both pointers',
                arrayState: tChars,
                pointers: [{ label: 's', index: si }, { label: 't', index: ti }],
                indices: [ti],
                color: 'success'
            });
            si++;
            ti++;
        } else {
            steps.push({
                step: stepNum++,
                visual: `s[${si}]='${s[si]}' != t[${ti}]='${t[ti]}'`,
                transientMessage: 'No match, move t pointer',
                arrayState: tChars,
                pointers: [{ label: 't', index: ti }],
                indices: [ti],
                color: 'accent'
            });
            ti++;
        }
    }

    const isSubseq = si === s.length;
    steps.push({
        step: stepNum++,
        visual: `Result: ${isSubseq}`,
        transientMessage: isSubseq ? 'All chars found!' : 'Not all chars found',
        arrayState: tChars,
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['is-subsequence'].animationSteps = steps;
    solutions['is-subsequence'].initialState = tChars;
    console.log(`Fixed is-subsequence: ${steps.length} steps`);
    fixed++;
}

// Isomorphic Strings
if (solutions['isomorphic-strings']) {
    const s = 'egg';
    const t = 'add';
    const chars = s.split('');
    const steps = [];
    let stepNum = 1;
    const sToT = {}, tToS = {};

    steps.push({
        step: stepNum++,
        visual: `s="${s}", t="${t}"`,
        transientMessage: 'Check bijective mapping',
        arrayState: chars,
        pointers: [],
        indices: [],
        color: 'accent'
    });

    let isIso = true;
    for (let i = 0; i < s.length && isIso; i++) {
        const sc = s[i], tc = t[i];

        if (sToT[sc] && sToT[sc] !== tc) {
            isIso = false;
            steps.push({
                step: stepNum++,
                visual: `'${sc}' already maps to '${sToT[sc]}', not '${tc}'`,
                transientMessage: 'Conflict! Not isomorphic',
                arrayState: chars,
                pointers: [{ label: 'X', index: i }],
                indices: [i],
                color: 'accent'
            });
        } else if (tToS[tc] && tToS[tc] !== sc) {
            isIso = false;
            steps.push({
                step: stepNum++,
                visual: `'${tc}' already mapped from '${tToS[tc]}', not '${sc}'`,
                transientMessage: 'Conflict! Not isomorphic',
                arrayState: chars,
                pointers: [{ label: 'X', index: i }],
                indices: [i],
                color: 'accent'
            });
        } else {
            sToT[sc] = tc;
            tToS[tc] = sc;
            steps.push({
                step: stepNum++,
                visual: `'${sc}' ↔ '${tc}'`,
                transientMessage: `Mapping: ${JSON.stringify(sToT)}`,
                arrayState: chars,
                pointers: [{ label: '✓', index: i }],
                indices: [i],
                color: 'success'
            });
        }
    }

    steps.push({
        step: stepNum++,
        visual: `Result: ${isIso}`,
        transientMessage: 'Complete!',
        arrayState: chars,
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['isomorphic-strings'].animationSteps = steps;
    solutions['isomorphic-strings'].initialState = chars;
    console.log(`Fixed isomorphic-strings: ${steps.length} steps`);
    fixed++;
}

// Palindrome Number
if (solutions['palindrome-number']) {
    const x = 121;
    const digits = x.toString().split('');
    const steps = [];
    let stepNum = 1;

    steps.push({
        step: stepNum++,
        visual: `x = ${x}`,
        transientMessage: 'Reverse and compare',
        arrayState: digits,
        pointers: [],
        indices: [],
        color: 'accent'
    });

    if (x < 0) {
        steps.push({
            step: stepNum++,
            visual: 'Negative numbers are not palindromes',
            transientMessage: 'Return false',
            arrayState: digits,
            pointers: [],
            indices: [],
            color: 'accent'
        });
    } else {
        let reversed = 0, original = x;
        let temp = x;

        while (temp > 0) {
            const digit = temp % 10;
            reversed = reversed * 10 + digit;
            steps.push({
                step: stepNum++,
                visual: `Digit: ${digit}, reversed: ${reversed}`,
                transientMessage: `temp: ${Math.floor(temp / 10)}`,
                arrayState: digits,
                pointers: [],
                indices: [],
                color: 'accent'
            });
            temp = Math.floor(temp / 10);
        }

        const isPalin = original === reversed;
        steps.push({
            step: stepNum++,
            visual: `${original} == ${reversed}? ${isPalin}`,
            transientMessage: isPalin ? 'Palindrome!' : 'Not palindrome',
            arrayState: digits,
            pointers: [],
            indices: [],
            color: 'success'
        });
    }

    solutions['palindrome-number'].animationSteps = steps;
    solutions['palindrome-number'].initialState = digits;
    console.log(`Fixed palindrome-number: ${steps.length} steps`);
    fixed++;
}

// Remove Element
if (solutions['remove-element']) {
    const nums = [3, 2, 2, 3];
    const val = 3;
    const steps = [];
    let stepNum = 1;
    let k = 0;

    steps.push({
        step: stepNum++,
        visual: `Array: [${nums.join(', ')}], val=${val}`,
        transientMessage: 'Remove all occurrences of val',
        arrayState: [...nums],
        pointers: [{ label: 'k', index: 0 }],
        indices: [],
        color: 'accent'
    });

    for (let i = 0; i < nums.length; i++) {
        if (nums[i] !== val) {
            nums[k] = nums[i];
            steps.push({
                step: stepNum++,
                visual: `nums[${i}]=${nums[i]} != ${val}`,
                transientMessage: `Keep at position ${k}`,
                arrayState: [...nums],
                pointers: [{ label: 'k', index: k }, { label: 'i', index: i }],
                indices: [k],
                color: 'success'
            });
            k++;
        } else {
            steps.push({
                step: stepNum++,
                visual: `nums[${i}]=${nums[i]} == ${val}`,
                transientMessage: 'Skip',
                arrayState: [...nums],
                pointers: [{ label: 'i', index: i }],
                indices: [i],
                color: 'accent'
            });
        }
    }

    steps.push({
        step: stepNum++,
        visual: `${k} elements remaining`,
        transientMessage: 'Complete!',
        arrayState: nums.slice(0, k),
        pointers: [],
        indices: Array.from({ length: k }, (_, i) => i),
        color: 'success'
    });

    solutions['remove-element'].animationSteps = steps;
    solutions['remove-element'].initialState = [3, 2, 2, 3];
    console.log(`Fixed remove-element: ${steps.length} steps`);
    fixed++;
}

// Car Fleet
if (solutions['car-fleet']) {
    const target = 12;
    const position = [10, 8, 0, 5, 3];
    const speed = [2, 4, 1, 1, 3];
    const steps = [];
    let stepNum = 1;

    steps.push({
        step: stepNum++,
        visual: `Target: ${target}`,
        transientMessage: `Positions: [${position.join(', ')}]`,
        arrayState: [...position],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    // Pair and sort by position descending
    const cars = position.map((p, i) => ({ pos: p, spd: speed[i], time: (target - p) / speed[i] }));
    cars.sort((a, b) => b.pos - a.pos);

    steps.push({
        step: stepNum++,
        visual: `Cars sorted by position`,
        transientMessage: cars.map(c => `pos=${c.pos}, time=${c.time.toFixed(1)}`).join(' | '),
        arrayState: cars.map(c => c.pos),
        pointers: [],
        indices: [],
        color: 'accent'
    });

    let fleets = 0;
    let prevTime = 0;

    for (let i = 0; i < cars.length; i++) {
        if (cars[i].time > prevTime) {
            fleets++;
            prevTime = cars[i].time;
            steps.push({
                step: stepNum++,
                visual: `Car at ${cars[i].pos}: time=${cars[i].time.toFixed(1)} > ${prevTime.toFixed(1)}`,
                transientMessage: `New fleet! Total: ${fleets}`,
                arrayState: cars.map(c => c.pos),
                pointers: [{ label: 'fleet', index: i }],
                indices: [i],
                color: 'success'
            });
        } else {
            steps.push({
                step: stepNum++,
                visual: `Car at ${cars[i].pos}: joins previous fleet`,
                transientMessage: `time=${cars[i].time.toFixed(1)} <= ${prevTime.toFixed(1)}`,
                arrayState: cars.map(c => c.pos),
                pointers: [{ label: 'join', index: i }],
                indices: [i],
                color: 'accent'
            });
        }
    }

    steps.push({
        step: stepNum++,
        visual: `Total fleets: ${fleets}`,
        transientMessage: 'Complete!',
        arrayState: cars.map(c => c.pos),
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['car-fleet'].animationSteps = steps;
    solutions['car-fleet'].initialState = position;
    console.log(`Fixed car-fleet: ${steps.length} steps`);
    fixed++;
}

// Maximum Product Subarray
if (solutions['maximum-product-subarray']) {
    const nums = [2, 3, -2, 4];
    const steps = [];
    let stepNum = 1;

    steps.push({
        step: stepNum++,
        visual: `Array: [${nums.join(', ')}]`,
        transientMessage: 'Track max and min (for negatives)',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    let maxProd = nums[0], minProd = nums[0], result = nums[0];

    for (let i = 1; i < nums.length; i++) {
        const candidates = [nums[i], maxProd * nums[i], minProd * nums[i]];
        const tempMax = Math.max(...candidates);
        const tempMin = Math.min(...candidates);

        steps.push({
            step: stepNum++,
            visual: `nums[${i}]=${nums[i]}: candidates [${candidates.join(', ')}]`,
            transientMessage: `max=${tempMax}, min=${tempMin}`,
            arrayState: [...nums],
            pointers: [{ label: 'i', index: i }],
            indices: [i],
            color: tempMax > result ? 'success' : 'accent'
        });

        maxProd = tempMax;
        minProd = tempMin;
        if (maxProd > result) result = maxProd;
    }

    steps.push({
        step: stepNum++,
        visual: `Maximum product: ${result}`,
        transientMessage: 'Complete!',
        arrayState: [...nums],
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['maximum-product-subarray'].animationSteps = steps;
    solutions['maximum-product-subarray'].initialState = nums;
    console.log(`Fixed maximum-product-subarray: ${steps.length} steps`);
    fixed++;
}

// Find Peak Element
if (solutions['find-peak-element']) {
    const nums = [1, 2, 3, 1];
    const steps = [];
    let stepNum = 1;
    let left = 0, right = nums.length - 1;

    steps.push({
        step: stepNum++,
        visual: `Array: [${nums.join(', ')}]`,
        transientMessage: 'Binary search for peak',
        arrayState: [...nums],
        pointers: [{ label: 'L', index: left }, { label: 'R', index: right }],
        indices: [],
        color: 'accent'
    });

    while (left < right) {
        const mid = Math.floor((left + right) / 2);

        steps.push({
            step: stepNum++,
            visual: `mid=${mid}, nums[mid]=${nums[mid]}, nums[mid+1]=${nums[mid + 1]}`,
            transientMessage: nums[mid] > nums[mid + 1] ? 'Peak on left' : 'Peak on right',
            arrayState: [...nums],
            pointers: [{ label: 'L', index: left }, { label: 'M', index: mid }, { label: 'R', index: right }],
            indices: [mid, mid + 1],
            color: 'accent'
        });

        if (nums[mid] > nums[mid + 1]) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }

    steps.push({
        step: stepNum++,
        visual: `Peak at index ${left}: ${nums[left]}`,
        transientMessage: 'Complete!',
        arrayState: [...nums],
        pointers: [{ label: 'peak', index: left }],
        indices: [left],
        color: 'success'
    });

    solutions['find-peak-element'].animationSteps = steps;
    solutions['find-peak-element'].initialState = nums;
    console.log(`Fixed find-peak-element: ${steps.length} steps`);
    fixed++;
}

// H-Index
if (solutions['h-index']) {
    const citations = [3, 0, 6, 1, 5];
    const steps = [];
    let stepNum = 1;

    steps.push({
        step: stepNum++,
        visual: `Citations: [${citations.join(', ')}]`,
        transientMessage: 'Sort and find h-index',
        arrayState: [...citations],
        pointers: [],
        indices: [],
        color: 'accent'
    });

    const sorted = [...citations].sort((a, b) => b - a);
    steps.push({
        step: stepNum++,
        visual: `Sorted: [${sorted.join(', ')}]`,
        transientMessage: 'Find largest h where h papers have >= h citations',
        arrayState: sorted,
        pointers: [],
        indices: [],
        color: 'accent'
    });

    let h = 0;
    for (let i = 0; i < sorted.length; i++) {
        if (sorted[i] >= i + 1) {
            h = i + 1;
            steps.push({
                step: stepNum++,
                visual: `Paper ${i + 1} has ${sorted[i]} citations >= ${i + 1}`,
                transientMessage: `h = ${h}`,
                arrayState: sorted,
                pointers: [{ label: 'h', index: i }],
                indices: [i],
                color: 'success'
            });
        } else {
            steps.push({
                step: stepNum++,
                visual: `Paper ${i + 1} has ${sorted[i]} citations < ${i + 1}`,
                transientMessage: 'Stop here',
                arrayState: sorted,
                pointers: [{ label: 'stop', index: i }],
                indices: [i],
                color: 'accent'
            });
            break;
        }
    }

    steps.push({
        step: stepNum++,
        visual: `H-Index: ${h}`,
        transientMessage: 'Complete!',
        arrayState: sorted,
        pointers: [],
        indices: [],
        color: 'success'
    });

    solutions['h-index'].animationSteps = steps;
    solutions['h-index'].initialState = citations;
    console.log(`Fixed h-index: ${steps.length} steps`);
    fixed++;
}

// Save
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`\nFixed ${fixed} problems total. Saved to solutions.json`);
