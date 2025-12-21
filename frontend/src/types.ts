export interface Problem {
    id: number;
    title: string;
    slug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    url: string;
    has_solution?: boolean;
    subTopic?: string;
    pattern?: string;
}

export interface Stats {
    easy: number;
    medium: number;
    hard: number;
    categories: Array<{
        name: string;
        count: number;
        icon: string;
        problems: Problem[];
    }>;
}

export interface AnimationStep {
    type: 'highlight' | 'move' | 'swap';
    indices?: number[];
    color?: 'accent' | 'success' | 'default' | 'error';
    pointers?: Array<{ index: number; label: string }>;
    transientMessage?: string;
    arrayState?: (number | string)[]; // Current array state at this step
    visual?: string; // Legacy support
    explanation?: string; // Legacy support
    step?: number; // Legacy support
    title?: string; // Legacy support
}

export interface Approach {
    name: 'bruteforce' | 'optimal' | 'best';
    label: string;
    timeComplexity: string;
    spaceComplexity: string;
    intuition: string[];
    code: string;
}

export interface Solution {
    title: string;
    pattern: string;
    patternEmoji?: string;
    timeComplexity: string;
    spaceComplexity: string;
    oneliner: string;
    intuition: string[];
    keyInsight: string;
    mentalModel?: string;
    code: string;
    initialCode?: string;
    bruteForceCode?: string;
    bruteForceIntuition?: string[];
    bruteForceTimeComplexity?: string;
    bruteForceSpaceComplexity?: string;
    approaches?: Approach[];
    language?: string;

    // Smart Visualization
    visualizationType?: 'array' | 'string' | 'matrix' | 'tree' | 'linkedlist' | 'graph' | 'grid';
    initialState?: (number | string)[] | string;
    animationSteps?: AnimationStep[];

    // Data structure specific visualization data
    treeRoot?: unknown;
    listHead?: unknown;
    matrix?: (number | string)[][];
    graphNodes?: { id: number | string; label?: string }[];
    graphEdges?: { from: number | string; to: number | string; weight?: number }[];

    // Legacy support
    // Legacy support
    steps?: AnimationStep[];

    // Playground
    testCases?: { input: string; output: string }[];

    // Enhanced Problem Data
    problemStatement?: string;                          // Actual LeetCode problem description
    description?: string;                              // Alternative/fallback description
    examples?: { input: string; output: string; explanation?: string }[];
    constraints?: string[];                            // Array of constraints
    hints?: string[];                                  // Array of hints
    relatedProblems?: string[];                        // Array of related problem slugs

    // External Resources
    videoId?: string;         // YouTube Video ID
    neetcodeLink?: string;    // NeetCode.io link
    takeuforwardLink?: string;// TakeUForward link
    leetcodeLink?: string;    // LeetCode link
    suggestedNextQuestion?: {
        slug: string;
        title: string;
        difficulty: string;
        pattern: string;
    };
}

export interface TestCaseResult {
    passed: boolean;
    input: string;
    expected: string;
    actual: string;
    error?: string;
}

export interface RunResponse {
    success: boolean;
    results?: TestCaseResult[];
    error?: string;
}
