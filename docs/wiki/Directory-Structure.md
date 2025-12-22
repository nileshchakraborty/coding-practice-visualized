# Directory Structure

Complete guide to the Codenium project organization.

---

## Root Directory

```
leetcode-visual/
├── .agent/                      # Screenshots and assets for documentation
├── .github/                     # GitHub configuration
│   └── workflows/               # CI/CD pipelines
├── api/                         # Vercel Serverless API
├── backend/                     # Legacy Python FastAPI backend
├── backend-node/                # Legacy standalone Node.js backend
├── docs/                        # Documentation
│   └── wiki/                    # Wiki documentation
├── frontend/                    # React SPA
├── scripts/                     # Maintenance and utility scripts
├── src/                         # Core business logic (Hexagonal)
├── .env                         # Environment variables (local)
├── .env.example                 # Environment template
├── Dockerfile                   # Docker container configuration
├── Makefile                     # Build automation
├── package.json                 # Root Node.js dependencies
├── railway.json                 # Railway deployment config
├── render.yaml                  # Render deployment config
├── requirements.txt             # Python dependencies
├── start.sh                     # Development startup script
├── validate_all.py              # Solution validation script
└── vercel.json                  # Vercel deployment config
```

---

## Frontend (`frontend/`)

React Single Page Application built with Vite and TypeScript.

```
frontend/
├── public/                      # Static assets
├── src/
│   ├── assets/                  # Images, fonts
│   ├── components/              # React components
│   │   ├── SmartVisualizer.tsx  # Unified visualization engine
│   │   ├── SolutionModal.tsx    # Main problem view (105KB)
│   │   ├── TutorChat.tsx        # AI chat interface
│   │   ├── ProblemPage.tsx      # Problem detail page
│   │   ├── LoginButton.tsx      # Google OAuth button
│   │   ├── ThemeToggle.tsx      # Dark/light mode toggle
│   │   ├── visualizers/         # Specialized visualizers
│   │   └── workspace/           # Code editor components
│   ├── context/                 # React Context providers
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── ThemeContext.tsx     # Theme state
│   ├── hooks/                   # Custom React hooks
│   ├── models/                  # TypeScript interfaces
│   │   └── api.ts               # API response types
│   ├── services/                # API clients
│   ├── types/                   # Shared type definitions
│   ├── utils/                   # Utility functions
│   │   ├── SearchEngine.ts      # Trie-based search
│   │   ├── BrowserJSRunner.ts   # In-browser JS execution
│   │   ├── TTLStorage.ts        # LocalStorage with TTL
│   │   └── auth.ts              # Auth utilities
│   ├── viewmodels/              # Business logic hooks
│   │   ├── useProblems.ts       # Problem list logic
│   │   ├── useSolution.ts       # Solution fetching
│   │   ├── usePlayground.ts     # Code execution
│   │   └── useTutor.ts          # AI chat logic
│   ├── App.tsx                  # Main application
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles (Tailwind)
├── package.json                 # Frontend dependencies
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite build config
└── tailwind.config.js           # Tailwind CSS config
```

### Key Components

| Component | Size | Purpose |
|-----------|------|---------|
| `SmartVisualizer.tsx` | 39KB | Renders all visualization types |
| `SolutionModal.tsx` | 105KB | Main problem-solving interface |
| `TutorChat.tsx` | 7KB | AI chat interface |
| `SearchEngine.ts` | 4KB | Trie-based O(L) search |

---

## API (`api/`)

Vercel Serverless Functions - Express.js API.

```
api/
├── data/                        # JSON data store
│   ├── problems.json            # Problem metadata (~218KB)
│   ├── solutions.json           # Full solution data (~3.8MB)
│   └── solutions.json.bak       # Backup
├── _lib/                        # Shared utilities
├── _runners/                    # Code execution runners
├── _services/                   # Service implementations
├── index.ts                     # Main API entry point
├── execute.py                   # Python code executor
├── requirements.txt             # Python dependencies
└── tsconfig.json                # TypeScript config
```

### API Entry Point (`index.ts`)

