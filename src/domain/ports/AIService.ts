export interface AIService {
    generateHint(problem: string, code: string): Promise<any>;
    explainSolution(code: string, title: string): Promise<any>;
    answerQuestion(problemTitle: string, problemDesc: string, chatHistory: any[], userMessage: string): Promise<any>;
}
