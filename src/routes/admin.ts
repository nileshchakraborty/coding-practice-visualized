/**
 * Admin API Routes
 * 
 * Protected CRUD endpoints for site management.
 * All routes require:
 * 1. Localhost access
 * 2. Valid admin token
 */

import { Router, Request, Response } from 'express';
import { requireLocalhost, validateAdminToken } from '../infrastructure/middleware/adminAuth';
import fs from 'fs';
import path from 'path';

const router = Router();

// Apply middleware to all admin routes
router.use(requireLocalhost);
router.use(validateAdminToken);

// Data file paths
const DATA_DIR = path.join(__dirname, '../api/data');
const STUDY_PLANS_FILE = path.join(DATA_DIR, 'study-plans.json');
const PROBLEMS_FILE = path.join(DATA_DIR, 'problems.json');
const SOLUTIONS_FILE = path.join(DATA_DIR, 'solutions.json');

// Helper to read JSON file
const readJsonFile = (filePath: string): unknown => {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
};

// Helper to write JSON file
const writeJsonFile = (filePath: string, data: unknown): void => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// ============================================
// Study Plans Management
// ============================================

/**
 * GET /api/admin/study-plans
 * List all study plans
 */
router.get('/study-plans', (_req: Request, res: Response) => {
    try {
        const data = readJsonFile(STUDY_PLANS_FILE);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read study plans' });
    }
});

/**
 * POST /api/admin/study-plans
 * Create a new study plan
 */
router.post('/study-plans', (req: Request, res: Response) => {
    try {
        const { id, name, icon, description, problems } = req.body;

        if (!id || !name || !problems) {
            res.status(400).json({ error: 'Missing required fields: id, name, problems' });
            return;
        }

        const data = readJsonFile(STUDY_PLANS_FILE) as { plans: Record<string, unknown> };

        if (data.plans[id]) {
            res.status(409).json({ error: 'Study plan with this ID already exists' });
            return;
        }

        data.plans[id] = {
            id,
            name,
            icon: icon || '📚',
            description: description || '',
            problems: problems || []
        };

        writeJsonFile(STUDY_PLANS_FILE, data);
        res.status(201).json({ success: true, plan: data.plans[id] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create study plan' });
    }
});

/**
 * PUT /api/admin/study-plans/:id
 * Update a study plan
 */
router.put('/study-plans/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const data = readJsonFile(STUDY_PLANS_FILE) as { plans: Record<string, unknown> };

        if (!data.plans[id]) {
            res.status(404).json({ error: 'Study plan not found' });
            return;
        }

        data.plans[id] = { ...data.plans[id] as object, ...updates, id };
        writeJsonFile(STUDY_PLANS_FILE, data);

        res.json({ success: true, plan: data.plans[id] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update study plan' });
    }
});

/**
 * DELETE /api/admin/study-plans/:id
 * Delete a study plan
 */
router.delete('/study-plans/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const data = readJsonFile(STUDY_PLANS_FILE) as { plans: Record<string, unknown> };

        if (!data.plans[id]) {
            res.status(404).json({ error: 'Study plan not found' });
            return;
        }

        delete data.plans[id];
        writeJsonFile(STUDY_PLANS_FILE, data);

        res.json({ success: true, message: `Study plan '${id}' deleted` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete study plan' });
    }
});

// ============================================
// Problems Management
// ============================================

/**
 * GET /api/admin/problems
 * List all problems
 */
router.get('/problems', (_req: Request, res: Response) => {
    try {
        const data = readJsonFile(PROBLEMS_FILE);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read problems' });
    }
});

/**
 * PUT /api/admin/problems
 * Bulk update problems
 */
router.put('/problems', (req: Request, res: Response) => {
    try {
        const updatedData = req.body;
        writeJsonFile(PROBLEMS_FILE, updatedData);
        res.json({ success: true, message: 'Problems updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update problems' });
    }
});

// ============================================
// Solutions Management
// ============================================

/**
 * GET /api/admin/solutions
 * List all solutions
 */
router.get('/solutions', (_req: Request, res: Response) => {
    try {
        const data = readJsonFile(SOLUTIONS_FILE);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read solutions' });
    }
});

/**
 * PUT /api/admin/solutions/:slug
 * Update a specific solution
 */
router.put('/solutions/:slug', (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const updates = req.body;

        const data = readJsonFile(SOLUTIONS_FILE) as Record<string, unknown>;

        if (!data[slug]) {
            res.status(404).json({ error: 'Solution not found' });
            return;
        }

        data[slug] = { ...data[slug] as object, ...updates };
        writeJsonFile(SOLUTIONS_FILE, data);

        res.json({ success: true, solution: data[slug] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update solution' });
    }
});

// ============================================
// Analytics
// ============================================

/**
 * GET /api/admin/stats
 * Get site statistics
 */
router.get('/stats', (_req: Request, res: Response) => {
    try {
        const problems = readJsonFile(PROBLEMS_FILE) as Record<string, { problems: unknown[] }>;
        const solutions = readJsonFile(SOLUTIONS_FILE) as Record<string, unknown>;
        const studyPlans = readJsonFile(STUDY_PLANS_FILE) as { plans: Record<string, unknown> };

        const totalProblems = Object.values(problems).reduce((acc, cat) => acc + (cat.problems?.length || 0), 0);
        const totalSolutions = Object.keys(solutions).length;
        const totalPlans = Object.keys(studyPlans.plans).length;

        res.json({
            totalProblems,
            totalSolutions,
            totalPlans,
            studyPlanStats: Object.entries(studyPlans.plans).map(([id, plan]) => ({
                id,
                name: (plan as { name: string }).name,
                problemCount: ((plan as { problems: unknown[] }).problems?.length || 0)
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

export default router;
