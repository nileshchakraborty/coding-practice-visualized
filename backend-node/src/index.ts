import express from 'express';
import cors from 'cors';
import { config } from './config';
import apiRoutes from './routes/api';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api', apiRoutes);

// Root redirect
app.get('/', (req, res) => {
    res.json({
        name: 'LeetCode Visual API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            problems: '/api/problems',
            solutions: '/api/solutions/:slug',
            execute: 'POST /api/execute',
            tutor: 'POST /api/ai/tutor'
        }
    });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(config.port, () => {
    console.log(`🚀 LeetCode Visual API running on http://localhost:${config.port}`);
    console.log(`📚 AI Provider: ${config.aiProvider}`);
    console.log(`🔧 Environment: ${config.nodeEnv}`);
});

export default app;
