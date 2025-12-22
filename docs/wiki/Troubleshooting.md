# Troubleshooting

Solutions to common issues when developing or running Codenium.

---

## Quick Diagnostics

Before diving into specific issues, run these diagnostic checks:

```bash
# Check Node.js version
node --version  # Should be 22.x or 24.x

# Check if services are running
curl http://localhost:3001/api/health

# Check port usage
lsof -i:3000
lsof -i:3001

# Check for TypeScript errors
cd frontend && npx tsc --noEmit
```

---

## Installation Issues

### `npm install` Fails

**Symptoms:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# If still failing, use legacy peer deps
npm install --legacy-peer-deps
```

### Python Dependencies Fail

**Symptoms:**
```
ERROR: Could not find a version that satisfies the requirement
```

**Solution:**
```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install requirements
pip install -r requirements.txt
```

### Node Version Mismatch

**Symptoms:**
```
npm warn EBADENGINE Unsupported engine
```

**Solution:**
```bash
# Using nvm
nvm install 24
nvm use 24

# Using fnm
fnm install 24
fnm use 24

# Verify
node --version
```

---

## Startup Issues

### Port Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or kill all Node processes
pkill -f node

# Restart
make dev
```

### Frontend Won't Start

**Symptoms:**
```
Error: Cannot find module 'vite'
```

**Solution:**
```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### Backend Crashes on Startup

**Symptoms:**
```
Cannot find module '../src/application/ProblemService'
```

**Solution:**
```bash
# Ensure you're running from project root
cd /path/to/leetcode-visual

# Check TypeScript compilation
cd api && npx tsc --noEmit

# Reinstall dependencies
npm install
```

---

## TypeScript Errors

### Module Not Found

**Symptoms:**
```
Cannot find module '@vercel/speed-insights/react'
```

**Solution:**
```bash
# Install missing package
cd frontend
npm install @vercel/speed-insights
```

### Type Errors in Editor

**Symptoms:**
- Red squiggles in VS Code
- `any` type warnings

**Solution:**
```bash
# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"

# Or rebuild
cd frontend && npm run build
```

---

## API Issues

### 401 Unauthorized

**Symptoms:**
```json
{"error": "Unauthorized"}
```

**Causes & Solutions:**

1. **Missing token:**
   - Ensure you're logged in via Google OAuth
   - Check that Authorization header is set

2. **Expired token:**
   - Log out and log back in
   - Tokens expire after ~1 hour

3. **Invalid OAuth config:**
   ```bash
   # Check environment variables
   echo $GOOGLE_CLIENT_ID
   echo $VITE_GOOGLE_CLIENT_ID
   ```

### 404 Not Found

**Symptoms:**
```json
{"error": "Solution not found"}
```

**Solutions:**

1. **Check data files exist:**
   ```bash
   ls -la api/data/
   # Should show problems.json and solutions.json
   ```

2. **Validate data:**
   ```bash
   python3 validate_all.py
   ```

### 500 Internal Server Error

**Symptoms:**
```json
{"error": "Internal server error"}
```

**Debug steps:**

1. **Check server logs:**
   ```bash
   tail -f api.log
   ```

2. **Enable debug logging:**
   ```bash
   DEBUG_LOGS=true make run-api
   ```

3. **Check AI service:**
   ```bash
   # For Ollama
   curl http://localhost:11434/api/tags
   
   # For OpenAI
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

---

## AI Service Issues

### Ollama Not Responding

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:11434
```

**Solution:**
```bash
# Start Ollama
ollama serve

# Verify it's running
curl http://localhost:11434/api/tags

# Pull required model
ollama pull qwen2.5-coder:14b
```

### OpenAI Rate Limited

**Symptoms:**
```json
{"error": "Rate limit exceeded"}
```

**Solutions:**
1. Wait a few minutes and retry
2. Upgrade OpenAI plan
3. Use Ollama for local development:
   ```bash
   # Edit .env
   AI_PROVIDER=ollama
   ```

### Slow AI Responses

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Large model | Use smaller model (e.g., `gpt-4o-mini`) |
| Network latency | Use Ollama locally |
| Cold start | First request is always slower |

---

## Frontend Issues

### Blank Page

**Debug steps:**

1. **Check browser console:**
   - Open DevTools (F12)
   - Look for JavaScript errors

2. **Check network tab:**
   - Are API requests failing?
   - CORS errors?

3. **Hard refresh:**
   ```
   Cmd+Shift+R (Mac)
   Ctrl+Shift+R (Windows)
   ```

### Styles Not Loading

**Symptoms:**
- Unstyled HTML
- Missing Tailwind classes

**Solution:**
```bash
cd frontend
npm run build
npm run dev
```

### Hot Reload Not Working

**Symptoms:**
- Changes don't appear without manual refresh

**Solution:**
```bash
# Restart dev server
pkill -f vite
cd frontend && npm run dev
```

---

## Data Issues

### Corrupt JSON Data

**Symptoms:**
```
SyntaxError: Unexpected token in JSON
```

**Solution:**
```bash
# Restore from backup
cp api/data/solutions.json.bak api/data/solutions.json

# Or restore from Git
git checkout -- api/data/solutions.json

# Validate
python3 validate_all.py
```

### Missing Visualizations

**Symptoms:**
- "No animation data" message
- Blank visualizer

**Solution:**
```bash
# Run visualization fixer
node scripts/fix-all-viz-mismatches.js

# Validate
node scripts/validate-all-data.js
```

---

## Deployment Issues

### Vercel Build Fails

**Common causes:**

1. **Missing dependencies:**
   ```bash
   # Add to root package.json if needed
   npm install <missing-package>
   ```

2. **TypeScript errors:**
   ```bash
   cd frontend && npx tsc --noEmit
   ```

3. **Environment variables:**
   - Check all required vars are set in Vercel dashboard

### Vercel Function Timeout

**Symptoms:**
```
FUNCTION_INVOCATION_TIMEOUT
```

**Solutions:**

1. **Increase timeout:**
   ```json
   // vercel.json
   "functions": {
       "api/index.ts": {
           "maxDuration": 60
       }
   }
   ```

2. **Use background jobs for long operations**

---

## Performance Issues

### Slow Search

**Symptoms:**
- Search feels laggy

**Solution:**
The search engine uses a Trie with memoization. If still slow:
```bash
# Check data size
wc -l api/data/problems.json

# Rebuild search index (happens automatically on load)
```

### High Memory Usage

**Solutions:**

1. **Restart backend:**
   ```bash
   pkill -f "ts-node api/index.ts"
   make run-api
   ```

2. **Check for memory leaks:**
   ```bash
   node --inspect api/index.ts
   # Open chrome://inspect
   ```

---

## Getting Help

If you can't resolve an issue:

1. **Check existing issues:** [GitHub Issues](https://github.com/your-username/leetcode-visual/issues)
2. **Search logs** for error messages
3. **Create a new issue** with:
   - Error message
   - Steps to reproduce
   - Environment (OS, Node version, etc.)

---

## Related Documentation

- [Runbook](./Runbook.md) - Operational procedures
- [Configuration](./Configuration.md) - Environment setup
- [Development Guide](./Development-Guide.md) - Development workflow
