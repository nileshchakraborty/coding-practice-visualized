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
import { recommendationStore } from '../src/infrastructure/store/RecommendationStore';
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
import { TieredProblemRepository } from '../src/adapters/driven/tiered/TieredProblemRepository';
const problemRepo = new TieredProblemRepository();
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

// ============================================
// RECOMMENDATIONS API - Hot Topics & Problems
// ============================================
app.get('/api/recommendations', async (req, res) => {
    try {
        const k = parseInt(req.query.k as string) || 10;
        const topicK = parseInt(req.query.topicK as string) || 5;

        const hotProblems = recommendationStore.getHotProblems(k);
        const hotTopics = recommendationStore.getHotTopics(topicK);
        const stats = recommendationStore.getStats();

        res.json({
            hotProblems,
            hotTopics,
            stats,
        });
    } catch (e: any) {
        console.error("Error fetching recommendations:", e);
        res.status(500).json({ error: e.message });
    }
});

// Stats Interaction Endpoint
// Stats Interaction Endpoint
app.post('/api/stats/interaction', (req, res) => {
    try {
        const { slug, type, category, updates } = req.body;

        // Handle batched updates (from frontend simulation)
        if (updates && Array.isArray(updates)) {
            updates.forEach((u: any) => {
                if (u.slug) {
                    // Record views
                    if (u.views) {
                        for (let i = 0; i < u.views; i++) {
                            recommendationStore.recordView(u.slug, undefined);
                        }
                    }
                    // Record solves
                    if (u.solves) {
                        for (let i = 0; i < u.solves; i++) {
                            recommendationStore.recordSolve(u.slug, undefined);
                        }
                    }
                }
            });

            // Return updated stats
            const k = 6;
            const topicK = 6;
            res.json({
                hotProblems: recommendationStore.getHotProblems(k),
                hotTopics: recommendationStore.getHotTopics(topicK),
                stats: recommendationStore.getStats(),
            });
            return;
        }

        // Handle single interaction
        if (!slug || !type) {
            res.status(400).json({ error: 'Missing slug or type' });
            return;
        }

        if (type === 'view') {
            recommendationStore.recordView(slug, category);
        } else if (type === 'solve') {
            recommendationStore.recordSolve(slug, category);
        }

        res.json({ success: true });
    } catch (e: any) {
        console.error("Error recording interaction:", e);
        res.status(500).json({ error: e.message });
    }
});

// =============================================
// USER ACTIVITY & ANALYTICS
// =============================================

import { mongoDBService } from '../src/infrastructure/database/MongoDBService';
import { geoLocationService } from '../src/infrastructure/services/GeoLocationService';

