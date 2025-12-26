export interface Problem {
    slug: string;
    title: string;
    description: string;
    difficulty: string;
    category: string;
    videoId?: string;
}

export interface Solution {
    slug: string;
    code: string;
    testCases: any[];
    hints?: string[];
    generated?: boolean;
    language?: string;
}
