import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

export const config = {
    port: parseInt(process.env.PORT || '8000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // AI Provider Configuration
    aiProvider: process.env.AI_PROVIDER || 'ollama',
    ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',

    // Data paths
    problemsPath: process.env.PROBLEMS_PATH || '../data/problems.json',
    solutionsPath: process.env.SOLUTIONS_PATH || '../data/solutions.json',
    statsPath: process.env.STATS_PATH || '../data/stats.json',
};