// POST /api/events/log - Generic event logger
app.post('/api/events/log', optionalAuth, async (req: express.Request, res: express.Response) => {
    try {
        const { event_type, metadata } = req.body;
        const user = (req as any).user;

        if (!event_type) {
            return res.status(400).json({ error: 'event_type is required' });
        }

        // PII-compliant IP handling
        const ip = geoLocationService.getClientIP(req);
        const ip_hash = geoLocationService.hashIP(ip);

        // Non-blocking city lookup for analytics
        const geo = await geoLocationService.getGeoLocation(ip);

        // Record for recommendation engine too
        if (event_type === 'view_solution' && metadata?.slug) {
            recommendationStore.recordView(metadata.slug, metadata.category);
        } else if (event_type === 'solve_problem' && metadata?.slug) {
            recommendationStore.recordSolve(metadata.slug, metadata.category);
        }

        // Increment persistent counters in MongoDB
        if (user && metadata?.slug) {
            if (event_type === 'practice_run') {
                await mongoDBService.incrementProgress(user.sub || user.email, metadata.slug, 'compile_count');
            } else if (event_type === 'solve_problem') {
                await mongoDBService.incrementProgress(user.sub || user.email, metadata.slug, 'solve_attempts');
            }
        }

        await mongoDBService.logEvent({
            user_id: user?.sub || user?.email || 'anonymous',
            session_id: (req.headers['x-session-id'] as string) || 'unknown',
            ip_hash,
            event_type,
            problem_slug: metadata?.slug || undefined,
            geo_city: geo.geo_city,
            geo_country: geo.geo_country,
            metadata: {
                ...metadata,
                userAgent: req.headers['user-agent']
            }
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error('Event log error:', error);
        // Silently fail or return success to prevent UX disruption, 
        // but log to console for server-side monitoring
        res.json({ success: true, warning: 'Log entry failed' });
    }
});

// GET /api/analytics/youtube/:videoId - Get last position for YouTube continuity
app.get('/api/analytics/youtube/:videoId', optionalAuth, async (req: express.Request, res: express.Response) => {
    try {
        const { videoId } = req.params;
        const user = (req as any).user;

        if (!user) return res.json({ position: 0 });

        const session = await mongoDBService.getYoutubeSession(user.sub || user.email, videoId);
        res.json({ position: session?.last_position || 0 });
    } catch (error) {
        res.json({ position: 0 });
    }
});

// POST /api/analytics/youtube/:videoId/sync - Sync YouTube position
app.post('/api/analytics/youtube/:videoId/sync', optionalAuth, async (req: express.Request, res: express.Response) => {
    try {
        const { videoId } = req.params;
        const { position, total_duration } = req.body;
        const user = (req as any).user;

        if (!user) return res.json({ success: false, error: 'Auth required for sync' });

        await mongoDBService.syncYoutubeSession(
            user.sub || user.email,
            videoId,
            position,
            total_duration
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Sync failed' });
    }
});

app.get('/api/solutions/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const cacheKey = `solution_${slug}`;
        const cachedSolution = cacheService.get(cacheKey);

        // Track view for recommendations
        const category = req.query.category as string | undefined;
        recommendationStore.recordView(slug, category);

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
        const { code, testCases, language, referenceCode, constraints } = req.body;
        const result = await problemService.executeCode(code, testCases, language, referenceCode, constraints);
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

// =============================================
// USER CONSENT API ENDPOINTS
// =============================================

// In-memory consent store (for development - use DB in production)
const userConsentStore = new Map<string, {
    tracking_consent: boolean;
    consent_accepted_at: string | null;
    consent_version: string;
}>();

// GET /api/user/consent - Get user's consent status
app.get('/api/user/consent', requireAuth, async (req, res) => {
    try {
        const user = (req as any).user;
        const userId = user.sub;

        // Check in-memory store
        const consent = userConsentStore.get(userId);

        if (consent) {
            res.json(consent);
        } else {
            res.json({
                tracking_consent: false,
                consent_accepted_at: null,
                consent_version: null
            });
        }
    } catch (e: any) {
        console.error('Consent fetch error:', e);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/user/consent - Update user's consent status
app.post('/api/user/consent', requireAuth, async (req, res) => {
    try {
        const user = (req as any).user;
        const userId = user.sub;
        const { tracking_consent, consent_version } = req.body;

        if (typeof tracking_consent !== 'boolean') {
            return res.status(400).json({ error: 'tracking_consent must be a boolean' });
        }

        // Verify the consent version matches the current active version
        const activeConsent = consentContentStore.find(c => c.is_active);
        if (activeConsent && consent_version !== activeConsent.version) {
            return res.status(400).json({
                error: 'Consent version mismatch. Please review the latest consent.',
                code: 'VERSION_MISMATCH',
                current_version: activeConsent.version
            });
        }

        const consentData = {
            tracking_consent,
            consent_accepted_at: tracking_consent ? new Date().toISOString() : null,
            consent_version: consent_version || activeConsent?.version || '1.0'
        };

        // Store in memory (TODO: persist to database)
        userConsentStore.set(userId, consentData);

        console.log(`[CONSENT] User ${userId} ${tracking_consent ? 'accepted' : 'declined'} consent v${consentData.consent_version}`);

        res.json({
            success: true,
            ...consentData
        });
    } catch (e: any) {
        console.error('Consent update error:', e);
        res.status(500).json({ error: e.message });
    }
});

// =============================================
// CONSENT CONTENT MANAGEMENT (Admin + Public)
// =============================================

// In-memory consent content store
interface ConsentContent {
    id: number;
    version: string;
    title: string;
    content: string;
    summary: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;
}

const consentContentStore: ConsentContent[] = [{
    id: 1,
    version: '1.1',
    title: 'Your Learning Journey on Codenium',
    content: `At Codenium, we believe in learning by doing. To help you master algorithms, we collect data about your practice sessions to provide you with insights, not just numbers.

**How we use your data to help you:**
• **Personalized Roadmap**: We analyze which problems you've solved to recommend the best next step.
• **Performance Insights**: We track your time and code attempts to help you identify patterns and improve faster.
• **Seamless History**: Your progress is saved so you can pick up exactly where you left off, on any device.

**Our Promise:**
• **Your data is yours**: You can export or delete your history at any time.
• **Privacy First**: We verify your identity only to secure your account.
• **No Third-Party Sales**: We do not and will never sell your personal information.

By continuing, you trust us to store this activity for your educational benefit.`,
    summary: 'We use your activity data to personalize your learning path and track your progress. We never sell your data.',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'system'
}];

// GET /api/consent/active - Public endpoint to get current active consent content
app.get('/api/consent/active', (req, res) => {
    const activeConsent = consentContentStore.find(c => c.is_active);

    if (!activeConsent) {
        return res.status(404).json({ error: 'No active consent content found' });
    }

    res.json({
        version: activeConsent.version,
        title: activeConsent.title,
        content: activeConsent.content,
        summary: activeConsent.summary
    });
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

// =============================================
// ADMIN ROUTES (Production-ready with TOTP + Email Allowlist)
// =============================================

import * as crypto from 'crypto';
import * as adminSecurity from './admin-security';

// Re-export types for backward compatibility
type AdminSession = adminSecurity.AdminSession;

// Admin secret (same as grant-admin.ts script)
const ADMIN_SECRET = process.env.ADMIN_SECRET;

// Middleware: Check if request is from localhost
const isLocalRequest = (req: express.Request): boolean => {
    const ip = req.ip || req.socket?.remoteAddress || '';
    const localIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    return localIps.some(local => ip.includes(local));
};

// Secure admin middleware chain for production
const secureAdmin = [
    adminSecurity.adminRateLimiter
];

// Helper to extract Bearer token
const extractBearerToken = (req: express.Request): string | null => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return null;
};

// Middleware for protected admin routes
function validateAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
    const token = extractBearerToken(req);

    if (!token) {
        res.status(401).json({ error: 'Admin session required', code: 'SESSION_REQUIRED' });
        return;
    }

    const session = adminSecurity.getSession(token);

    if (!session) {
        res.status(401).json({ error: 'Invalid or expired session', code: 'SESSION_INVALID' });
        return;
    }

    // For production, require TOTP verification
    if (!isLocalRequest(req) && !session.totpVerified) {
        res.status(401).json({ error: 'TOTP verification required', code: 'TOTP_REQUIRED' });
        return;
    }

    (req as any).adminSession = session;
    next();
}

// =============================================
// ADMIN ANALYTICS
// =============================================

import { analyticsService } from '../src/infrastructure/services/AnalyticsService';

// GET /api/admin/analytics/overview - High-level metrics
app.get('/api/admin/analytics/overview', adminSecurity.adminRateLimiter, validateAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const session = (req as any).adminSession;
        const metrics = await analyticsService.getOverviewMetrics();
        adminSecurity.logActivity('VIEW_ANALYTICS_OVERVIEW', 'Viewed dashboard overview', req, session?.email);
        res.json(metrics);
    } catch (error: any) {
        console.error('Analytics overview error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch analytics overview' });
    }
});

// GET /api/admin/analytics/activity - Daily activity for charts
app.get('/api/admin/analytics/activity', adminSecurity.adminRateLimiter, validateAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const days = parseInt(req.query.days as string) || 30;
        const activity = await analyticsService.getDailyActivity(days);
        res.json(activity);
    } catch (error: any) {
        console.error('Analytics activity error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch activity data' });
    }
});

// GET /api/admin/analytics/problems - Top problems
app.get('/api/admin/analytics/problems', adminSecurity.adminRateLimiter, validateAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const problems = await analyticsService.getTopProblems(limit);
        res.json(problems);
    } catch (error: any) {
        console.error('Analytics problems error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch top problems' });
    }
});

