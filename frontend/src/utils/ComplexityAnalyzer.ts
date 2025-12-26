
/**
 * ComplexityAnalyzer
 * 
 * analyzing code to estimate Time and Space complexity using static analysis heuristics.
 */

export interface ComplexityResult {
    time: string;
    space: string;
    explanation: string[];
}

export class ComplexityAnalyzer {

    // eslint-disable-next-line complexity, sonarjs/cognitive-complexity
    static analyze(code: string): ComplexityResult {
        // Simple heuristics based on common patterns
        // This is an estimation and not a full AST analysis

        let timeComplexity = 'O(1)';
        let spaceComplexity = 'O(1)';
        const explanation: string[] = [];

        const lines = code.split('\n');
        let maxDepth = 0;
        let currentDepth = 0;

        let hasLoop = false;
        let hasNestedLoop = false;
        let hasTripleLoop = false;
        let hasLogPattern = false; // i *= 2, i /= 2
        let hasSorting = false;

        // Language specific keywords
        const loops = ['for ', 'while ', 'foreach'];


        // Analyze indentation for nesting (Python specific mainly, typically 4 spaces)
        // For C-like languages, we'd count braces, but indentation often correlates in well-formatted code

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;

            // Check for sorting
            if (trimmed.includes('.sort') || trimmed.includes('sorted(')) {
                hasSorting = true;
                explanation.push("Sorting detected (typically O(n log n))");
            }

            // Indentation level (assuming 4 spaces)
            const indent = line.search(/\S/);
            if (indent > -1) {
                currentDepth = Math.floor(indent / 4);
                if (currentDepth > maxDepth) maxDepth = currentDepth;
            }

            // Check for loops
            if (loops.some(kw => trimmed.startsWith(kw))) {
                hasLoop = true;
                if (currentDepth >= 1) hasNestedLoop = true;
                if (currentDepth >= 2) hasTripleLoop = true;
            }

            // Check for logarithmic patterns
            if (trimmed.includes('*=') || trimmed.includes('/=') || trimmed.includes('>>') || trimmed.includes('<<')) {
                hasLogPattern = true;
            }

            // Simple recursion check (function calling itself)
            // This is hard to do robustly with regex, assuming common names or self.calls
            // skipping for now to avoid false positives, relying on depth
        }

        // Determine Time Complexity
        if (hasSorting && !hasNestedLoop) {
            timeComplexity = 'O(n log n)';
        } else if (hasTripleLoop) {
            timeComplexity = 'O(n^3)';
            explanation.push("Deeply nested loops detected");
        } else if (hasNestedLoop) {
            timeComplexity = 'O(n^2)';
            explanation.push("Nested loops detected");
        } else if (hasLoop) {
            if (hasLogPattern) {
                timeComplexity = 'O(log n)';
                explanation.push("Loop with multiplicative/divisive step");
            } else {
                timeComplexity = 'O(n)';
                explanation.push("Single loop detected");
            }
        } else {
            timeComplexity = 'O(1)';
            explanation.push("No significant loops or sorting detected");
        }

        // Space Analysis (Very basic)
        if (code.includes('new Array') || code.includes('[]') || code.includes('{}') || code.includes('map[') || code.includes('make(')) {
            // Heuristic: Allocating collections often implies O(n)
            if (hasNestedLoop) {
                spaceComplexity = 'O(n)'; // Usually not n^2 unless matrix
            } else {
                spaceComplexity = 'O(n)';
            }
            explanation.push("Collection initialization detected (O(n) space)");
        } else {
            explanation.push("Constant space usage estimated");
        }

        return {
            time: timeComplexity,
            space: spaceComplexity,
            explanation
        };
    }
}
