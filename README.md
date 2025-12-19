# Codenium

A visual learning platform for coding, designed for focused minds. Codenium helps you understand algorithms through visualizations, interactive practice, and AI-powered tutoring.

## Demo

![Codenium Demo](docs/videos/demo.webp)

*Full demo showing light and dark modes with consistent UI, search/filter functionality, and all modal tabs.*

### Screenshots

| Code Playground | AI Tutor | Dark Mode |
|:---:|:---:|:---:|
| ![Code](docs/screenshots/code-tab.png) | ![Tutor](docs/screenshots/tutor-tab.png) | ![Dark](docs/screenshots/dark-mode.png) |


## Features

- **Visual Problem Explorer**: Dashboard of Top 150 Interview questions with progress tracking
- **Smart Visualizations**: AI-generated algorithm visualizations (Two Pointers, Sliding Window, etc.)
- **Interactive Playground**: Run Python code against test cases directly in the browser
- **AI Tutor**: Socratic learning agent to help you understand and derive solutions

## Architecture

```mermaid
graph TB
    subgraph Client
        User[👤 User]
        Browser[🌐 Browser]
    end
    
    subgraph "Frontend (Vite + React)"
        App[App.tsx]
        Modal[SolutionModal]
        Visualizer[SmartVisualizer]
        TutorChat[TutorChat AI]
    end
    
    subgraph "API Layer (api/)"
        Routes[Express Routes]
        Routes --> |/problems| ProblemsAPI
        Routes --> |/execute| ExecuteAPI
        Routes --> |/tutor| TutorAPI
    end
    
    subgraph "Domain (src/)"
        direction TB
        ProblemService[ProblemService]
        
        subgraph Ports[Ports - Interfaces]
            AIPort[AIService]
            RepoPort[ProblemRepository]
            ExecPort[ExecutionService]
        end
        
        subgraph Adapters
            OllamaAI[OllamaAIService]
            OpenAI[OpenAIService]
            FileRepo[FileProblemRepository]
            LocalExec[LocalExecutionService]
        end
    end
    
    subgraph External
        Ollama[(Ollama API)]
        OpenAIAPI[(OpenAI API)]
        Python[🐍 Python Runner]
        Data[(data/problems.json)]
    end
    
    User --> Browser
    Browser --> App
    App --> Modal
    Modal --> Visualizer
    Modal --> TutorChat
    
    App --> Routes
    TutorChat --> TutorAPI
    
    ProblemsAPI --> ProblemService
    ExecuteAPI --> ExecPort
    TutorAPI --> AIPort
    
    ProblemService --> RepoPort
    RepoPort --> FileRepo
    FileRepo --> Data
    
    AIPort --> OllamaAI
    AIPort --> OpenAI
    OllamaAI --> Ollama
    OpenAI --> OpenAIAPI
    
    ExecPort --> LocalExec
    LocalExec --> Python
```

## Quick Start

```bash
# Clone and install
git clone https://github.com/yourusername/leetcode-visual.git
cd leetcode-visual

# Install all dependencies (one command)
npm install && cd frontend && npm install && cd ../api && npm install && pip install -r requirements.txt && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your AI provider settings

# Start the app
./start.sh
```

### Environment Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `AI_PROVIDER` | AI backend (`ollama` or `openai`) | `ollama` |
| `OLLAMA_BASE_URL` | Ollama API endpoint | `http://localhost:11434` |
| `OLLAMA_MODEL` | Model name | `qwen2.5-coder:14b` |
| `OPENAI_API_KEY` | OpenAI key (if using OpenAI) | `sk-...` |

### URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:3001 |

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy --prod

# Set environment variables in Vercel Dashboard:
# - AI_PROVIDER=openai
# - OPENAI_API_KEY=your-key
```

## Project Structure

```
leetcode-visual/
├── frontend/          # React + Vite frontend
├── api/               # Express API routes (Vercel serverless)
├── src/               # Domain logic (Hexagonal Architecture)
│   ├── domain/        # Business logic & ports
│   └── adapters/      # AI, repository, execution implementations
├── data/              # Problem data (JSON)
└── docs/              # Screenshots & videos
```

## License

MIT