// GET /api/admin/analytics/geo - Geographic distribution
app.get('/api/admin/analytics/geo', adminSecurity.adminRateLimiter, validateAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const geo = await analyticsService.getGeoDistribution();
        res.json(geo);
    } catch (error: any) {
        console.error('Analytics geo error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch geo data' });
    }
});

// =============================================
// AUTHENTICATION ENDPOINTS
// =============================================

// POST /api/admin/auth/google - Authenticate with Google OAuth for production
app.post('/api/admin/auth/google', adminSecurity.adminRateLimiter, async (req: express.Request, res: express.Response) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Google auth token required', code: 'AUTH_REQUIRED' });
            return;
        }

        const googleToken = authHeader.substring(7);

        // Verify Google token
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${googleToken}` }
        });

        if (!userInfoResponse.ok) {
            res.status(401).json({ error: 'Invalid Google token', code: 'GOOGLE_TOKEN_INVALID' });
            return;
        }

        const userInfo = await userInfoResponse.json();
        const email = userInfo.email?.toLowerCase();

        if (!email) {
            res.status(401).json({ error: 'Email not found in Google profile', code: 'EMAIL_MISSING' });
            return;
        }

        // Check allowlist
        if (!adminSecurity.isEmailAllowed(email)) {
            adminSecurity.logActivity('ACCESS_DENIED', `Unauthorized email: ${email}`, req, email);
            res.status(403).json({
                error: 'Your email is not authorized for admin access',
                code: 'EMAIL_NOT_ALLOWED'
            });
            return;
        }

        // Check if TOTP is required and set up
        const needsTotpSetup = await adminSecurity.requiresTotpSetup(email);
        const hasTotpVerified = await adminSecurity.isTotpSetup(email);

        // Generate session token
        const sessionToken = adminSecurity.generateSessionToken();

        // Create session (not fully verified until TOTP is verified in production)
        const session = adminSecurity.createSession(
            sessionToken,
            userInfo.sub,
            email,
            req,
            isLocalRequest(req) // Localhost doesn't need TOTP
        );

        adminSecurity.logActivity('AUTH_GOOGLE', 'Google authentication successful', req, email);

        res.json({
            success: true,
            token: sessionToken,
            email,
            expiresAt: new Date(session.expiresAt).toISOString(),
            totpRequired: !isLocalRequest(req), // Production requires TOTP
            totpSetup: !needsTotpSetup,
            totpVerified: session.totpVerified
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});



// POST /api/admin/totp/setup - Generate TOTP secret and QR code
app.post('/api/admin/totp/setup', adminSecurity.adminRateLimiter, async (req: express.Request, res: express.Response) => {
    try {
        const token = extractBearerToken(req);
        const session = token ? adminSecurity.getSession(token) : null;

        if (!session) {
            res.status(401).json({ error: 'Admin session required', code: 'SESSION_REQUIRED' });
            return;
        }

        // Generate new TOTP secret
        const { secret, qrCodeUrl } = await adminSecurity.generateTotpSecret(session.email);

        // Generate QR code
        const qrCodeDataUrl = await adminSecurity.getTotpQRCode(session.email);

        adminSecurity.logActivity('TOTP_SETUP', 'TOTP setup initiated', req, session.email);

        res.json({
            success: true,
            secret, // Manual entry backup
            qrCodeUrl, // otpauth:// URL
            qrCodeDataUrl, // Data URL for <img> tag
            instructions: 'Scan QR code with Microsoft Authenticator or enter secret manually'
        });
    } catch (error) {
        console.error('TOTP setup error:', error);
        res.status(500).json({ error: 'Failed to setup TOTP' });
    }
});

// POST /api/admin/totp/verify - Verify TOTP code
app.post('/api/admin/totp/verify', adminSecurity.adminRateLimiter, async (req: express.Request, res: express.Response) => {
    try {
        const token = extractBearerToken(req);
        const { code } = req.body;

        const session = token ? adminSecurity.getSession(token) : null;

        if (!session) {
            res.status(401).json({ error: 'Admin session required', code: 'SESSION_REQUIRED' });
            return;
        }

        if (!code || typeof code !== 'string') {
            res.status(400).json({ error: 'TOTP code required' });
            return;
        }

        const isValid = await adminSecurity.verifyTotpCode(session.email, code);

        if (!isValid) {
            adminSecurity.logActivity('TOTP_VERIFY_FAILED', 'Invalid TOTP code', req, session.email);
            res.status(401).json({ error: 'Invalid TOTP code', code: 'TOTP_INVALID' });
            return;
        }

        // Update session to mark TOTP as verified
        session.totpVerified = true;

        adminSecurity.logActivity('TOTP_VERIFY', 'TOTP verification successful', req, session.email);

        res.json({
            success: true,
            message: 'TOTP verified successfully',
            fullyAuthenticated: true
        });
    } catch (error) {
        console.error('TOTP verify error:', error);
        res.status(500).json({ error: 'TOTP verification failed' });
    }
});

// POST /api/admin/activate - Activate admin session with JWE token (localhost only)
app.post('/api/admin/activate', (req: express.Request, res: express.Response) => {
    try {
        // Only allow JWE activation from localhost/development
        if (!isLocalRequest(req) && process.env.NODE_ENV !== 'development') {
            res.status(403).json({
                error: 'JWE activation only available on localhost. Use Google OAuth for production.',
                code: 'LOCALHOST_ONLY'
            });
            return;
        }

        const { token, googleId } = req.body;

        if (!token || !googleId) {
            res.status(400).json({ error: 'Missing token or googleId' });
            return;
        }

        // Verify JWE token
        const result = adminSecurity.verifyJWE(token);
        if (!result.valid) {
            res.status(401).json({ error: 'Invalid or expired JWE token' });
            return;
        }

        // Verify googleId matches token
        if (result.payload?.sub !== googleId) {
            res.status(401).json({ error: 'Google ID mismatch' });
            return;
        }

        // Create admin session with TOTP pre-verified (localhost bypass)
        const session = adminSecurity.createSession(
            token,
            googleId,
            'localhost@local', // Placeholder for JWE sessions
            req,
            true // TOTP pre-verified for localhost
        );

        adminSecurity.logActivity('ACTIVATE_SESSION', `Admin session activated via JWE, expires ${new Date(session.expiresAt).toISOString()}`, req, googleId);

        res.json({
            success: true,
            message: 'Admin session activated',
            expiresAt: new Date(session.expiresAt).toISOString(),
            token: token
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to activate admin session' });
    }
});

// POST /api/admin/revoke - Revoke admin session
app.post('/api/admin/revoke', (req: express.Request, res: express.Response) => {
    const token = extractBearerToken(req) || req.body.token;

    if (token) {
        const session = adminSecurity.getSession(token);
        if (session) {
            adminSecurity.deleteSession(token);
            adminSecurity.logActivity('REVOKE_SESSION', 'Admin session revoked', req, session.email);
            res.json({ success: true, message: 'Admin session revoked' });
            return;
        }
    }

    res.json({ success: true, message: 'No active session to revoke' });
});

// GET /api/admin/status - Check admin session status
app.get('/api/admin/status', (req: express.Request, res: express.Response) => {
    const token = extractBearerToken(req);

    if (!token) {
        res.json({ active: false, message: 'No admin token provided' });
        return;
    }

    const session = adminSecurity.getSession(token);

    if (!session) {
        res.json({ active: false, message: 'Session not found or expired' });
        return;
    }

    const isLocal = isLocalRequest(req);
    const fullyAuthenticated = isLocal || session.totpVerified;

    res.json({
        active: true,
        fullyAuthenticated,
        totpRequired: !isLocal && !session.totpVerified,
        email: session.email,
        expiresAt: new Date(session.expiresAt).toISOString(),
        remainingMs: session.expiresAt - Date.now()
    });
});

// =============================================
// PROTECTED ADMIN ENDPOINTS
// =============================================

// =============================================
// PROTECTED ADMIN ENDPOINTS
// =============================================

// GET /api/admin/logs - Get admin activity logs
app.get('/api/admin/logs', adminSecurity.adminRateLimiter, validateAdmin, (req: express.Request, res: express.Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const session = (req as any).adminSession;
    adminSecurity.logActivity('VIEW_LOGS', `Retrieved ${limit} logs`, req, session?.email);
    const logs = adminSecurity.getActivityLogs(limit);
    res.json(logs);
});

// Data file paths for admin
const adminDataDir = path.join(process.cwd(), 'api', 'data');
const STUDY_PLANS_FILE = path.join(adminDataDir, 'study-plans.json');

// GET /api/admin/stats - Site statistics
app.get('/api/admin/stats', adminSecurity.adminRateLimiter, validateAdmin, (req: express.Request, res: express.Response) => {
    try {
        const studyPlans = JSON.parse(fs.readFileSync(STUDY_PLANS_FILE, 'utf-8'));
        const problems = JSON.parse(fs.readFileSync(path.join(adminDataDir, 'problems.json'), 'utf-8'));
        const solutions = JSON.parse(fs.readFileSync(path.join(adminDataDir, 'solutions.json'), 'utf-8'));

        const totalProblems = Object.values(problems).reduce((acc: number, cat: unknown) => acc + ((cat as { problems?: unknown[] }).problems?.length || 0), 0);
        const totalSolutions = Object.keys(solutions).length;
        const totalPlans = Object.keys(studyPlans.plans).length;

        const session = (req as any).adminSession;
        adminSecurity.logActivity('VIEW_STATS', 'Retrieved site statistics', req, session?.email);

        res.json({
            totalProblems,
            totalSolutions,
            totalPlans,
            studyPlanStats: Object.entries(studyPlans.plans).map(([id, plan]: [string, unknown]) => ({
                id,
                name: (plan as { name: string }).name,
                problemCount: ((plan as { problems: unknown[] }).problems?.length || 0)
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// GET /api/admin/analytics - Full analytics data
app.get('/api/admin/analytics', adminSecurity.adminRateLimiter, validateAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const session = (req as any).adminSession;

        // Get recommendation data
        const hotProblems = recommendationStore.getHotProblems(10);
        const hotTopics = recommendationStore.getHotTopics(5);
        const recStats = recommendationStore.getStats();

        // Get progress stats
        const progressStats = progressStore.getStats();

        // Get cache stats
        const cacheStats = cacheService.getStats();

        // Get recent activity logs
        const logs = adminSecurity.getActivityLogs(20);

        adminSecurity.logActivity('VIEW_ANALYTICS', 'Retrieved analytics data', req, session?.email);

        res.json({
            recommendations: {
                hotProblems,
                hotTopics,
                stats: recStats
            },
            progress: progressStats,
            cache: cacheStats,
            recentActivity: logs.logs
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});

// =============================================
// CACHE MANAGEMENT ENDPOINTS
// =============================================

// GET /api/admin/cache/status - Get cache status
app.get('/api/admin/cache/status', adminSecurity.adminRateLimiter, validateAdmin, (req: express.Request, res: express.Response) => {
    try {
        const session = (req as any).adminSession;
        const cacheStats = cacheService.getStats();

        adminSecurity.logActivity('VIEW_CACHE_STATUS', 'Retrieved cache status', req, session?.email);

        res.json({
            success: true,
            stats: {
                hits: cacheStats.hits,
                misses: cacheStats.misses,
                keys: cacheStats.keys,
                ksize: cacheStats.ksize,
                vsize: cacheStats.vsize
            }
        });
    } catch (error) {
        console.error('Cache status error:', error);
        res.status(500).json({ error: 'Failed to get cache status' });
    }
});

// POST /api/admin/cache/invalidate - Invalidate problems cache
app.post('/api/admin/cache/invalidate', adminSecurity.adminRateLimiter, validateAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const session = (req as any).adminSession;

        // Clear the local cache service
        cacheService.del('all_problems');

        // Invalidate the tiered repository cache (memory + Redis)
        const result = await problemRepo.invalidateCache();

        adminSecurity.logActivity('CACHE_INVALIDATE', 'Invalidated problems cache', req, session?.email);

        res.json({
            success: result.success,
            message: result.message + '. Next request will reload from source file.'
        });
    } catch (error) {
        console.error('Cache invalidation error:', error);
        res.status(500).json({ error: 'Failed to invalidate cache' });
    }
});

// =============================================
// LEARNING FLOW ORDER MANAGEMENT
// =============================================

const CATEGORY_ORDER_FILE = path.join(adminDataDir, 'category-order.json');
const PROBLEM_ORDER_FILE = path.join(adminDataDir, 'problem-order.json');

// GET /api/admin/category-order - Get category order
app.get('/api/admin/category-order', adminSecurity.adminRateLimiter, validateAdmin, (req: express.Request, res: express.Response) => {
    try {
        const session = (req as any).adminSession;
        const data = JSON.parse(fs.readFileSync(CATEGORY_ORDER_FILE, 'utf-8'));
        adminSecurity.logActivity('VIEW_CATEGORY_ORDER', 'Retrieved category order', req, session?.email);
        res.json(data);
    } catch (error) {
        console.error('Category order read error:', error);
        res.status(500).json({ error: 'Failed to read category order' });
    }
});

// PUT /api/admin/category-order - Save category order
app.put('/api/admin/category-order', adminSecurity.adminRateLimiter, validateAdmin, (req: express.Request, res: express.Response) => {
    try {
        const session = (req as any).adminSession;
        const { order } = req.body;

        if (!Array.isArray(order)) {
            res.status(400).json({ error: 'Invalid order format' });
            return;
        }

        const data = {
            order,
            lastUpdated: new Date().toISOString()
        };

        fs.writeFileSync(CATEGORY_ORDER_FILE, JSON.stringify(data, null, 2));

        // Invalidate cache so changes take effect
        cacheService.del('all_problems');
        problemRepo.invalidateCache();

        adminSecurity.logActivity('UPDATE_CATEGORY_ORDER', `Updated category order (${order.length} categories)`, req, session?.email);
        res.json({ success: true, message: 'Category order saved' });
    } catch (error) {
        console.error('Category order save error:', error);
        res.status(500).json({ error: 'Failed to save category order' });
    }
});

// GET /api/admin/problem-order - Get all problem orders
app.get('/api/admin/problem-order', adminSecurity.adminRateLimiter, validateAdmin, (req: express.Request, res: express.Response) => {
    try {
        const session = (req as any).adminSession;
        const data = JSON.parse(fs.readFileSync(PROBLEM_ORDER_FILE, 'utf-8'));
        adminSecurity.logActivity('VIEW_PROBLEM_ORDER', 'Retrieved problem orders', req, session?.email);
        res.json(data);
    } catch (error) {
        console.error('Problem order read error:', error);
        res.status(500).json({ error: 'Failed to read problem order' });
    }
});

// GET /api/admin/problem-order/:category - Get problem order for specific category
app.get('/api/admin/problem-order/:category', adminSecurity.adminRateLimiter, validateAdmin, (req: express.Request, res: express.Response) => {
    try {
        const session = (req as any).adminSession;
        const category = decodeURIComponent(req.params.category);
        const data = JSON.parse(fs.readFileSync(PROBLEM_ORDER_FILE, 'utf-8'));
        const order = data.orders[category] || [];
        adminSecurity.logActivity('VIEW_PROBLEM_ORDER', `Retrieved problem order for ${category}`, req, session?.email);
        res.json({ category, order });
    } catch (error) {
        console.error('Problem order read error:', error);
        res.status(500).json({ error: 'Failed to read problem order' });
    }
});

// PUT /api/admin/problem-order/:category - Save problem order for specific category
app.put('/api/admin/problem-order/:category', adminSecurity.adminRateLimiter, validateAdmin, (req: express.Request, res: express.Response) => {
    try {
        const session = (req as any).adminSession;
        const category = decodeURIComponent(req.params.category);
        const { order } = req.body;

        if (!Array.isArray(order)) {
            res.status(400).json({ error: 'Invalid order format' });
            return;
        }

        const data = JSON.parse(fs.readFileSync(PROBLEM_ORDER_FILE, 'utf-8'));
        data.orders[category] = order;
        data.lastUpdated = new Date().toISOString();

        fs.writeFileSync(PROBLEM_ORDER_FILE, JSON.stringify(data, null, 2));

        // Invalidate cache so changes take effect
        cacheService.del('all_problems');
        problemRepo.invalidateCache();

        adminSecurity.logActivity('UPDATE_PROBLEM_ORDER', `Updated problem order for ${category} (${order.length} problems)`, req, session?.email);
        res.json({ success: true, message: `Problem order saved for ${category}` });
    } catch (error) {
        console.error('Problem order save error:', error);
        res.status(500).json({ error: 'Failed to save problem order' });
    }
});

// GET /api/category-order - Public endpoint for category order (used by frontend)
app.get('/api/category-order', (req: express.Request, res: express.Response) => {
    try {
        const data = JSON.parse(fs.readFileSync(CATEGORY_ORDER_FILE, 'utf-8'));
        res.json({ order: data.order });
    } catch (error) {
        // Return default order if file doesn't exist
        res.json({ order: null });
    }
});

// =============================================
// ADMIN PROBLEM HISTORY & ROLLBACK
// =============================================

import { problemHistoryService } from '../src/infrastructure/services/ProblemHistoryService';
import { localFileSyncService } from '../src/infrastructure/services/LocalFileSyncService';

// GET /api/admin/problems/history - List all problem history
app.get('/api/admin/problems/history', adminSecurity.adminRateLimiter, validateAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const session = (req as any).adminSession;
        const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
        const skip = parseInt(req.query.skip as string) || 0;

        const { entries, total } = await problemHistoryService.getAllHistory(limit, skip);

        adminSecurity.logActivity('VIEW_PROBLEM_HISTORY', `Viewed ${entries.length} history entries`, req, session?.email);
        res.json({ entries, total, limit, skip });
    } catch (error: any) {
        console.error('Problem history error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch history' });
    }
});

// GET /api/admin/problems/history/:slug - History for specific problem
app.get('/api/admin/problems/history/:slug', adminSecurity.adminRateLimiter, validateAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const { slug } = req.params;
        const entries = await problemHistoryService.getHistoryForProblem(slug);
        res.json({ entries });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to fetch problem history' });
    }
});

// GET /api/admin/problems/history/entry/:id - Get specific history entry
app.get('/api/admin/problems/history/entry/:id', adminSecurity.adminRateLimiter, validateAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;
        const entry = await problemHistoryService.getHistoryEntry(id);

        if (!entry) {
            return res.status(404).json({ error: 'History entry not found' });
        }

        res.json({ entry });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to fetch history entry' });
    }
});

// POST /api/admin/problems/:slug/rollback - Rollback to a history entry
app.post('/api/admin/problems/:slug/rollback', adminSecurity.adminRateLimiter, validateAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const session = (req as any).adminSession;
        const { slug } = req.params;
        const { historyId } = req.body;

        if (!historyId) {
            return res.status(400).json({ error: 'historyId is required' });
        }

        const newHistoryId = await problemHistoryService.rollback(historyId, session?.email || 'admin');

        adminSecurity.logActivity('ROLLBACK_PROBLEM', `Rolled back ${slug} to history ${historyId}`, req, session?.email);
        res.json({ success: true, newHistoryId: newHistoryId.toString(), message: `Problem ${slug} rolled back successfully` });
    } catch (error: any) {
        console.error('Rollback error:', error);
        res.status(500).json({ error: error.message || 'Rollback failed' });
    }
});

// GET /api/admin/problems/history/stats - Problem history statistics
app.get('/api/admin/problems/history/stats', adminSecurity.adminRateLimiter, validateAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const stats = await problemHistoryService.getStats();
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to fetch stats' });
    }
});

// POST /api/admin/problems - Create a new problem (with history tracking)
app.post('/api/admin/problems', adminSecurity.adminRateLimiter, validateAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const session = (req as any).adminSession;
        const { slug, ...problemData } = req.body;

        if (!slug) {
            return res.status(400).json({ error: 'slug is required' });
        }

        // Check if problem already exists
        const existing = localFileSyncService.getProblem(slug);
        if (existing) {
            return res.status(409).json({ error: 'Problem with this slug already exists' });
        }

        // Create with history tracking
        const historyId = await problemHistoryService.logCreate(slug, problemData, session?.email || 'admin');

        adminSecurity.logActivity('CREATE_PROBLEM', `Created problem ${slug}`, req, session?.email);
        res.status(201).json({ success: true, slug, historyId: historyId.toString() });
    } catch (error: any) {
        console.error('Create problem error:', error);
        res.status(500).json({ error: error.message || 'Failed to create problem' });
    }
});

// PUT /api/admin/problems/:slug - Update a problem (with history tracking)
app.put('/api/admin/problems/:slug', adminSecurity.adminRateLimiter, validateAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const session = (req as any).adminSession;
        const { slug } = req.params;
        const newData = req.body;

        const existing = localFileSyncService.getProblem(slug);
        if (!existing) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        // Update with history tracking
        const historyId = await problemHistoryService.logUpdate(slug, existing, newData, session?.email || 'admin');

        adminSecurity.logActivity('UPDATE_PROBLEM', `Updated problem ${slug}`, req, session?.email);
        res.json({ success: true, slug, historyId: historyId.toString() });
    } catch (error: any) {
        console.error('Update problem error:', error);
        res.status(500).json({ error: error.message || 'Failed to update problem' });
    }
});

// DELETE /api/admin/problems/:slug - Delete a problem (soft delete with history)
app.delete('/api/admin/problems/:slug', adminSecurity.adminRateLimiter, validateAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const session = (req as any).adminSession;
        const { slug } = req.params;

        const existing = localFileSyncService.getProblem(slug);
        if (!existing) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        // Delete with history tracking
        const historyId = await problemHistoryService.logDelete(slug, existing, session?.email || 'admin');

        adminSecurity.logActivity('DELETE_PROBLEM', `Deleted problem ${slug}`, req, session?.email);
        res.json({ success: true, slug, historyId: historyId.toString() });
    } catch (error: any) {
        console.error('Delete problem error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete problem' });
    }
});

// =============================================
// ADMIN CONSENT CONTENT MANAGEMENT
// =============================================

// GET /api/admin/consent - List all consent versions
app.get('/api/admin/consent', adminSecurity.adminRateLimiter, validateAdmin, (req: express.Request, res: express.Response) => {
    try {
        const session = (req as any).adminSession;
        adminSecurity.logActivity('VIEW_CONSENT', 'Listed all consent versions', req, session?.email);
        res.json({ versions: consentContentStore });
    } catch (error) {
        res.status(500).json({ error: 'Failed to list consent versions' });
    }
});

// POST /api/admin/consent - Create new consent version
app.post('/api/admin/consent', adminSecurity.adminRateLimiter, validateAdmin, (req: express.Request, res: express.Response) => {
    try {
        const session = (req as any).adminSession;
        const { version, title, content, summary, activate } = req.body;

        if (!version || !content) {
            res.status(400).json({ error: 'Version and content are required' });
            return;
        }

        // Check if version already exists
        if (consentContentStore.some(c => c.version === version)) {
            res.status(409).json({ error: 'Version already exists' });
            return;
        }

        const newConsent: ConsentContent = {
            id: consentContentStore.length + 1,
            version,
            title: title || 'Activity Tracking Consent',
            content,
            summary: summary || '',
            is_active: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: session?.email || 'admin'
        };

        consentContentStore.push(newConsent);

        // If activate flag is set, activate this version
        if (activate) {
            consentContentStore.forEach(c => c.is_active = false);
            newConsent.is_active = true;
        }

        adminSecurity.logActivity('CREATE_CONSENT', `Created consent version ${version}${activate ? ' (activated)' : ''}`, req, session?.email);
        res.status(201).json({ success: true, consent: newConsent });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create consent version' });
    }
});

// PUT /api/admin/consent/:version/activate - Activate a specific version
app.put('/api/admin/consent/:version/activate', adminSecurity.adminRateLimiter, validateAdmin, (req: express.Request, res: express.Response) => {
    try {
        const session = (req as any).adminSession;
        const { version } = req.params;

        const consent = consentContentStore.find(c => c.version === version);
        if (!consent) {
            res.status(404).json({ error: 'Version not found' });
            return;
        }

        const previousActive = consentContentStore.find(c => c.is_active);
        const isVersionChange = previousActive?.version !== version;

        // Deactivate all, activate the target
        consentContentStore.forEach(c => c.is_active = false);
        consent.is_active = true;
        consent.updated_at = new Date().toISOString();

        // IMPORTANT: Invalidate ALL user consents when version changes
        // This forces all users to re-consent with the new version
        let invalidatedCount = 0;
        if (isVersionChange) {
            userConsentStore.forEach((userConsent, userId) => {
                if (userConsent.consent_version !== version) {
                    // Clear their consent - they'll need to re-accept
                    userConsent.tracking_consent = false;
                    userConsent.consent_accepted_at = null;
                    invalidatedCount++;
                }
            });
        }

        adminSecurity.logActivity(
            'ACTIVATE_CONSENT',
            `Activated consent version ${version}. ${invalidatedCount > 0 ? `Invalidated ${invalidatedCount} user consent(s).` : 'No user consents invalidated.'}`,
            req,
            session?.email
        );
        res.json({ success: true, message: `Version ${version} is now active`, consent });
    } catch (error) {
        res.status(500).json({ error: 'Failed to activate consent version' });
    }
});

// PUT /api/admin/consent/:version - Update consent content
app.put('/api/admin/consent/:version', adminSecurity.adminRateLimiter, validateAdmin, (req: express.Request, res: express.Response) => {
    try {
        const session = (req as any).adminSession;
        const { version } = req.params;
        const { title, content, summary } = req.body;

        const consent = consentContentStore.find(c => c.version === version);
        if (!consent) {
            res.status(404).json({ error: 'Version not found' });
            return;
        }

        if (title) consent.title = title;
        if (content) consent.content = content;
        if (summary !== undefined) consent.summary = summary;
        consent.updated_at = new Date().toISOString();

        adminSecurity.logActivity('UPDATE_CONSENT', `Updated consent version ${version}`, req, session?.email);
        res.json({ success: true, consent });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update consent version' });
    }
});

// DELETE /api/admin/consent/:version - Delete consent version (cannot delete active)
app.delete('/api/admin/consent/:version', adminSecurity.adminRateLimiter, validateAdmin, (req: express.Request, res: express.Response) => {
    try {
        const session = (req as any).adminSession;
        const { version } = req.params;

        const idx = consentContentStore.findIndex(c => c.version === version);
        if (idx === -1) {
            res.status(404).json({ error: 'Version not found' });
            return;
        }

        if (consentContentStore[idx].is_active) {
            res.status(400).json({ error: 'Cannot delete active consent version. Activate another version first.' });
            return;
        }

        consentContentStore.splice(idx, 1);
        adminSecurity.logActivity('DELETE_CONSENT', `Deleted consent version ${version}`, req, session?.email);
        res.json({ success: true, message: `Version ${version} deleted` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete consent version' });
    }
});

// GET /api/admin/study-plans - List all study plans
app.get('/api/admin/study-plans', adminSecurity.adminRateLimiter, validateAdmin, (req: express.Request, res: express.Response) => {
    try {
        const data = JSON.parse(fs.readFileSync(STUDY_PLANS_FILE, 'utf-8'));
        const session = (req as any).adminSession;
        adminSecurity.logActivity('VIEW_STUDY_PLANS', `Listed ${Object.keys(data.plans).length} study plans`, req, session?.email);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read study plans' });
    }
});

// POST /api/admin/study-plans - Create study plan
app.post('/api/admin/study-plans', adminSecurity.adminRateLimiter, validateAdmin, (req: express.Request, res: express.Response) => {
    try {
        const { id, name, icon, description, problems } = req.body;
        if (!id || !name) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const data = JSON.parse(fs.readFileSync(STUDY_PLANS_FILE, 'utf-8'));
        if (data.plans[id]) {
            res.status(409).json({ error: 'Plan already exists' });
            return;
        }

        data.plans[id] = { id, name, icon: icon || '📚', description: description || '', problems: problems || [] };
        fs.writeFileSync(STUDY_PLANS_FILE, JSON.stringify(data, null, 2));

        const session = (req as any).adminSession;
        adminSecurity.logActivity('CREATE_STUDY_PLAN', `Created study plan '${name}' (${id}) with ${(problems || []).length} problems`, req, session?.email);
        res.status(201).json({ success: true, plan: data.plans[id] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create study plan' });
    }
});

// PUT /api/admin/study-plans/:id - Update study plan
app.put('/api/admin/study-plans/:id', adminSecurity.adminRateLimiter, validateAdmin, (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const data = JSON.parse(fs.readFileSync(STUDY_PLANS_FILE, 'utf-8'));
        if (!data.plans[id]) {
            res.status(404).json({ error: 'Plan not found' });
            return;
        }

        data.plans[id] = { ...data.plans[id], ...updates, id };
        fs.writeFileSync(STUDY_PLANS_FILE, JSON.stringify(data, null, 2));

        const session = (req as any).adminSession;
        adminSecurity.logActivity('UPDATE_STUDY_PLAN', `Updated study plan '${id}'`, req, session?.email);
        res.json({ success: true, plan: data.plans[id] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update study plan' });
    }
});

// DELETE /api/admin/study-plans/:id - Delete study plan
app.delete('/api/admin/study-plans/:id', adminSecurity.adminRateLimiter, validateAdmin, (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;

        const data = JSON.parse(fs.readFileSync(STUDY_PLANS_FILE, 'utf-8'));
        if (!data.plans[id]) {
            res.status(404).json({ error: 'Plan not found' });
            return;
        }

        const planName = data.plans[id]?.name || id;
        delete data.plans[id];
        fs.writeFileSync(STUDY_PLANS_FILE, JSON.stringify(data, null, 2));

        const session = (req as any).adminSession;
        adminSecurity.logActivity('DELETE_STUDY_PLAN', `Deleted study plan '${planName}' (${id})`, req, session?.email);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete study plan' });
    }
});

// Start for local dev
const PORT = process.env.PORT || 3001;
console.log(`[STARTUP] PORT resolution: process.env.PORT=${process.env.PORT}, Final PORT=${PORT}`);
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Hexagonal Node API running on port ${PORT}`);
    });
}

// ============================================
// TOPICS API (Normalization)
// ============================================

import { topicRepository } from '../src/adapters/driven/supabase/SupabaseTopicRepository';

app.get('/api/topics', async (req, res) => {
    try {
        const topics = await topicRepository.getAll();
        res.json(topics);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Admin only
app.post('/api/topics', async (req, res) => {
    try {
        const topic = await topicRepository.upsert(req.body);
        res.json(topic);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/topics/normalize', async (req, res) => {
    try {
        const result = await topicRepository.normalizeProblems();
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default app;
