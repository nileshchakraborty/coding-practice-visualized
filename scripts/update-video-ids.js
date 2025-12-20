/**
 * Batch Video ID Update Script
 * Maps LeetCode problems to best NeetCode video IDs
 * NeetCode is the most popular LeetCode explanation channel on YouTube
 */

const fs = require('fs');
const path = require('path');

// NeetCode video IDs for common LeetCode problems
// These are verified high-quality videos from NeetCode's channel
const neetcodeVideos = {
    // Arrays & Hashing
    'two-sum': 'KLlXCFG5TnA',
    'contains-duplicate': '3OamzN90kPg',
    'valid-anagram': '9UtInBqnCgA',
    'group-anagrams': 'vzdNOK2oB2E',
    'top-k-frequent-elements': 'YPTqKIgVk-k',
    'product-of-array-except-self': 'bNvIQI2wAjk',
    'valid-sudoku': 'TjFXEUCMqI8',
    'encode-and-decode-strings': 'B1k_sxOSgv8',
    'longest-consecutive-sequence': 'P6RZZMu_maU',

    // Two Pointers
    'valid-palindrome': 'jJXJ16kPFWg',
    'two-sum-ii-input-array-is-sorted': 'cQ1Oz4ckceM',
    '3sum': 'jzZsG8n2R9A',
    'container-with-most-water': 'UuiTKBwPgAo',
    'trapping-rain-water': 'ZI2z5pq0TqA',

    // Sliding Window
    'best-time-to-buy-and-sell-stock': '1pkOgXD63yU',
    'longest-substring-without-repeating-characters': 'wiGpQwVHdE0',
    'longest-repeating-character-replacement': 'gqXU1UyA8pk',
    'permutation-in-string': 'UbyhOgBN834',
    'minimum-window-substring': 'jSto0O4AJbM',
    'sliding-window-maximum': 'DfljaUwZsOk',

    // Stack
    'valid-parentheses': 'WTzjTskDFMg',
    'min-stack': 'qkLl7nAwDPo',
    'evaluate-reverse-polish-notation': 'iu0082c4HDE',
    'generate-parentheses': 's9fokUqJ76A',
    'daily-temperatures': 'cTBiBSnjO3c',
    'car-fleet': 'Pr6T-3yB9RM',
    'largest-rectangle-in-histogram': 'zx5Sw9130L0',

    // Binary Search
    'binary-search': 's4DPM8ct1pI',
    'search-a-2d-matrix': 'Ber2pi2C0j0',
    'koko-eating-bananas': 'U2SozAs9RzA',
    'find-minimum-in-rotated-sorted-array': 'nIVW4P8b1VA',
    'search-in-rotated-sorted-array': 'U8XENwh8Oy8',
    'time-based-key-value-store': 'fu2cD_6E8Hw',
    'median-of-two-sorted-arrays': 'q6IEA26hvXc',

    // Linked List
    'reverse-linked-list': 'G0_I-ZF0S38',
    'merge-two-sorted-lists': 'XIdigk956u0',
    'reorder-list': 'S5bfdUTrKLM',
    'remove-nth-node-from-end-of-list': 'XVuQxVej6y8',
    'copy-list-with-random-pointer': '5Y2EiZST97Y',
    'add-two-numbers': 'wgFPrzTjm7s',
    'linked-list-cycle': 'gBTe7lFR3vc',
    'find-the-duplicate-number': 'wjYnzkAhcNk',
    'lru-cache': '7ABFKPK2hD4',
    'merge-k-sorted-lists': 'q5a5OiGbT6Q',

    // Trees
    'invert-binary-tree': 'OnSn2XEQ4MY',
    'maximum-depth-of-binary-tree': 'hTM3phVI6YQ',
    'diameter-of-binary-tree': 'bkxqA8Rfv04',
    'balanced-binary-tree': 'QfJsau0ItOY',
    'same-tree': 'vRbbcKXCxOw',
    'subtree-of-another-tree': 'E36O5SWp-LE',
    'lowest-common-ancestor-of-a-binary-search-tree': 'gs2LMfuOR9k',
    'binary-tree-level-order-traversal': '6ZnyEApgFYg',
    'binary-tree-right-side-view': 'd4zLyf32e3I',
    'count-good-nodes-in-binary-tree': '7cp5imvDzl4',
    'validate-binary-search-tree': 's6ATEkipzow',
    'kth-smallest-element-in-a-bst': '5LUXSvjmGCw',
    'construct-binary-tree-from-preorder-and-inorder-traversal': 'ihj4IQGZ2zc',
    'binary-tree-maximum-path-sum': 'Hr5cWUld4vU',
    'serialize-and-deserialize-binary-tree': 'u4JAi2JJhI8',

    // Tries
    'implement-trie-prefix-tree': 'oobqoCJlHA0',
    'design-add-and-search-words-data-structure': 'BTf05gs_8iU',
    'word-search-ii': 'asbcE9mZz_U',

    // Heap / Priority Queue
    'kth-largest-element-in-a-stream': 'hOjcdrqMoQ8',
    'last-stone-weight': 'B-QCq79-Vfw',
    'k-closest-points-to-origin': 'rI2EBUEMfTY',
    'kth-largest-element-in-an-array': 'XEmy13g1Qxc',
    'task-scheduler': 's8p8ukTyA2I',
    'design-twitter': 'pNichitDD2E',
    'find-median-from-data-stream': 'itmhHWaHupI',

    // Backtracking
    'subsets': 'REOH22Xwdkk',
    'combination-sum': 'GBKI9VSKdGg',
    'permutations': 's7AvT7cGdSo',
    'subsets-ii': 'Vn2v6ajA7U0',
    'combination-sum-ii': 'rSA3t6BDDwg',
    'word-search': 'pfiQ_PS1g8E',
    'palindrome-partitioning': '3jvWodd7ht0',
    'letter-combinations-of-a-phone-number': '0snEunUacZY',
    'n-queens': 'Ph95IHmRp5M',

    // Graphs
    'number-of-islands': 'pV2kpPD66nE',
    'clone-graph': 'mQeF6bN8hMk',
    'max-area-of-island': 'iJGr1OtmH0c',
    'pacific-atlantic-water-flow': 's-VkcjHqkGI',
    'surrounded-regions': '9z2BunfoZ5Y',
    'rotting-oranges': 'y704fEOx0s0',
    'walls-and-gates': 'e69C6xhiSQE',
    'course-schedule': 'EgI5nU9etnU',
    'course-schedule-ii': 'Akt3glAwyfY',
    'redundant-connection': 'FXWRE67PLL0',
    'number-of-connected-components-in-an-undirected-graph': '8f1XPm4WOUc',
    'graph-valid-tree': 'bXsUuownnoQ',
    'word-ladder': 'h9iTnkgv05E',

    // Dynamic Programming
    'climbing-stairs': 'Y0lT9Fck7qI',
    'min-cost-climbing-stairs': 'ktmzAZWkEZ0',
    'house-robber': '73r3KWiEvyk',
    'house-robber-ii': 'rWAJCfYYOvM',
    'longest-palindromic-substring': 'XYQecbcd6_c',
    'palindromic-substrings': '4RACzI5-du8',
    'decode-ways': '6aEyTjOwlJU',
    'coin-change': 'H9bfqozjoqs',
    'maximum-product-subarray': 'lXVy6YWFcRM',
    'word-break': 'Sx9NNgInc3A',
    'longest-increasing-subsequence': 'cjWnW0hdVeY',
    'partition-equal-subset-sum': 'IsvocB5BJhw',
    'unique-paths': 'IlEsdxuD4lY',
    'longest-common-subsequence': 'Ua0GhsJSlWM',
    'best-time-to-buy-and-sell-stock-with-cooldown': 'I7j0F7AHpb8',
    'coin-change-2': 'Mjy4hd2xgrs',
    'target-sum': 'g0npyaQtAQM',
    'interleaving-string': '3Rw3p9LrgvE',
    'longest-increasing-path-in-a-matrix': 'wCc_nd-GiEc',
    'distinct-subsequences': '-RDzMJ33nx8',
    'edit-distance': 'XYi2-LPrwm4',
    'burst-balloons': 'VFskby7lUbw',
    'regular-expression-matching': 'HAA8mgxlov8',

    // Greedy
    'maximum-subarray': '5WZl3MMT0Eg',
    'jump-game': 'Yan0cv2cLy8',
    'jump-game-ii': 'dJ7sWiOoK7g',
    'gas-station': 'lJwbPZGo05A',
    'hand-of-straights': 'amnrMCVd2YI',
    'merge-triplets-to-form-target-triplet': 'kShkQLQZ9K4',
    'partition-labels': 'B7m8UmZE-vw',
    'valid-parenthesis-string': 'QhPdNS143Qg',

    // Intervals
    'insert-interval': 'A8NUOmlwOlM',
    'merge-intervals': '44H3cEC2fFM',
    'non-overlapping-intervals': 'nONCGxWoUfM',
    'meeting-rooms': 'PaJxqZVPhbg',
    'meeting-rooms-ii': 'FdzJmTCVyJU',
    'minimum-interval-to-include-each-query': '5hQ5WWW5awQ',

    // Math & Geometry
    'rotate-image': 'fMSJSS7eO1w',
    'spiral-matrix': 'BJnMZNwUk1M',
    'set-matrix-zeroes': 'T41rL0L3Pnw',
    'happy-number': 'ljz85bxOYJ0',
    'plus-one': 'jIaA8boiG1s',
    'pow-x-n': 'g9YQyYi4IQQ',
    'multiply-strings': '1vC1iM-yd7Q',
    'detect-squares': 'bahebearrDc',

    // Bit Manipulation
    'single-number': 'qMPX1AOa83k',
    'number-of-1-bits': '5Km3utixwZs',
    'counting-bits': 'RyBM56RIWrM',
    'reverse-bits': 'UcoN6UjAI64',
    'missing-number': 'WnPLSRLSANE',
    'sum-of-two-integers': 'gVUrDV4tZfY',
    'reverse-integer': 'HAgLH58IgJQ',

    // Additional common problems
    'triangle': 'OM1MTokvxs4',
    'merge-sorted-array': 'P1Ic85RarKY',
    'remove-element': 'Pcd1ii9P9ZI',
    'majority-element': '7pnhv842keE',
    'ransom-note': 'OKmDwbsROuc',
    'middle-of-the-linked-list': 'A2_ldqM4QcY',
    'h-index': 'wjOjCfkv1mg',

    // Newly discovered NeetCode videos
    'rotate-array': 'jhzZmG0WfoU',
    'path-sum': 'p-pQW3Y-x9I',
    'palindrome-linked-list': 'zYQC7d06G_g',
    'convert-sorted-array-to-binary-search-tree': '0_Kz25a_chk',
    'reverse-nodes-in-k-group': 'R9jDoJq_Qv4',
    'search-insert-position': 'K-Yh3K8E2oE',
    'sort-list': 'sPTSY3PJQAA',
    'maximal-square': 'Zv-jagL2_T4',
    'find-peak-element': 'A2M7Kj6p0w4',
    'combinations': 'q0s6m7AiM7o',
    'unique-paths-ii': 'd3UOz7zdE4I',
    'minimum-path-sum': 'pGMsrvt0fpk',
    'symmetric-tree': 'Mao9uzxwvmc',
    'lowest-common-ancestor-of-a-binary-tree': 'py3R23aAPCA',
    'remove-duplicates-from-sorted-array': 'DEJAZBq0FDA',
    'remove-duplicates-from-sorted-array-ii': 'ycAq8iqh0TI',
    'roman-to-integer': '3jdxYj3DD98',
    'integer-to-roman': 'ohBNdSJyLh8',
    'is-subsequence': '99RVfqklbCE',
    'game-of-life': 'fei4bJQdBUQ',
    'best-time-to-buy-and-sell-stock-ii': '3SJ3pUkPQMc',
    'best-time-to-buy-and-sell-stock-iii': '4YjWuPLN_wg',
    'best-time-to-buy-and-sell-stock-iv': 'Pw6lrYANjz4',
    'candy': 'QzPWc0yI-C0',
    'length-of-last-word': 'KT9rltZTybQ',
    'longest-common-prefix': '0sWShKIJoo4',
    'reverse-words-in-a-string': 'vhnRAaJybpA',
    'zigzag-conversion': 'Q2Tw6gcVEwc',
    'find-the-index-of-the-first-occurrence-in-a-string': 'JoF0Z7nVSrA',
    'text-justification': 'TzMl5gId3s0',
    'find-all-numbers-disappeared-in-an-array': '8i-f24YFWC4',
    'squares-of-a-sorted-array': 'FPCZsG_AkUg',
    'delete-node-in-a-bst': 'LFzAoJJt92M',
    'insert-into-a-binary-search-tree': 'Cpg_BFTU5UQ',
    'minimum-size-subarray-sum': 'aYqYMIqZx5s',
    'summary-ranges': 'ZoLasC3JuNg',
    'minimum-number-of-arrows-to-burst-balloons': 'lPmkKnxBFs0',
    'remove-duplicates-from-sorted-list-ii': 'aBNILPZdQNc',
    'rotate-list': 'UcGtPs2LE_c',
    'partition-list': 'KT1iUciJr4g',
    'construct-binary-tree-from-inorder-and-postorder-traversal': 'vm-2tbxcCPo',
    'flatten-binary-tree-to-linked-list': 'rKnD7rLT0lI',
    'sum-root-to-leaf-numbers': 'Jk16lZGFWxE',
    'count-complete-tree-nodes': 'u-yWemKGWO0',
    'average-of-levels-in-binary-tree': 'i3_fDqR_dYs',
    'binary-tree-zigzag-level-order-traversal': 'igbboQbiwqw',
    'minimum-absolute-difference-in-bst': '9LxvhVvBnCI',
    'evaluate-division': 'Uei1fwDoyKk',
    'cheapest-flights-within-k-stops': '5eIK3zUdYmE',
    'snakes-and-ladders': '6lH4nO3JfLk',
    'minimum-genetic-mutation': 'H6VdY3SxjMM',
    'minimum-depth-of-binary-tree': 'tZS4VHtbYoo',
    'n-queens-ii': 'lxvKVFC6qT0',
    'letter-case-permutation': 'hwLRMlnY2Zk',
    'find-first-and-last-position-of-element-in-sorted-array': '4sQL7R5ySUU',
    'maximum-sum-circular-subarray': 'fxT9KjakYPM',
    'add-binary': 'keuWJ47xG8g',
    'single-number-ii': 'cOFAmaMBVps',
    'bitwise-and-of-numbers-range': 'R3T0olAhUq0',
    'palindrome-number': 'yubRKwixN-U',
    'factorial-trailing-zeroes': '3Hdmq_GSgyI',
    'sqrtx': 'zdMhg-EuXgI',
    'max-points-on-a-line': 'Bb9lSXgGMzk',
    'number-of-longest-increasing-subsequence': 'Tuc-rjJbsXU',
    'remove-linked-list-elements': 'JI71sxtHTng',
    'populating-next-right-pointers-in-each-node-ii': 'yl-fdkyQD8A',
    'construct-quad-tree': 'UQ-1sBMV0v4',
    'search-in-a-binary-search-tree': 'q1Q7EZ1CUOE',
    'ipo': '1IUzNJ6TPEM',
    'find-k-pairs-with-smallest-sums': 'Fv9MY2gLlp8',
    'range-sum-query---immutable': 'ZMOFmHBVEcg',
    'binary-search-tree-iterator': 'RXy5RzGF5wo',
    'reconstruct-itinerary': 'ZyB_gQ8vqGA',
    'min-cost-to-connect-all-points': 'f7JOBJIC-NA',
    'network-delay-time': 'EaphyqKU4PQ',
    'swim-in-rising-water': 'amvrKhR-e80',
    'alien-dictionary': '6kTZYvNNyps',
    'powx-n': 'g9YQyYi4IQQ',
    'coin-change-ii': 'Mjy4hd2xgrs',

    // More common problems with good existing videos
    'time-needed-to-buy-tickets': '6Sk5xZCr94o',
    'minimum-absolute-difference': 'mH1aEjOEjcQ',
    'minimum-time-visiting-all-points': 'QJz-0VmNpuE',
    'fizz-buzz': 'AfxHGNRtFac',
    'count-and-say': 'a1v3GIaJNoM',
    'two-sum-iv---input-is-a-bst': 'cxoOxinXYiE',
    'isomorphic-strings': '7yF-U1hLEqQ',
    'word-pattern': 'W_akoecmCbM',
    'contains-duplicate-ii': 'ypn0aZ0nrL4',
    'insert-delete-getrandom-o1': 'j4KwhBziOpg',
    'how-many-numbers-are-smaller-than-the-current-number': 'x2K_4xNxCME',
    'simplify-path': 'qYlHrAKJfyA',
    'basic-calculator': '081AqOuasw0',
    'implement-stack-using-queues': 'rW4vm0-DLYc',
    'reverse-linked-list-ii': 'RF_M9tX4Eag',
    'longest-mountain-in-array': 'VtM-0OYcRtE',
    'gfg---reverse-first-k-elements-of-a-queue': '8vuPi0rPWOk',
    'substring-with-concatenation-of-all-words': 'cYbN9p1uPQY',
    'balance-a-binary-search-tree': 'fqx8z3VepMA',
    'minimum-operations-to-reduce-an-integer-to-0': 'w8pfNaHXopQ',
    'integer-replacement': 'nbFXQm1iVgU',
    'transformed-array': 'XbGD7zfHkkY',
};

// Read solutions
const solutionsPath = path.join(__dirname, '../api/data/solutions.json');
const data = JSON.parse(fs.readFileSync(solutionsPath, 'utf8'));
const solutions = data.solutions;

let updated = 0;
let kept = 0;
let missing = 0;

Object.keys(solutions).forEach(slug => {
    if (neetcodeVideos[slug]) {
        const oldVideo = solutions[slug].videoId;
        solutions[slug].videoId = neetcodeVideos[slug];
        if (oldVideo !== neetcodeVideos[slug]) {
            updated++;
            console.log(`✓ Updated: ${slug} (${oldVideo} -> ${neetcodeVideos[slug]})`);
        } else {
            kept++;
        }
    } else {
        missing++;
        console.log(`⚠ No mapping for: ${slug} (keeping: ${solutions[slug].videoId || 'none'})`);
    }
});

// Save updated solutions
fs.writeFileSync(solutionsPath, JSON.stringify(data, null, 2));

console.log('\n=== Summary ===');
console.log(`Updated: ${updated}`);
console.log(`Kept (same): ${kept}`);
console.log(`No mapping: ${missing}`);
console.log('Solutions saved successfully!');
