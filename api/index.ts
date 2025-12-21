import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// ============================================
// VERCEL DEBUG: Startup Logging
// Set DEBUG_LOGS=false to disable verbose logging
// ============================================
const DEBUG_LOGS = process.env.DEBUG_LOGS !== 'false'; // Default: true

const log = (...args: any[]) => {
    if (DEBUG_LOGS) console.log(...args);
};

log('============================================');
log('[STARTUP] API Server Initializing...');
log('[STARTUP] Node Version:', process.version);
log('[STARTUP] CWD:', process.cwd());
log('[STARTUP] __dirname:', __dirname);
log('[STARTUP] NODE_ENV:', process.env.NODE_ENV);
log('============================================');

// Check critical paths
const criticalPaths = [
    { name: 'api/data', path: path.join(process.cwd(), 'api', 'data') },
    { name: 'api/_lib', path: path.join(process.cwd(), 'api', '_lib') },
    { name: 'src', path: path.join(process.cwd(), 'src') },
    { name: '/var/task/api/data', path: '/var/task/api/data' },
];
log('[STARTUP] Checking critical paths:');
criticalPaths.forEach(({ name, path: p }) => {
    log(`  ${name}: ${fs.existsSync(p) ? '✅ EXISTS' : '❌ MISSING'}`);
});

// List contents of CWD
try {
    log('[STARTUP] CWD Contents:', fs.readdirSync(process.cwd()).join(', '));
} catch (e) {
    log('[STARTUP] Failed to read CWD:', e);
}

// --- MIDDLEWARE & SERVICES ---
log('[STARTUP] Loading middleware...');
import { generalLimiter, aiLimiter } from '../src/infrastructure/middleware/RateLimiter';
import { cacheService } from '../src/infrastructure/cache/CacheService';
import { jobQueue, type JobType, type Job } from '../src/infrastructure/queue/JobQueue';
import { progressStore, type UserProgress } from '../src/infrastructure/store/ProgressStore';
log('[STARTUP] Middleware loaded ✅');

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
        log("[STARTUP] Loading .env from:", p);
        dotenv.config({ path: p });
        envLoaded = true;
        break;
    }
}
if (!envLoaded) log("[STARTUP] WARNING: No .env file found!");
log("[STARTUP] OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);

// Domain
log('[STARTUP] Loading domain...');
import { ToolRegistry } from '../src/domain/mcp/ToolRegistry';
log('[STARTUP] Domain loaded ✅');

// Adapters
log('[STARTUP] Loading adapters...');
import { FileProblemRepository } from '../src/adapters/driven/fs/FileProblemRepository';
import { LocalExecutionService } from '../src/adapters/driven/execution/LocalExecutionService';
import { OllamaService } from '../src/adapters/driven/ollama/OllamaService';
import { OpenAIService } from '../src/adapters/driven/openai/OpenAIService';
import { MCPTools } from '../src/adapters/driven/mcp/Tools';
log('[STARTUP] Adapters loaded ✅');

// Application
log('[STARTUP] Loading application services...');
import { ProblemService } from '../src/application/ProblemService';
log('[STARTUP] Application services loaded ✅');

// Google Auth
import { OAuth2Client } from 'google-auth-library';

const app = express();

app.set('trust proxy', 1); // Trust first proxy (needed for rate limiting behind load balancers/Vercel)
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- RATE LIMITING ---
// Apply general rate limiter to all API routes
app.use('/api/', generalLimiter);

// Additional strict limiter for AI endpoints
app.use('/api/ai/', aiLimiter);

// --- AUTH MIDDLEWARE ---
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Optional auth middleware - adds user info if token is valid, but doesn't block
const optionalAuth = async (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            // For Google OAuth access tokens, verify by fetching userinfo
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (userInfoResponse.ok) {
                const userInfo = await userInfoResponse.json();
                (req as any).user = userInfo;
            }
        } catch (error) {
            // Token invalid, continue without user
            console.log('Auth token verification failed:', error);
        }
    }
    next();
};

// Required auth middleware - blocks request if not authenticated
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    }

    const token = authHeader.substring(7);
    try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!userInfoResponse.ok) {
            return res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
        }
        const userInfo = await userInfoResponse.json();
        (req as any).user = userInfo;
        next();
    } catch (error) {
        console.error('Auth verification error:', error);
        return res.status(401).json({ error: 'Authentication failed', code: 'AUTH_FAILED' });
    }
};

// --- COMPOSITION ROOT ---
console.log("Initializing Hexagonal Architecture...");

