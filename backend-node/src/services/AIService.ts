import OpenAI from 'openai';
import { config } from '../config';
import { AIResponse } from '../types';

class AIService {
    private client: OpenAI | null = null;

    private getClient(): OpenAI {
        if (!this.client) {
            if (config.aiProvider === 'openai') {
                this.client = new OpenAI({
                    apiKey: config.openaiApiKey,
                });
            } else {
                // Ollama uses OpenAI-compatible API
                this.client = new OpenAI({
                    baseURL: `${config.ollamaUrl}/v1`,
                    apiKey: 'ollama', // Ollama doesn't require API key
                });
            }
        }
        return this.client;
    }

    private getModel(): string {
        return config.aiProvider === 'openai'
            ? config.openaiModel
            : config.ollamaModel;
    }

    async generateHint(problemDescription: string, code: string): Promise<AIResponse> {
        const prompt = `You are a helpful coding tutor. The student is working on this problem:

${problemDescription}

Their current code:
\`\`\`python
${code}
\`\`\`

Provide a brief, encouraging hint without giving away the full solution. Focus on the next step they should consider.`;

        return this.chat(prompt);
    }

    async explainSolution(code: string, problemTitle: string): Promise<AIResponse> {
        const prompt = `Explain this solution for "${problemTitle}" step by step:

\`\`\`python
${code}
\`\`\`

Provide a clear, educational explanation of:
1. The approach/algorithm used
2. Time and space complexity
3. Key insights`;

        return this.chat(prompt);
    }

    async answerQuestion(problem: string, question: string, code?: string): Promise<AIResponse> {
        let prompt = `You are a helpful coding tutor helping a student with "${problem}".

Student's question: ${question}`;

        if (code) {
            prompt += `

Their current code:
\`\`\`python
${code}
\`\`\``;
        }

        prompt += `

Provide a helpful, educational response. Don't give away the full solution, but guide them toward understanding.`;

        return this.chat(prompt);
    }

    async generateVisualization(algorithm: string, input: string): Promise<AIResponse> {
        const prompt = `Generate step-by-step visualization data for the "${algorithm}" algorithm with input: ${input}

Return a JSON array of steps, where each step has:
- "step": number
- "description": what's happening
- "state": current state of data structures
- "highlight": elements to highlight

Keep it concise and educational.`;

        return this.chat(prompt);
    }

    private async chat(prompt: string): Promise<AIResponse> {
        try {
            const client = this.getClient();
            const model = this.getModel();

            const response = await client.chat.completions.create({
                model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert coding tutor helping students learn algorithms and data structures. Be concise, clear, and educational.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7,
            });

            return {
                content: response.choices[0]?.message?.content || 'No response generated',
                model
            };
        } catch (error) {
            console.error('AI Service error:', error);
            return {
                content: 'AI service temporarily unavailable. Please try again later.',
                model: this.getModel()
            };
        }
    }
}

export const aiService = new AIService();
