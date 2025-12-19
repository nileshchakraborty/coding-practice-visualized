import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { AIService } from '../../../domain/ports/AIService';

dotenv.config({ path: path.join(__dirname, '../../../../.env') });

export class OpenAIService implements AIService {
    private openai: OpenAI;

    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            console.warn("OpenAIService: No API Key found. AI features will fail.");
        }
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
        });
    }

    async generateHint(problem: string, code: string): Promise<any> {
        try {
            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a helpful coding assistant. Provide a short, cryptic but helpful hint for the user's current code state. Do not give the answer." },
                    { role: "user", content: `Problem: ${problem}\n\nCurrent Code:\n${code}` }
                ],
                model: "gpt-4-turbo-preview",
                max_tokens: 150,
            });
            return { hint: completion.choices[0].message.content };
        } catch (error: any) {
            console.error("AI Error:", error);
            return { error: error.message };
        }
    }

    async explainSolution(code: string, title: string): Promise<any> {
        try {
            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: "system", content: "Explain this solution code step-by-step. specific focus on time and space complexity." },
                    { role: "user", content: `Problem: ${title}\n\nCode:\n${code}` }
                ],
                model: "gpt-4-turbo-preview",
            });
            return { explanation: completion.choices[0].message.content };
        } catch (error: any) {
            console.error("AI Error:", error);
            return { error: error.message };
        }
    }

    async answerQuestion(problemTitle: string, problemDesc: string, chatHistory: any[], userMessage: string): Promise<any> {
        try {
            const messages: any[] = [
                { role: "system", content: "You are a Socratic LeetCode tutor..." }, // Should ideally import shared prompt
                { role: "system", content: `Context: ${problemTitle}. ${problemDesc}` }
            ];

            chatHistory.forEach(msg => messages.push({ role: msg.role, content: msg.content }));
            messages.push({ role: "user", content: userMessage });

            const completion = await this.openai.chat.completions.create({
                messages: messages,
                model: "gpt-4-turbo-preview",
            });
            return { response: completion.choices[0].message.content };
        } catch (error: any) {
            console.error("AI Error:", error);
            return { error: error.message };
        }
    }
}
