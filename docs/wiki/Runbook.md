# Runbook

Operational procedures for running, maintaining, and troubleshooting Codenium.

---

## Table of Contents

1. [Environment Configuration](#environment-configuration)
2. [Starting Services](#starting-services)
3. [Common Operations](#common-operations)
4. [Health Monitoring](#health-monitoring)
5. [Log Management](#log-management)
6. [Emergency Procedures](#emergency-procedures)

---

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root:

```bash
# AI Provider Configuration
# Options: "ollama", "openai", "anthropic"
AI_PROVIDER=openai

# OpenAI Configuration (for production)
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o-mini

# Ollama Configuration (for local development)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:14b

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# API Configuration
VITE_API_URL=http://localhost:3001/api
AI_TIMEOUT=300

# Debug Settings
DEBUG_LOGS=true
```

### Environment-Specific Configurations

| Variable | Development | Production |
|----------|-------------|------------|
| `AI_PROVIDER` | `ollama` | `openai` |
| `VITE_API_URL` | `http://localhost:3001/api` | `/api` |
| `DEBUG_LOGS` | `true` | `false` |

---

## Starting Services

### Development Mode (Full Stack)

```bash
# Start both frontend and backend
make dev
# OR
./start.sh
```

**What happens:**
1. Kills any existing processes on ports 3000, 3001, 8000
2. Starts backend on port 3001 with hot-reload
3. Starts frontend on port 3000 with HMR

### Individual Services

```bash
# Frontend only
make run-frontend
# OR
cd frontend && npm run dev

# Backend only
make run-api
# OR
npx nodemon --exec ts-node api/index.ts
```

### Production Build

```bash
# Build frontend for production
make build

# Output location: frontend/dist/ and public/
```

---

## Common Operations

### Port Management

The startup script handles port conflicts automatically. For manual cleanup:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill all Node processes (nuclear option)
pkill -f node
```

### Dependency Updates

```bash
# Update all dependencies
npm update
cd frontend && npm update

# Clean install (resolve conflicts)
make clean
make install
```

### Data Validation

```bash
# Run the full test suite
make test
# OR
python3 validate_all.py

# Validate specific aspects
node scripts/validate-all-data.js
node scripts/audit-content-quality.js
```

### Cache Management

The backend uses in-memory caching. To clear:

```bash
# Restart the backend server
# Caches are cleared on restart
pkill -f "ts-node api/index.ts"
make run-api
```

---

## Health Monitoring

### Health Check Endpoint

```bash
# Check API health
curl http://localhost:3001/api/health

# Expected response:
# {"status":"healthy","architecture":"hexagonal","check":"vercel-native"}
```

### Service Status

| Service | Health Check | Expected Response |
|---------|--------------|-------------------|
| Frontend | `http://localhost:3000` | HTML page loads |
| Backend | `http://localhost:3001/api/health` | `{"status":"healthy"}` |
| Problems API | `http://localhost:3001/api/problems` | JSON array |

### Performance Metrics

```bash
# Check response time
time curl http://localhost:3001/api/problems

# Check memory usage
ps aux | grep node

# Monitor in real-time
top -pid $(pgrep -f "ts-node")
```

---

## Log Management

### Log Locations

| Log | Location | Purpose |
|-----|----------|---------|
| API Log | `api.log` | Backend request logs |
| Console | Terminal | Real-time stdout |
| Vercel Logs | `vercel logs` | Production logs |

### Viewing Logs

```bash
# Real-time API logs
tail -f api.log

# Search logs for errors
grep -i "error" api.log

# Last 100 lines
tail -100 api.log
```

### Debug Mode

```bash
# Enable verbose logging
DEBUG_LOGS=true make run-api

# Disable verbose logging (production)
DEBUG_LOGS=false make run-api
```

---

## Emergency Procedures

### Service Not Responding

1. **Check if process is running:**
   ```bash
   pgrep -f "ts-node api/index.ts"
   pgrep -f "vite"
   ```

2. **Check port usage:**
   ```bash
   lsof -i:3000
   lsof -i:3001
   ```

3. **Force restart:**
   ```bash
   pkill -f "ts-node"
   pkill -f "vite"
   make dev
   ```

### High Memory Usage

1. **Identify the process:**
   ```bash
   ps aux --sort=-%mem | head -10
   ```

2. **Restart the service:**
   ```bash
   pkill -f "ts-node api/index.ts"
   make run-api
   ```

### AI Service Failures

1. **Check provider status:**
   - OpenAI: https://status.openai.com
   - Ollama: `curl http://localhost:11434/api/tags`

2. **Fallback to alternative provider:**
   ```bash
   # Edit .env
   AI_PROVIDER=ollama  # or openai
   # Restart backend
   ```

3. **Check API key validity:**
   ```bash
   # Test OpenAI key
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

### Data Corruption

1. **Restore from backup:**
   ```bash
   cp api/data/solutions.json.bak api/data/solutions.json
   ```

2. **Validate data:**
   ```bash
   python3 validate_all.py
   ```

3. **Pull fresh from Git:**
   ```bash
   git checkout -- api/data/solutions.json
   ```

---

## Scheduled Maintenance

### Daily

- [ ] Check health endpoint
- [ ] Review error logs

### Weekly

- [ ] Run data validation
- [ ] Check dependency updates
- [ ] Review rate limit hits

### Monthly

- [ ] Update dependencies
- [ ] Backup data files
- [ ] Review analytics

---

## Related Documentation

- [Troubleshooting](./Troubleshooting.md) - Common issues
- [Deployment](./Deployment.md) - Production deployment
- [Monitoring](./Monitoring.md) - Advanced monitoring
