# Codenium

A visual learning platform for coding, designed for focused minds. Codenium helps you understand algorithms through visualizations, interactive practice, and AI-powered tutoring.

![Dashboard](docs/screenshots/dashboard.png)

## Features

- **Visual Problem Explorer**: Dashboard of Top 150 Interview questions with progress tracking
- **Smart Visualizations**: AI-generated algorithm visualizations (Two Pointers, Sliding Window, etc.)
- **Interactive Playground**: Run Python code against test cases directly in the browser
- **AI Tutor**: Socratic learning agent to help you understand and derive solutions

## Architecture

The application uses a **Hexagonal Architecture** (Ports & Adapters) backend deployed as Vercel Serverless Functions.

```mermaid
graph TD
    User[User] -->|Interacts| Frontend[Frontend (Vite + React)]
    Frontend -->|HTTP Requests| API[Node.js API (Express/Vercel)]
    
    subgraph "Backend (api/)"
        API -->|Orchestrates| ProblemService[ProblemService]
        
        subgraph "Hexagonal Domain"
             ProblemService -->|Uses| Ports[Ports Interfaces]
        end
        
        subgraph "Adapters"
            Ports -->|Implemented By| AIAdapter[AI Service]
            Ports -->|Implemented By| Repo[FileProblemRepository]
            Ports -->|Implemented By| Exec[LocalExecutionService]
        end
        
        AIAdapter -->|External API| AI[Ollama / OpenAI]
        Exec -->|Spawns| Runner[Python Runner Bridge]
    end
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+

### Configuration

Copy `.env.example` to `.env` and configure:

```ini
AI_PROVIDER=ollama
OLLAMA_BASE_URL=https://ollama.com/api
OLLAMA_API_KEY=your-key
OLLAMA_MODEL=qwen2.5-coder:14b
```

### Quick Start

```bash
# 1. Install dependencies
npm install
cd frontend && npm install
cd ../api && npm install && pip install -r requirements.txt

# 2. Start the App
./start.sh
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

## Deployment

Designed for **Vercel**:

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel deploy`
3. Add Environment Variables in Vercel Dashboard

## License

MIT
