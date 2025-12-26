import { Router, Request, Response } from 'express';
import { problemRepository } from '../repositories/ProblemRepository';
import { statsRepository } from '../repositories/StatsRepository';
import { executionService } from '../services/ExecutionService';
import { aiService } from '../services/AIService';
import { ExecuteRequest, TutorRequest } from '../types';

const router = Router();

// Health check
router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get recommendations
router.get('/recommendations', async (req: Request, res: Response) => {
    try {
        const stats = await statsRepository.loadStats();
        res.json({
            hotProblems: stats.hotProblems,
            hotTopics: stats.hotTopics,
            stats: {
                problems: (await problemRepository.getAllProblems()).length,
                categories: 0 // Placeholder
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

// Update stats interaction
router.post('/stats/interaction', async (req: Request, res: Response) => {
    try {
        const { updates } = req.body; // Expects { updates: { slug, views, solves }[] }
        if (!updates || !Array.isArray(updates)) {
            res.status(400).json({ error: 'Invalid updates format' });
            return;
        }

        const newStats = await statsRepository.updateProblemStats(updates);
        res.json(newStats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update stats' });
    }
});

// Get all problems
router.get('/problems', async (req: Request, res: Response) => {
    try {
        const problems = await problemRepository.getAllProblems();
        res.json({ problems });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch problems' });
    }
});

// Search problems
router.get('/problems/search', async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string || '';
        const problems = await problemRepository.searchProblems(query);
        res.json({ problems });
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// Get problem by slug
router.get('/problems/:slug', async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const data = await problemRepository.getProblemWithSolution(slug);

        if (!data) {
            res.status(404).json({ error: 'Problem not found' });
            return;
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch problem' });
    }
});

// Get solution by slug
router.get('/solutions/:slug', async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const solution = await problemRepository.getSolutionBySlug(slug);

        if (!solution) {
            res.status(404).json({ error: 'Solution not found' });
            return;
        }

        res.json({ solution });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch solution' });
    }
});

// Execute code
router.post('/execute', async (req: Request, res: Response) => {
    try {
        const { code, testCases } = req.body as ExecuteRequest;

        if (!code || !testCases) {
            res.status(400).json({ error: 'Missing code or testCases' });
            return;
        }

        const result = await executionService.executeCode(code, testCases);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Execution failed' });
    }
});

// AI Tutoring endpoints
router.post('/ai/hint', async (req: Request, res: Response) => {
    try {
        const { problem, code } = req.body;

        if (!problem) {
            res.status(400).json({ error: 'Missing problem description' });
            return;
        }

        const response = await aiService.generateHint(problem, code || '');
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'AI service failed' });
    }
});

router.post('/ai/explain', async (req: Request, res: Response) => {
    try {
        const { code, title } = req.body;

        if (!code || !title) {
            res.status(400).json({ error: 'Missing code or title' });
            return;
        }

        const response = await aiService.explainSolution(code, title);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'AI service failed' });
    }
});

router.post('/ai/tutor', async (req: Request, res: Response) => {
    try {
        const { problem, question, code } = req.body as TutorRequest;

        if (!problem || !question) {
            res.status(400).json({ error: 'Missing problem or question' });
            return;
        }

        const response = await aiService.answerQuestion(problem, question, code);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'AI service failed' });
    }
});

// Get problems by category
router.get('/categories/:category', async (req: Request, res: Response) => {
    try {
        const { category } = req.params;
        const problems = await problemRepository.getProblemsByCategory(category);
        res.json({ problems });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch problems' });
    }
});

// Get problems by difficulty
router.get('/difficulties/:difficulty', async (req: Request, res: Response) => {
    try {
        const { difficulty } = req.params;
        const problems = await problemRepository.getProblemsByDifficulty(difficulty);
        res.json({ problems });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch problems' });
    }
});

export default router;
