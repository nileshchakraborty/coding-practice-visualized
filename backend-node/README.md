# LeetCode Visual - Node.js Backend

Express + TypeScript backend for the LeetCode Visual application.

## Quick Start

```bash
# Install dependencies
npm install

# Development (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/problems` | List all problems |
| GET | `/api/problems/:slug` | Get problem with solution |
| GET | `/api/solutions/:slug` | Get solution only |
| POST | `/api/execute` | Execute code against test cases |
| POST | `/api/ai/hint` | Get AI hint for problem |
| POST | `/api/ai/explain` | Get AI explanation for code |
| POST | `/api/ai/tutor` | Ask AI tutor a question |

## Environment Variables

Create a `.env` file in the project root (or `backend-node/`):

```env
PORT=8000
NODE_ENV=development

# AI Provider: 'ollama' or 'openai'
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# OpenAI (if using)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

## Deploy to Vercel

### Option 1: Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy (from backend-node directory)
cd backend-node
vercel

# Production deployment
vercel --prod
```

### Option 2: GitHub Integration

1. Push to GitHub
2. Connect repository to Vercel
3. Set root directory to `backend-node`
4. Add environment variables in Vercel dashboard

## Architecture

```
src/
├── index.ts              # Express app entry point
├── config.ts             # Environment configuration
├── types/index.ts        # TypeScript type definitions
├── repositories/
│   └── ProblemRepository.ts   # JSON data access
├── services/
│   ├── ExecutionService.ts    # Python code execution
│   └── AIService.ts           # Ollama/OpenAI integration
└── routes/api.ts         # API route handlers
```

## Notes

- **Python Execution**: Code execution uses Vercel's Python runtime (`@vercel/python`). The `/api/execute` endpoint is handled by `api/execute.py`.
- **Hybrid Architecture**: Node.js handles API routes, Python handles code execution.
- **AI Service**: Supports both Ollama (local) and OpenAI APIs.
- **Data Files**: Reads from `../data/problems.json` and `../data/solutions.json`.

## Vercel Python Runtime

The project uses a hybrid setup:
- **Node.js** (`@vercel/node`): Main API, problem retrieval, AI integration
- **Python** (`@vercel/python`): Code execution endpoint

Routes:
- `/api/execute` → Python serverless function
- `/api/health/python` → Python health check
- `/api/*` → Node.js Express API
