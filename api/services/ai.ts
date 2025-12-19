import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') }); // Try root .env

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SOLUTION_SYSTEM_PROMPT = `You are an expert LeetCode tutor helping ADHD students. 
Your goal is to explain the problem VISUALLY and succinctly....`; // Simplified for brevity in this generic service, usually strict JSON

const TUTOR_SYSTEM_PROMPT = `You are a Socratic LeetCode tutor helping students understand algorithms.
Your goal is to guide the student to the solution by asking searching questions, rather than just giving the answer.
Explain BIG O complexity clearly when asked.
Distinguish between Brute Force and Optimal solutions.

Tone: Encouraging, concise, and technical but accessible.

Response Format:
Just plain text (markdown supported). Use code blocks for examples.
`;

export const aiService = {
    async generateHint(problem: string, code: string) {
        try {
            const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a helpful coding assistant. Provide a short, cryptic but helpful hint for the user's current code state. Do not give the answer." },
                    { role: "user", content: `Problem: ${problem}\n\nCurrent Code:\n${code}` }
                ],
                model: "gpt-4-turbo-preview", // or gpt-3.5-turbo
                max_tokens: 150,
            });
            return { hint: completion.choices[0].message.content };
        } catch (error: any) {
            console.error("AI Error:", error);
            return { error: error.message };
        }
    },

    async explainSolution(code: string, title: string) {
        try {
            const completion = await openai.chat.completions.create({
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
    },

    async answerQuestion(problemTitle: string, problemDesc: string, chatHistory: any[], userMessage: string) {
        try {
            const messages: any[] = [
                { role: "system", content: TUTOR_SYSTEM_PROMPT },
                { role: "system", content: `Context: ${problemTitle}. ${problemDesc}` }
            ];

            // Add history
            chatHistory.forEach(msg => messages.push({
                role: msg.role,
                content: msg.content
            }));

            // Add user message
            messages.push({ role: "user", content: userMessage });

            const completion = await openai.chat.completions.create({
                messages: messages,
                model: "gpt-4-turbo-preview",
            });

            return { response: completion.choices[0].message.content };
        } catch (error: any) {
            console.error("AI Error:", error);
            return { error: error.message };
        }
    }
};
