# Tech Stack

Complete list of technologies, frameworks, and tools used in Codenium.

---

## Frontend

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| [React](https://react.dev/) | 19.x | UI library |
| [TypeScript](https://www.typescriptlang.org/) | 5.7 | Type safety |
| [Vite](https://vitejs.dev/) | 7.x | Build tool & dev server |

### UI & Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| [TailwindCSS](https://tailwindcss.com/) | 3.4 | Utility-first CSS |
| [Framer Motion](https://www.framer.com/motion/) | 12.x | Animations |
| [Lucide React](https://lucide.dev/) | 0.56 | Icons |
| [clsx](https://github.com/lukeed/clsx) | 2.1 | Class name utilities |

### Code Editor

| Technology | Version | Purpose |
|------------|---------|---------|
| [Monaco Editor](https://microsoft.github.io/monaco-editor/) | 4.7 | VS Code editor |
| [monaco-vim](https://github.com/brijeshb42/monaco-vim) | 0.4 | Vim keybindings |
| [React Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) | 16.1 | Code highlighting |

### Routing & State

| Technology | Version | Purpose |
|------------|---------|---------|
| [React Router](https://reactrouter.com/) | 7.x | Client-side routing |
| [React Resizable Panels](https://github.com/bvaughn/react-resizable-panels) | 4.0 | Split pane layouts |

### Authentication

| Technology | Version | Purpose |
|------------|---------|---------|
| [@react-oauth/google](https://github.com/MomenSherif/react-oauth) | 0.13 | Google OAuth |
| [jwt-decode](https://github.com/auth0/jwt-decode) | 4.0 | JWT parsing |

### Analytics

| Technology | Version | Purpose |
|------------|---------|---------|
| [@vercel/analytics](https://vercel.com/analytics) | 1.6 | Page analytics |
| [@vercel/speed-insights](https://vercel.com/docs/speed-insights) | 1.x | Performance metrics |

### Utilities

| Technology | Version | Purpose |
|------------|---------|---------|
| [Axios](https://axios-http.com/) | 1.13 | HTTP client |
| [Sucrase](https://github.com/alangpierce/sucrase) | 3.35 | Fast JS/TS transpilation |

---

## Backend

### Runtime & Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| [Node.js](https://nodejs.org/) | 24.x | JavaScript runtime |
| [Express](https://expressjs.com/) | 4.18 | HTTP framework |
| [TypeScript](https://www.typescriptlang.org/) | 5.7 | Type safety |

### AI Integration

| Technology | Version | Purpose |
|------------|---------|---------|
| [OpenAI SDK](https://platform.openai.com/docs/libraries/node-js-library) | 4.20 | GPT API client |
| [Ollama](https://ollama.ai/) | N/A | Local LLM support |

### Authentication

| Technology | Version | Purpose |
|------------|---------|---------|
| [google-auth-library](https://github.com/googleapis/google-auth-library-nodejs) | 10.x | OAuth verification |

### Middleware

| Technology | Version | Purpose |
|------------|---------|---------|
| [cors](https://github.com/expressjs/cors) | 2.8 | CORS handling |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | 8.2 | Rate limiting |
| [dotenv](https://github.com/motdotla/dotenv) | 16.3 | Environment variables |

### Caching

| Technology | Version | Purpose |
|------------|---------|---------|
| [node-cache](https://github.com/node-cache/node-cache) | 5.1 | In-memory caching |

### Development

| Technology | Version | Purpose |
|------------|---------|---------|
| [nodemon](https://nodemon.io/) | 3.0 | Hot reload |
| [ts-node](https://typestrong.org/ts-node/) | 10.9 | TypeScript execution |

---

## Python (Code Execution)

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.9+ | Solution execution |
| FastAPI | 0.x | Legacy API (Docker) |
| uvicorn | 0.x | ASGI server |

---

## Infrastructure

### Deployment Platforms

| Platform | Purpose | Configuration |
|----------|---------|---------------|
| [Vercel](https://vercel.com/) | Primary production | `vercel.json` |
| [Railway](https://railway.app/) | Container deployment | `railway.json` |
| [Render](https://render.com/) | Container deployment | `render.yaml` |
| [GitHub Pages](https://pages.github.com/) | Static hosting | CI/CD workflow |

### CI/CD

| Technology | Purpose |
|------------|---------|
| [GitHub Actions](https://github.com/features/actions) | Automated pipelines |

### Containerization

| Technology | Purpose |
|------------|---------|
| [Docker](https://www.docker.com/) | Container builds |

---

## Data Storage

| Type | Format | Location |
|------|--------|----------|
| Problems | JSON | `api/data/problems.json` |
| Solutions | JSON | `api/data/solutions.json` |
| User Progress | In-memory + LocalStorage | Runtime |

---

## Development Tools

### IDE & Editor

| Tool | Purpose |
|------|---------|
| VS Code | Primary IDE |
| ESLint | JavaScript/TypeScript linting |
| Prettier | Code formatting |

### Version Control

| Tool | Purpose |
|------|---------|
| Git | Version control |
| GitHub | Repository hosting |

### Package Management

| Tool | Purpose |
|------|---------|
| npm | Node.js packages |
| pip | Python packages |

---

## Architecture Patterns

| Pattern | Implementation |
|---------|----------------|
| Hexagonal Architecture | `src/` directory structure |
| MVVM | `frontend/src/viewmodels/` |
| Repository Pattern | `FileProblemRepository` |
| Adapter Pattern | AI service adapters |
| Dependency Injection | Composition root in `api/index.ts` |

---

## Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

---

## Related Documentation

- [Architecture Overview](./Architecture-Overview.md) - System design
- [Frontend Guide](./Frontend-Guide.md) - React details
- [Backend Guide](./Backend-Guide.md) - Express details