// 1. Create Driven Adapters
const problemRepo = new FileProblemRepository();
const executionService = new LocalExecutionService();

// Dynamic AI Service Selection
const aiProvider = process.env.AI_PROVIDER || (process.env.OPENAI_API_KEY ? 'openai' : 'ollama');
console.log(`Selecting AI Provider: ${aiProvider}`);

let aiService;
if (aiProvider === 'openai') {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("WARNING: AI_PROVIDER is 'openai' but OPENAI_API_KEY is missing!");
    }
    aiService = new OpenAIService();
} else {
    aiService = new OllamaService();
}

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
        const cacheKey = 'all_problems';
        const cachedProblems = cacheService.get(cacheKey);

        if (cachedProblems) {
            console.log("Cache Hit: Problems");
            res.json(cachedProblems);
            return;
        }

        const problems = await problemService.getAllProblems();
        cacheService.set(cacheKey, problems, 3600); // Cache for 1 hour (static content)
        res.json(problems);
    } catch (e: any) {
        console.error("Error fetching problems:", e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/solutions/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const cacheKey = `solution_${slug}`;
        const cachedSolution = cacheService.get(cacheKey);

        if (cachedSolution) {
            console.log(`Cache Hit: Solution ${slug}`);
            // res.json(cachedSolution);
            // return; // Force fresh load for now
        }

        const solution = await problemService.getSolution(slug);
        if (solution) {
            cacheService.set(cacheKey, solution, 3600); // Cache for 1 hour
            res.json(solution);
        } else {
            res.status(404).json({ error: 'Solution not found' });
        }
    } catch (e: any) {
        console.error("Error fetching solution:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/execute', requireAuth, async (req, res) => {
    try {
        const { code, testCases, language } = req.body;
        const result = await problemService.executeCode(code, testCases, language);
        res.json(result);
    } catch (e: any) {
        console.error("Execution Error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/ai/hint', requireAuth, async (req, res) => {
    try {
        const { problem, code } = req.body;
        const result = await problemService.getAIHint(problem, code || '');
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/ai/explain', requireAuth, async (req, res) => {
    try {
        const { code, title } = req.body;
        const result = await problemService.getAIExplanation(code || '', title || 'Unknown');
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/ai/tutor', requireAuth, async (req, res) => {
    try {
        const { slug, message, history, code } = req.body;
        const result = await problemService.chatWithTutor(slug, history || [], message, code);
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/generate', requireAuth, async (req, res) => {
    try {
        const { slug } = req.body;
        const result = await problemService.generateSolution(slug);
        res.json(result);
    } catch (e: any) {
        console.error("Generation Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// --- JOB QUEUE ENDPOINTS ---

// Register job processors
jobQueue.registerProcessor('execute', async (job: Job) => {
    const { code, testCases } = job.payload as { code: string; testCases?: any[] };
    return await problemService.executeCode(code, testCases || []);
});

jobQueue.registerProcessor('ai_tutor', async (job: Job) => {
    const { slug, message, history, code } = job.payload as {
        slug: string;
        message: string;
        history?: any[];
        code?: string
    };
    return await problemService.chatWithTutor(slug, history || [], message, code);
});

jobQueue.registerProcessor('ai_hint', async (job: Job) => {
    const { problem, code } = job.payload as { problem: string; code?: string };
    return await problemService.getAIHint(problem, code || '');
});

jobQueue.registerProcessor('ai_explain', async (job: Job) => {
    const { code, title } = job.payload as { code?: string; title?: string };
    return await problemService.getAIExplanation(code || '', title || 'Unknown');
});

jobQueue.registerProcessor('generate', async (job: Job) => {
    const { slug } = job.payload as { slug: string };
    return await problemService.generateSolution(slug);
});

// Submit a new job
app.post('/api/jobs/submit', requireAuth, async (req, res) => {
    try {
        const { type, payload } = req.body as { type: JobType; payload: Record<string, unknown> };
        const user = (req as any).user;

        if (!type || !payload) {
            return res.status(400).json({ error: 'Missing type or payload' });
        }

        const validTypes: JobType[] = ['execute', 'ai_tutor', 'ai_hint', 'ai_explain', 'generate'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: `Invalid job type: ${type}` });
        }

        const jobId = await jobQueue.submit({
            userId: user.sub,
            type,
            payload,
        });

        res.json({ jobId, status: 'pending' });
    } catch (e: any) {
        console.error("Job submission error:", e);
        res.status(500).json({ error: e.message });
    }
});

// Get job status/result
app.get('/api/jobs/:jobId', requireAuth, async (req, res) => {
    try {
        const { jobId } = req.params;
        const user = (req as any).user;

        const job = jobQueue.getJob(jobId, user.sub);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json(job);
    } catch (e: any) {
        if (e.message === 'ACCESS_DENIED') {
            return res.status(403).json({ error: 'Access denied' });
        }
        console.error("Job fetch error:", e);
        res.status(500).json({ error: e.message });
    }
});

// List user's jobs
app.get('/api/jobs', requireAuth, async (req, res) => {
    try {
        const user = (req as any).user;
        const limit = parseInt(req.query.limit as string) || 10;

        const jobs = jobQueue.getUserJobs(user.sub, limit);
        res.json({ jobs });
    } catch (e: any) {
        console.error("Jobs list error:", e);
        res.status(500).json({ error: e.message });
    }
});

// Queue stats (for debugging)
app.get('/api/jobs/stats', requireAuth, async (req, res) => {
    try {
        const stats = jobQueue.getStats();
        res.json(stats);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// --- PROGRESS API ENDPOINTS ---

// Get user's progress from server
app.get('/api/progress', requireAuth, async (req, res) => {
    try {
        const user = (req as any).user;
        const progress = progressStore.get(user.sub);

        if (!progress) {
            return res.json({
                userId: user.sub,
                lastSyncedAt: 0,
                solvedProblems: [],
                drafts: {},
            });
        }

        res.json(progress);
    } catch (e: any) {
        console.error("Progress fetch error:", e);
        res.status(500).json({ error: e.message });
    }
});

// Push/save user's progress to server
app.post('/api/progress', requireAuth, async (req, res) => {
    try {
        const user = (req as any).user;
        const clientProgress = req.body as UserProgress;

        if (!clientProgress) {
            return res.status(400).json({ error: 'Missing progress data' });
        }

        progressStore.set(user.sub, clientProgress);

        res.json({
            success: true,
            lastSyncedAt: Date.now()
        });
    } catch (e: any) {
        console.error("Progress save error:", e);
        res.status(500).json({ error: e.message });
    }
});

// Sync progress (bidirectional merge)
app.post('/api/progress/sync', requireAuth, async (req, res) => {
    try {
        const user = (req as any).user;
        const clientProgress = req.body as UserProgress;

        if (!clientProgress) {
            return res.status(400).json({ error: 'Missing progress data' });
        }

        // Merge and return combined progress
        const mergedProgress = progressStore.merge(user.sub, clientProgress);

        res.json(mergedProgress);
    } catch (e: any) {
        console.error("Progress sync error:", e);
        res.status(500).json({ error: e.message });
    }
});

// Get progress stats (admin/debug)
app.get('/api/progress/stats', async (req, res) => {
    try {
        const stats = progressStore.getStats();
        res.json(stats);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/debug', (req, res) => {
    try {
        const cwd = process.cwd();
        const dirName = __dirname;
        const dataPathCandidates = [
            path.join(cwd, 'api', 'data'),
            path.join(dirName, 'api', 'data'),
            path.join(dirName, '..', '..', '..', '..', 'api', 'data'),
            path.join('/var/task/api/data')
        ];

        const activeCandidate = dataPathCandidates.find(p => fs.existsSync(p));
        const problemsFile = activeCandidate ? path.join(activeCandidate, 'problems.json') : 'NOT_FOUND';
        const problemsExists = fs.existsSync(problemsFile);

        res.json({
            status: 'debug',
            env: {
                cwd,
                dirName,
                NODE_ENV: process.env.NODE_ENV,
                AI_PROVIDER: process.env.AI_PROVIDER,
                OPENAI_API_KEY_SET: !!process.env.OPENAI_API_KEY,
            },
            paths: {
                candidates: dataPathCandidates,
                activeCandidate,
                problemsFile,
                problemsExists
            },
            ai: {
                provider: aiProvider,
                serviceType: aiService.constructor.name,
                // OpenAI config
                OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || '(default: https://api.openai.com/v1)',
                OPENAI_MODEL: process.env.OPENAI_MODEL || '(default: gpt-4-turbo-preview)',
                // Ollama config (for reference)
                OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || '(default: http://127.0.0.1:11434)',
                OLLAMA_API_KEY_SET: !!process.env.OLLAMA_API_KEY,
                OLLAMA_MODEL: process.env.OLLAMA_MODEL || '(default: deepseek-coder)'
            },
            cache: cacheService.getStats()
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message, stack: e.stack });
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
