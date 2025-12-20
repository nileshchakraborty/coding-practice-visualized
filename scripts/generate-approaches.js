const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

// Brute Force templates by pattern
const BRUTE_FORCE_TEMPLATES = {
    "Two Pointers": {
        intuition: ["Try all pairs using nested loops.", "Compare each pair and check if condition is met."],
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
        codeTemplate: (fn) => `def ${fn}_brute(nums):\n    # Naive approach: check all pairs\n    n = len(nums)\n    for i in range(n):\n        for j in range(i + 1, n):\n            # Check condition for nums[i], nums[j]\n            pass\n    return None`
    },
    "Sliding Window": {
        intuition: ["Generate all possible substrings/subarrays.", "Check each one for the required condition."],
        timeComplexity: "O(n²) or O(n³)",
        spaceComplexity: "O(n)",
        codeTemplate: (fn) => `def ${fn}_brute(s):\n    # Try all substrings\n    n = len(s)\n    result = 0\n    for i in range(n):\n        for j in range(i, n):\n            # Check substring s[i:j+1]\n            pass\n    return result`
    },
    "Dynamic Programming": {
        intuition: ["Use recursion to explore all possibilities.", "Without memoization, this leads to exponential time."],
        timeComplexity: "O(2^n)",
        spaceComplexity: "O(n) recursion stack",
        codeTemplate: (fn) => `def ${fn}_brute(nums):\n    def helper(i, state):\n        if i == len(nums):\n            return 0  # base case\n        # Try including or excluding nums[i]\n        include = helper(i + 1, new_state)\n        exclude = helper(i + 1, state)\n        return max(include, exclude)\n    return helper(0, initial_state)`
    },
    "Binary Search": {
        intuition: ["Linear scan through all elements.", "Check each element one by one."],
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        codeTemplate: (fn) => `def ${fn}_brute(nums, target):\n    for i, num in enumerate(nums):\n        if num == target:\n            return i\n    return -1`
    },
    "Hash Map": {
        intuition: ["Use nested loops to find pairs/groups.", "Compare elements directly without using extra space."],
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
        codeTemplate: (fn) => `def ${fn}_brute(nums):\n    n = len(nums)\n    for i in range(n):\n        for j in range(i + 1, n):\n            if condition(nums[i], nums[j]):\n                return [i, j]\n    return []`
    },
    "Tree": {
        intuition: ["Traverse the entire tree for each query.", "No optimization, just direct exploration."],
        timeComplexity: "O(n) per operation",
        spaceComplexity: "O(h) recursion stack",
        codeTemplate: (fn) => `def ${fn}_brute(root):\n    if not root:\n        return None\n    # Visit every node\n    left = ${fn}_brute(root.left)\n    right = ${fn}_brute(root.right)\n    return combine(root.val, left, right)`
    },
    "Graph": {
        intuition: ["Explore all possible paths.", "Use DFS/BFS without optimization."],
        timeComplexity: "O(V * E) or O(V!)",
        spaceComplexity: "O(V)",
        codeTemplate: (fn) => `def ${fn}_brute(graph, start, end):\n    # DFS all paths\n    def dfs(node, visited):\n        if node == end:\n            return True\n        visited.add(node)\n        for neighbor in graph[node]:\n            if neighbor not in visited:\n                if dfs(neighbor, visited):\n                    return True\n        return False\n    return dfs(start, set())`
    },
    "Backtracking": {
        intuition: ["Generate all permutations/combinations.", "Filter valid ones at the end."],
        timeComplexity: "O(n!)",
        spaceComplexity: "O(n)",
        codeTemplate: (fn) => `def ${fn}_brute(nums):\n    result = []\n    def backtrack(path):\n        if len(path) == len(nums):\n            if is_valid(path):\n                result.append(path[:])\n            return\n        for num in nums:\n            if num not in path:\n                path.append(num)\n                backtrack(path)\n                path.pop()\n    backtrack([])\n    return result`
    },
    "Stack": {
        intuition: ["Use nested loops to simulate stack operations.", "For each element, look back through all previous elements."],
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
        codeTemplate: (fn) => `def ${fn}_brute(nums):\n    n = len(nums)\n    result = [-1] * n\n    for i in range(n):\n        for j in range(i - 1, -1, -1):\n            if condition(nums[j], nums[i]):\n                result[i] = nums[j]\n                break\n    return result`
    },
    "Heap": {
        intuition: ["Sort the entire array.", "Pick top K elements from sorted result."],
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n)",
        codeTemplate: (fn) => `def ${fn}_brute(nums, k):\n    # Sort and take first k\n    return sorted(nums)[:k]`
    },
    "Linked List": {
        intuition: ["Use extra array to store all values.", "Process in array, then rebuild list."],
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        codeTemplate: (fn) => `def ${fn}_brute(head):\n    # Convert to array\n    vals = []\n    curr = head\n    while curr:\n        vals.append(curr.val)\n        curr = curr.next\n    # Process array\n    # ... \n    # Rebuild list\n    dummy = ListNode()\n    curr = dummy\n    for v in vals:\n        curr.next = ListNode(v)\n        curr = curr.next\n    return dummy.next`
    }
};

// Default fallback
const DEFAULT_BRUTE = {
    intuition: ["Explore all possibilities without optimization.", "Use nested loops or recursion."],
    timeComplexity: "O(n²) or worse",
    spaceComplexity: "O(n)",
    codeTemplate: (fn) => `def ${fn}_brute(input):\n    # Naive approach\n    for i in range(len(input)):\n        for j in range(i + 1, len(input)):\n            # Check condition\n            pass\n    return result`
};

function extractFunctionName(code) {
    const match = code.match(/def\s+(\w+)\(/);
    return match ? match[1] : 'solve';
}

function main() {
    console.log("=== Generating Multi-Approach Solutions ===");
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));
    let updated = 0;

    Object.values(data.solutions).forEach(sol => {
        // Skip if already has approaches
        if (sol.approaches && sol.approaches.length > 0) return;

        const functionName = extractFunctionName(sol.code || '');
        const patternKey = Object.keys(BRUTE_FORCE_TEMPLATES).find(k =>
            sol.pattern && sol.pattern.toLowerCase().includes(k.toLowerCase())
        );

        const bruteTemplate = BRUTE_FORCE_TEMPLATES[patternKey] || DEFAULT_BRUTE;

        // Create approaches array
        sol.approaches = [
            {
                name: 'bruteforce',
                label: 'Brute Force',
                timeComplexity: bruteTemplate.timeComplexity,
                spaceComplexity: bruteTemplate.spaceComplexity,
                intuition: bruteTemplate.intuition,
                code: bruteTemplate.codeTemplate(functionName)
            },
            {
                name: 'optimal',
                label: 'Optimal',
                timeComplexity: sol.timeComplexity || 'O(?)',
                spaceComplexity: sol.spaceComplexity || 'O(?)',
                intuition: sol.intuition || [],
                code: sol.code || ''
            }
        ];

        updated++;
    });

    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(data, null, 2));
    console.log(`Generated approaches for ${updated} solutions.`);
}

main();
