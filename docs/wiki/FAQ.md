# FAQ

Frequently asked questions about Codenium.

---

## General

### What is Codenium?

Codenium is a visual learning platform for mastering coding interview patterns. It provides step-by-step animations, AI tutoring, and interactive code execution for 250+ LeetCode problems.

### Is it free?

The open-source version is free. AI features require API keys (OpenAI or local Ollama).

---

## Setup

### Which AI provider should I use?

| Provider | Best For | Cost |
|----------|----------|------|
| **Ollama** | Local development | Free |
| **OpenAI** | Production | Pay-per-use |

### Do I need Google OAuth?

Google OAuth is required for:
- Code execution
- AI tutoring
- Progress sync

For read-only browsing, no auth is needed.

---

## Features

### How many problems are included?

252 problems covering all major patterns:
- Arrays & Hashing
- Two Pointers
- Sliding Window
- Binary Search
- Trees & Graphs
- Dynamic Programming
- And more...

### What languages are supported for code execution?

- Python (primary)
- JavaScript
- TypeScript
- Java
- C++
- Go
- Rust

---

## Technical

### Why JSON instead of a database?

- **Simplicity**: No database setup
- **Portability**: Data ships with code
- **Performance**: In-memory caching
- **Versioning**: Git tracks changes

### Can I self-host?

Yes! Deploy to:
- Vercel (serverless)
- Railway (container)
- Render (container)
- Any Docker host

---

## Problems

### API not responding?

```bash
curl http://localhost:3001/api/health
# If no response, restart:
make dev
```

### Visualizations not loading?

```bash
# Validate data
node scripts/validate-all-data.js
```

See [Troubleshooting](./Troubleshooting.md) for more.

---

## Contributing

### How can I contribute?

See [Contributing Guide](./Contributing.md) for guidelines.

### Where do I report bugs?

Open an issue on GitHub with:
- Steps to reproduce
- Expected vs actual behavior
- Environment details
