# Configuration

Complete guide to configuring Codenium for different environments and use cases.

---

## Environment Variables

All configuration is managed through environment variables in a `.env` file.

### Creating Your Configuration

```bash
# Copy the template
cp .env.example .env

# Edit with your values
nano .env
```

---

## AI Provider Configuration

Codenium supports multiple AI providers for the tutoring and hint generation features.

### OpenAI (Recommended for Production)

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

**Available Models:**
| Model | Speed | Quality | Cost |
|-------|-------|---------|------|
| `gpt-4o-mini` | Fast | High | Low |
| `gpt-4o` | Medium | Very High | Medium |
| `gpt-4-turbo` | Slow | Highest | High |

### Ollama (Recommended for Development)

```bash
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:14b
```

**Setup Ollama:**
```bash
# Install Ollama
brew install ollama  # macOS
# or download from https://ollama.ai

# Start Ollama server
ollama serve

# Pull a model
ollama pull qwen2.5-coder:14b
```

**Recommended Models:**
| Model | Size | Best For |
|-------|------|----------|
| `qwen2.5-coder:14b` | 14B | Code generation |
| `codellama:13b` | 13B | Code explanation |
| `mistral:7b` | 7B | Fast responses |

### Anthropic (Future)

```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-your-api-key
ANTHROPIC_MODEL=claude-3-haiku-20240307
```

---

## Authentication Configuration

### Google OAuth

1. **Create OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create a new OAuth 2.0 Client ID
   - Set authorized origins: `http://localhost:3000`, `https://your-domain.com`
   - Set authorized redirects as needed

2. **Configure Environment:**
   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

   > **Note:** Both variables must be set. `VITE_` prefix makes it available to the frontend.

---

## API Configuration

### API URL

```bash
# Local development
VITE_API_URL=http://localhost:3001/api

# Production (relative URL for same-origin)
VITE_API_URL=/api
```

### Timeouts

```bash
# AI request timeout in seconds
AI_TIMEOUT=300
```

---

## Debug Configuration

### Logging

```bash
# Enable verbose startup logs
DEBUG_LOGS=true

# Disable for production
DEBUG_LOGS=false
```

---

## Rate Limiting Configuration

Rate limits are configured in code (`src/infrastructure/middleware/RateLimiter.ts`):

```typescript
// General API limit
const generalLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    max: 100              // 100 requests per minute
});

// AI endpoint limit
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    max: 10               // 10 requests per minute
});
```

---

## Environment Examples

### Local Development

```bash
# .env for local development
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:14b

VITE_API_URL=http://localhost:3001/api
DEBUG_LOGS=true

# Optional - for testing auth
GOOGLE_CLIENT_ID=your-dev-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your-dev-client-id.apps.googleusercontent.com
```

### Production (Vercel)

```bash
# Vercel Environment Variables
AI_PROVIDER=openai
OPENAI_API_KEY=sk-production-key
OPENAI_MODEL=gpt-4o-mini

GOOGLE_CLIENT_ID=your-prod-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your-prod-client-id.apps.googleusercontent.com

DEBUG_LOGS=false
AI_TIMEOUT=30
```

### CI/CD Pipeline

```bash
# GitHub Actions secrets
AI_PROVIDER=openai
OPENAI_API_KEY=${{ secrets.OPENAI_API_KEY }}
```

---

## Configuration Validation

### Check Configuration

```bash
# Start the server and check logs
make run-api

# Look for these startup messages:
# [STARTUP] AI Provider: openai
# [STARTUP] Loaded .env from /path/to/.env
```

### Test AI Configuration

```bash
# Test OpenAI
curl -X POST http://localhost:3001/api/tutor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"slug": "two-sum", "message": "Hello"}'
```

---

## Related Documentation

- [Getting Started](./Getting-Started.md) - Initial setup
- [Runbook](./Runbook.md) - Operational procedures
- [Deployment](./Deployment.md) - Production deployment
