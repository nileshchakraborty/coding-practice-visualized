# Deployment

Guide to deploying Codenium to various platforms.

---

## Deployment Options

| Platform | Type | Recommended For | Cost |
|----------|------|-----------------|------|
| **Vercel** | Serverless | Primary production | Free tier available |
| **Railway** | Container | Full-stack apps | Free tier available |
| **Render** | Container | Long-running processes | Free tier available |
| **GitHub Pages** | Static | Frontend only | Free |

---

## Vercel Deployment (Recommended)

Vercel is the recommended platform for Codenium due to its excellent Next.js/React support and serverless functions.

### Setup

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   # Deploy to preview
   vercel

   # Deploy to production
   vercel --prod
   # OR
   make deploy
   ```

### Configuration

The `vercel.json` file configures the deployment:

```json
{
    "version": 2,
    "buildCommand": "cd frontend && npm install && npm run build",
    "outputDirectory": "frontend/dist",
    "functions": {
        "api/index.ts": {
            "maxDuration": 30,
            "memory": 1024,
            "includeFiles": "{api/data/**,api/_lib/**,src/**}"
        }
    },
    "rewrites": [
        {"source": "/api/(.*)", "destination": "/api/index.ts"},
        {"source": "/(.*)", "destination": "/index.html"}
    ]
}
```

### Environment Variables

Set these in the Vercel dashboard (Settings → Environment Variables):

| Variable | Value |
|----------|-------|
| `AI_PROVIDER` | `openai` |
| `OPENAI_API_KEY` | `sk-your-key` |
| `GOOGLE_CLIENT_ID` | `your-client-id.apps.googleusercontent.com` |
| `VITE_GOOGLE_CLIENT_ID` | `your-client-id.apps.googleusercontent.com` |

### Monitoring

```bash
# View deployment logs
vercel logs

# View real-time logs
vercel logs --follow
```

---

## Railway Deployment

Railway provides container-based deployments with easy scaling.

### Setup

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Initialize project:**
   ```bash
   railway init
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

### Configuration

The `railway.json` file:

```json
{
    "build": {
        "builder": "NIXPACKS"
    },
    "deploy": {
        "numReplicas": 1,
        "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
        "healthcheckPath": "/api/health"
    }
}
```

### Environment Variables

Set in Railway dashboard or via CLI:

```bash
railway variables set AI_PROVIDER=openai
railway variables set OPENAI_API_KEY=sk-your-key
```

---

## Render Deployment

Render provides Docker-based deployments with automatic SSL.

### Setup

1. **Connect GitHub repository** in Render dashboard
2. **Create new Web Service**
3. **Select Docker** as runtime

### Configuration

The `render.yaml` blueprint:

```yaml
services:
  - type: web
    name: leetcode-visual-app
    runtime: docker
    plan: free
    healthCheckPath: /api/health
    envVars:
      - key: AI_PROVIDER
        value: openai
      - key: OPENAI_API_KEY
        sync: false  # Set manually in dashboard
```

### Dockerfile

The included `Dockerfile` handles the build:

```dockerfile
# Build Frontend
FROM node:18-alpine as builder
WORKDIR /app_ui
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
ENV VITE_API_URL=/api
RUN npm run build

# Build Backend
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
COPY --from=builder /app_ui/dist ./static_ui

ENV PORT=8000
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## GitHub Pages (Static Only)

For deploying just the frontend as a static site.

### Automatic Deployment

The CI/CD pipeline (`.github/workflows/ci.yml`) automatically deploys to GitHub Pages on push to `main`:

```yaml
deploy:
  runs-on: ubuntu-latest
  needs: [build-and-test]
  if: github.ref == 'refs/heads/main'
  
  steps:
    - name: Deploy to GitHub Pages
      uses: actions/deploy-pages@v4
```

### Manual Deployment

```bash
# Build
make build

# Deploy using gh-pages
npm i -g gh-pages
gh-pages -d public
```

### Limitations

- **No backend**: API endpoints won't work
- **Static data only**: No code execution or AI features
- **Good for**: Demo/portfolio purposes

---

## CI/CD Pipeline

### GitHub Actions

The project includes a complete CI/CD pipeline:

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "24"
      - run: make install
      - run: make test
      - run: make build

  deploy:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    # ... deployment steps
```

### Secrets Configuration

Add these secrets in GitHub repository settings:

| Secret | Purpose |
|--------|---------|
| `OPENAI_API_KEY` | AI features in CI |
| `VERCEL_TOKEN` | Vercel deployments |
| `VERCEL_ORG_ID` | Vercel organization |
| `VERCEL_PROJECT_ID` | Vercel project |

---

## Post-Deployment Checklist

### Verification

- [ ] Health check endpoint responds: `/api/health`
- [ ] Problems load: `/api/problems`
- [ ] Frontend renders correctly
- [ ] OAuth login works
- [ ] AI tutor responds (requires auth)
- [ ] Code execution works (requires auth)

### Monitoring

- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Enable Vercel Analytics

### Security

- [ ] Verify CORS settings
- [ ] Check rate limiting is active
- [ ] Confirm OAuth redirect URLs are correct
- [ ] API keys are not exposed

---

## Rollback Procedures

### Vercel

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback
```

### Railway

```bash
# View deployment history in dashboard
# Click "Rollback" on previous deployment
```

### Git-based Rollback

```bash
# Revert to previous commit
git revert HEAD
git push

# Or deploy specific commit
git checkout <commit-hash>
vercel --prod
```

---

## Related Documentation

- [Configuration](./Configuration.md) - Environment setup
- [Runbook](./Runbook.md) - Operational procedures
- [Troubleshooting](./Troubleshooting.md) - Common issues
