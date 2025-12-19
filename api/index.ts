import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import fs from 'fs';

// Robust Env Loading
const envPaths = [
    path.join(__dirname, '.env'),
    path.join(__dirname, '..', '.env'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '..', '.env')
];

let envLoaded = false;
for (const p of envPaths) {
    if (fs.existsSync(p)) {
        console.log("Loading .env from:", p);
        dotenv.config({ path: p });
        envLoaded = true;
        break;
    }
}
if (!envLoaded) console.warn("WARNING: No .env file found!");
console.log("OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);



// Domain
import { ToolRegistry } from '../src/domain/mcp/ToolRegistry';

// Adapters
import { FileProblemRepository } from '../src/adapters/driven/fs/FileProblemRepository';
import { LocalExecutionService } from '../src/adapters/driven/execution/LocalExecutionService';
import { OpenAIService } from '../src/adapters/driven/openai/OpenAIService';
import { MCPTools } from '../src/adapters/driven/mcp/Tools';

// Application
import { ProblemService } from '../src/application/ProblemService';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- COMPOSITION ROOT ---
console.log("Initializing Hexagonal Architecture...");

// 1. Create Driven Adapters
const problemRepo = new FileProblemRepository();
const executionService = new LocalExecutionService();
const aiService = new OpenAIService();
const toolRegistry = new ToolRegistry();

// 2. Wire up MCP Tools
new MCPTools(toolRegistry, executionService, problemRepo);

// 3. Create Application Service (Dependency Injection)
const problemService = new ProblemService(
    problemRepo,
    aiService,
    executionService,
    toolRegistry
);

// --- HTTP ADAPTER (Driving) ---

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', architecture: 'hexagonal', check: 'vercel-native' });
});

app.get('/api/problems', async (req, res) => {
    try {
        const problems = await problemService.getAllProblems();
        res.json(problems);
    } catch (e: any) {
        console.error("Error fetching problems:", e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/solutions/:slug', async (req, res) => {
    try {
        const solution = await problemService.getSolution(req.params.slug);
        if (solution) res.json(solution);
        else res.status(404).json({ error: 'Solution not found' });
    } catch (e: any) {
        console.error("Error fetching solution:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/execute', async (req, res) => {
    try {
        const { code, testCases } = req.body;
        const result = await problemService.executeCode(code, testCases);
        res.json(result);
    } catch (e: any) {
        console.error("Execution Error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/ai/hint', async (req, res) => {
    try {
        const { problem, code } = req.body;
        const result = await problemService.getAIHint(problem, code || '');
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/ai/explain', async (req, res) => {
    try {
        const { code, title } = req.body;
        const result = await problemService.getAIExplanation(code || '', title || 'Unknown');
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/ai/tutor', async (req, res) => {
    try {
        const { slug, message, history, code } = req.body;
        const result = await problemService.chatWithTutor(slug, history || [], message, code);
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Start for local dev
const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Hexagonal Node API running on port ${PORT}`);
    });
}

export default app;
