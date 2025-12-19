// Problem and Solution Types

export interface TestCase {
    input: string;
    output: string;
}

export interface Example {
    input: string;
    output: string;
    explanation?: string;
}

export interface Problem {
    slug: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    description: string;
    topics: string[];
    companies?: string[];
    premium?: boolean;
}

export interface Solution {
    title: string;
    pattern: string;
    patternEmoji: string;
    timeComplexity: string;
    spaceComplexity: string;
    oneliner: string;
    intuition: string[];
    testCases: TestCase[];
    code: string;
    keyInsight: string;
    description: string;
    examples: Example[];
    constraints: string[];
    hints: string[];
    relatedProblems?: string[];
    videoId?: string;
    problemStatement?: string;
    difficulty?: string;
    visualizationType?: string;
    walkthrough?: string[];
    animationSteps?: AnimationStep[];
}

export interface AnimationStep {
    step: number;
    description: string;
    action?: string;
    highlight?: string;
    node?: string;
}

export interface ExecutionResult {
    success: boolean;
    passed?: boolean;
    results?: CaseResult[];
    logs?: string;
    error?: string;
}

export interface CaseResult {
    case: number;
    passed: boolean;
    input: string;
    expected?: string;
    actual?: string;
    error?: string;
}

export interface AIResponse {
    content: string;
    model: string;
}

// API Request/Response Types
export interface ExecuteRequest {
    code: string;
    testCases: TestCase[];
}

export interface TutorRequest {
    problem: string;
    question: string;
    code?: string;
}
