/**
 * Inject Mental Models Script
 * Adds a 'mentalModel' field to solutions based on their pattern.
 * Provides a concrete "Analogy" for abstract concepts.
 */
const fs = require('fs');
const path = require('path');

const SOLUTIONS_PATH = path.join(__dirname, '../api/data/solutions.json');

const ANALOGIES = {
    "Sliding Window": "Imagine a caterpillar crawling along a branch. It extends its head (right pointer) to eat leaves (add elements), and pulls its tail (left pointer) to digest (remove elements).",
    "Two Pointers": "Like two people walking towards each other from opposite ends of a hallway to meet in the middle.",
    "BFS": "Like a ripple in a pond, spreading out layer by layer from the center.",
    "DFS": "Like solving a maze by walking as far as you can down one path, then backtracking when you hit a dead end.",
    "Backtracking": "Like try-and-error in a lock combination. You try a number, if it fails, you 'backtrack' and try the next one.",
    "Binary Search": "Like looking up a word in a dictionary. You open the middle, see if the word is before or after, and discard half the book instantly.",
    "Linked List": "Like a treasure hunt where each clue (node) holds the location of the next clue.",
    "Greedy": "Like a cashier making change. Always pick the biggest coin that fits, hoping it leads to the fewest coins total.",
    "Heap": "Like a VIP club line where the most important person (max/min) always skips to the front.",
    "Priority Queue": "Like a VIP club line where the most important person (max/min) always skips to the front.",
    "Hash": "Like a coat check. You give a unique token (key) and get your specific item (value) back instantly.",
    "Map": "Like a dictionary. You look up a word (key) to find its definition (value).",
    "Set": "Like a club guest list. It only checks if you are 'in' or 'out', duplicates aren't allowed.",
    "Interval": "Like scheduling meetings. You merge overlapping times to free up the calendar.",
    "Matrix": "Like a spreadsheet. You move in grid coordinates (row, col) rather than a straight line.",
    "Bit": "Like digital DNA. You are flipping the fundamental switches (0s and 1s) that make up the number.",
    "Math": "Like finding the underlying formula that governs the universe, rather than simulating every step.",
    "Geometry": "Like reasoning about shapes on a canvas. Requires spatial thinking.",
    "Design": "Like building a custom machine. You decide how the gears (data structures) fit together.",
    "Topological": "Like putting on clothes. Socks before shoes. Order matters based on dependencies.",
    "Union": "Like connecting cities with roads. You track which cities belong to the same network.",
    "Graph": "Like a social network. Nodes are people, edges are friendships.",
    "Recursion": "Like Russian dolls. Open one to find a smaller version inside, until you hit the center.",
    "Memoization": "Like a cheat sheet. Write down answers so you never solve the same sub-problem twice.",
    "Counting": "Like tallying votes. Frequency matters more than order.",
    "DP": "Like filling out a form where each answer depends on previous answers.",
    "Simulation": "Like following a recipe step-by-step. Do exactly what the problem says.",
    "BST": "Like a phone book. If the name is after 'M', you ignore the entire first half.",
    "Divide": "Like breaking a bundle of sticks. Hard to break together, easy to break one by one.",
    "Kadane": "Like finding the sunniest part of the day. If the clouds (negative) get too heavy, you restart your streak.",
    "Cycle": "Like a race track. If you keep running, you will eventually pass the start line again.",
    "Pointer": "Like using your fingers to track two different positions in a book at once.",
    "Traversal": "Like exploring a maze. You visit every corner systematically.",
    "Prefix": "Like a running total on a receipt. You can tell the cost of items 5-10 by subtracting total(4) from total(10).",
    "Sort": "Like arranging a hand of cards by rank and suit.",
    "Merge": "Like combining two sorted piles of papers into one sorted stack.",
    "Search": "Like looking for a needle in a haystack.",
    "Tree": "Like a family tree. Every node has a parent and children.",
    "Stack": "Like a stack of pancakes. Last one cooked is the first one eaten (LIFO).",
    "Queue": "Like a grocery line. First come, first served (FIFO).",
    "Trie": "Like autocomplete. Typing 'c-a-t' walks down the 'c' -> 'a' -> 't' path.",
    "List": "Like a scavenger hunt. Each clue points to the location of the next clue."
};

function main() {
    console.log("Injecting Mental Models...");
    const data = JSON.parse(fs.readFileSync(SOLUTIONS_PATH, 'utf8'));
    const solutions = data.solutions;

    let injected = 0;

    Object.values(solutions).forEach(sol => {
        // Find best analogy based on pattern match (Case Insensitive)
        let model = null;
        if (sol.pattern) {
            const p = sol.pattern.toLowerCase();
            for (const [key, analogy] of Object.entries(ANALOGIES)) {
                if (p.includes(key.toLowerCase())) {
                    model = analogy;
                    break;
                }
            }
        }

        // Special overrides
        if (sol.title === "Trapping Rain Water") {
            model = "Imagine filling a landscape with water. The water level is determined by the shortest enclosing wall.";
        } else if (sol.title === "Climbing Stairs") {
            model = "Like a Fibonacci sequence. Step N depends on N-1 and N-2.";
        } else if (sol.title.includes("Stock")) {
            model = "Buy low, sell high. You are looking for the biggest difference between a valley and a subsequent peak.";
        }

        // Generic Fallbacks
        if (!model) {
            if (sol.pattern && (sol.pattern.includes("Array") || sol.pattern.includes("String"))) {
                model = "Like organizing items on a shelf. Fast to read, slow to shift.";
            } else {
                model = "Like solving a puzzle. Break it down into pieces and assemble the logic.";
            }
        }

        if (model) {
            sol.mentalModel = model;
            injected++;
        }
    });

    fs.writeFileSync(SOLUTIONS_PATH, JSON.stringify(data, null, 2));
    console.log(`✅ Injected Mental Models into ${injected} solutions.`);
}

main();