The main file handles:
- Express server setup
- CORS and rate limiting
- Route definitions
- Dependency injection (Composition Root)

---

## Source (`src/`)

Core business logic following Hexagonal Architecture.

```
src/
├── adapters/                    # Adapter implementations
│   └── driven/                  # Driven (secondary) adapters
│       ├── execution/           # Code execution adapters
│       │   ├── LocalExecutionService.ts
│       │   ├── runners/         # Language-specific runners
│       │   │   ├── PythonRunner.ts
│       │   │   ├── JavaScriptRunner.ts
│       │   │   ├── JavaRunner.ts
│       │   │   ├── CppRunner.ts
│       │   │   ├── GoRunner.ts
│       │   │   └── RustRunner.ts
│       │   └── BaseRunner.ts
│       ├── fs/                  # File system adapter
│       │   └── FileProblemRepository.ts
│       ├── ollama/              # Ollama AI adapter
│       │   └── OllamaAdapter.ts
│       ├── openai/              # OpenAI adapter
│       │   └── OpenAIAdapter.ts
│       └── mcp/                 # Model Context Protocol
│           └── MCPAdapter.ts
├── application/                 # Application services (Use Cases)
│   └── ProblemService.ts        # Main service orchestrator
├── domain/                      # Domain layer
│   ├── entities/                # Domain entities
│   │   └── Problem.ts
│   ├── ports/                   # Port interfaces
│   │   ├── AIService.ts
│   │   ├── ExecutionService.ts
│   │   └── ProblemRepository.ts
│   └── mcp/                     # Tool registry
│       └── ToolRegistry.ts
└── infrastructure/              # Cross-cutting concerns
    ├── cache/                   # Caching
    │   └── CacheService.ts
    ├── middleware/              # HTTP middleware
    │   └── RateLimiter.ts
    ├── queue/                   # Background jobs
    │   └── JobQueue.ts
    └── store/                   # Data persistence
        └── ProgressStore.ts
```

### Architecture Layers

| Layer | Path | Purpose |
|-------|------|---------|
| **Domain** | `src/domain/` | Entities and port interfaces |
| **Application** | `src/application/` | Use cases and orchestration |
| **Adapters** | `src/adapters/` | External system integrations |
| **Infrastructure** | `src/infrastructure/` | Cross-cutting concerns |

---

## Scripts (`scripts/`)

Over 100 maintenance and utility scripts.

```
scripts/
├── validate-all-data.js         # Comprehensive data audit
├── audit-content-quality.js     # Content completeness check
├── enhance-animations.js        # Add visualizations
├── inject-mental-models.js      # Add mental models
├── generate-learning-paths.js   # Problem progression
├── fix-*.js                     # Various data fixes
├── sync-*.js                    # Data synchronization
└── ...
```

### Script Categories

| Category | Examples | Purpose |
|----------|----------|---------|
| **Validation** | `validate-all-data.js` | Data integrity checks |
| **Enhancement** | `enhance-animations.js` | Add/improve content |
| **Fixes** | `fix-all-viz-mismatches.js` | Repair data issues |
| **Generation** | `generate-learning-paths.js` | Create derived data |
| **Audits** | `audit-content-quality.js` | Quality reports |

---

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Root Node.js config and dependencies |
| `frontend/package.json` | Frontend dependencies |
| `tsconfig.json` | TypeScript configuration |
| `vercel.json` | Vercel deployment settings |
| `railway.json` | Railway deployment settings |
| `render.yaml` | Render deployment blueprint |
| `Dockerfile` | Docker container definition |
| `Makefile` | Build automation |
| `.env.example` | Environment variable template |

---

## GitHub Configuration (`.github/`)

```
.github/
└── workflows/
    ├── ci.yml                   # Main CI/CD pipeline
    ├── deploy.yml               # Deployment workflow
    └── static.yml               # Static site deployment
```

---

## Related Documentation

- [Architecture Overview](./Architecture-Overview.md) - System design
- [Frontend Guide](./Frontend-Guide.md) - React development
- [Backend Guide](./Backend-Guide.md) - API development
