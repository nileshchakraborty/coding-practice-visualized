export interface Problem {
    id: number;
    title: string;
    slug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    url: string;
    has_solution?: boolean;
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
    visual?: string; // Legacy support
    explanation?: string; // Legacy support
    step?: number; // Legacy support
    title?: string; // Legacy support
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
    code: string;

    // Smart Visualization
    visualizationType?: 'array' | 'string' | 'matrix' | 'tree';
    initialState?: (number | string)[] | string;
    animationSteps?: AnimationStep[];

    // Legacy support
    steps?: AnimationStep[];
}

export interface TestCaseResult {
    passed: boolean;
    input: string;
    expected: string;
    actual: string;
}

export interface RunResponse {
    success: boolean;
    results?: TestCaseResult[];
    error?: string;
}
