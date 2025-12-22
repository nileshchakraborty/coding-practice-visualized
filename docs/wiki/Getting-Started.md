# Getting Started

This guide will help you set up Codenium for local development in under 5 minutes.

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Minimum Version | Check Command |
|-------------|-----------------|---------------|
| Node.js | 22.x (24.x recommended) | `node --version` |
| npm | 10.x+ | `npm --version` |
| Python | 3.9+ | `python3 --version` |
| pip | Latest | `pip --version` |
| Git | 2.x+ | `git --version` |

### Optional (for AI features)

| Requirement | Purpose |
|-------------|---------|
| OpenAI API Key | Cloud AI tutoring |
| Ollama | Local AI tutoring |

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/leetcode-visual.git
cd leetcode-visual
```

### 2. Install Dependencies

The project uses a Makefile for automation. Run:

```bash
make install
```

This will install:
- Root Node.js dependencies
- Frontend dependencies (`frontend/`)
- API dependencies (`api/`)
- Python dependencies (`requirements.txt`)

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit with your settings
nano .env  # or use your preferred editor
```

**Minimum required configuration:**

```bash
# For local development with Ollama
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:14b

# OR for OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

### 4. Start Development Servers

```bash
make dev
# OR
./start.sh
```

This starts both servers concurrently:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

### 5. Verify Installation

Open your browser and navigate to:
- http://localhost:3000 - You should see the Codenium dashboard
- http://localhost:3001/api/health - Should return `{"status":"healthy"}`

---

## What's Next?

- [Configuration Guide](./Configuration.md) - Configure AI providers and authentication
- [Development Guide](./Development-Guide.md) - Learn the development workflow
- [Architecture Overview](./Architecture-Overview.md) - Understand the system design

---

## Troubleshooting Quick Start

### Port Already in Use

```bash
# Kill processes on specific ports
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Dependencies Failed to Install

```bash
# Clean and reinstall
make clean
make install
```

### Node Version Mismatch

The project requires Node.js 24.x. If you're using a version manager:

```bash
# Using nvm
nvm install 24
nvm use 24

# Using fnm
fnm install 24
fnm use 24
```

For more troubleshooting tips, see [Troubleshooting](./Troubleshooting.md).
