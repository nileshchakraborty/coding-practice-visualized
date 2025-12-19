# LeetCode Visualizer

A full-stack application for visualizing LeetCode problems, generating solutions with AI, and getting personalized tutoring.

![Dashboard](docs/images/dashboard.png)

## Features

- **Problem Explorer**: Visual dashboard of Top 150 Interview questions.
- **Smart Visualizations**: AI-generated visualizations for algorithms (Two Pointers, Sliding Window, etc.).
- **Interactive Playground**: Run Python code against test cases directly in the browser.
- **AI Tutor**: Socratic agent to help you derive solutions.

## Architecture

The application follows a **Controller-Service-Repository (CSR)** pattern to ensure modularity and separation of concerns.

```mermaid
graph TD
    User[User] -->|Interacts| Frontend[Frontend (Vite + React)]
    Frontend -->|HTTP Requests| API[Backend API (FastAPI)]
    
    subgraph "Backend Structure"
        API[API Controller (routes/api.py)] -->|Orchestrates| ServiceLayer
        
        subgraph "Service Layer"
            ServiceLayer -->|Business Logic| AIService[AIService]
            ServiceLayer -->|Code Execution| ExecService[ExecutionService]
        end
        
        AIService -->|Prompts| AIAdapter[AI Adapter (Factory)]
        AIAdapter -->|External API| LLM[Ollama / OpenAI / Anthropic]
        
        ExecService -->|Subprocess| Runner[Safe Runner]
        
        API -->|Data Access| Repo[ProblemRepository]
        Repo -->|Read/Write| DB[(JSON Files)]
    end
```

### Components

1.  **Controller Layer (`backend/routes`)**: Defines API endpoints.
2.  **Service Layer (`backend/services`)**:
    *   `ExecutionService`: Handles safe execution of user code against test cases.
    *   `AIService`: Manages prompts and interactions with AI Providers (Ollama, OpenAI, etc.).
3.  **Repository Layer (`backend/repositories`)**: Abstracts file I/O for `problems.json` and `solutions.json`.

## Getting Started

### Prerequisites

- **Docker** (Recommended for easiest setup)
- *Or* Python 3.11+ & Node.js 18+

### Configuration

Create a `.env` file in the root directory:

```ini
# AI Provider Configuration
AI_PROVIDER=ollama
OLLAMA_URL=http://host.docker.internal:11434
OLLAMA_MODEL=qwen2.5-coder:14b

# Optional: Cloud Providers
# AI_PROVIDER=openai
# OPENAI_API_KEY=your_key_here
```

### Method 1: Docker (Single Container)

The application is containerized to serve both the frontend and backend from a single image.

1.  **Build**:
    ```bash
    docker build -t leetcode-visual .
    ```

2.  **Run**:
    ```bash
    docker run -p 8000:8000 --env-file .env leetcode-visual
    ```

Visit `http://localhost:8000`.

### Method 2: Local Development

1.  **Backend**:
    ```bash
    # Install dependencies
    pip install -r requirements.txt
    
    # Run Server
    python main.py
    ```
    (Runs on `http://localhost:8000`)

2.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    (Runs on `http://localhost:5173`)

## System Flow

1.  **Exploration**: User selects a problem from the dashboard.
2.  **Generation**:
    *   If a solution is missing, the **AIService** generates one using the configured provider.
    *   The solution is validated by running it against test cases via **ExecutionService**.
    *   If successful, it's saved via **ProblemRepository**.
3.  **Visualization**: The frontend parses the specific algorithm steps (e.g., "pointer left moves to index 3") and animates them.
4.  **Tutoring**: The **AIService** maintains a conversation history to provide Socratic guidance without revealing the answer.

## Deployment

The project is configured for easy deployment on **Render** or **Railway**.

- **Render**: Use `render.yaml`. Set environment variables in the dashboard.
- **Docker**: The `Dockerfile` handles the multi-stage build (Node build -> Python image).
