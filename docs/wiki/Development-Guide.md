# Development Guide

Day-to-day development workflows for contributing to Codenium.

---

## Development Environment

### Prerequisites

Ensure you have completed the [Getting Started](./Getting-Started.md) guide.

### IDE Setup (VS Code)

Install these extensions: ESLint, Prettier, TypeScript, Tailwind CSS IntelliSense.

---

## Daily Workflow

```bash
# 1. Start development
make dev

# 2. Make changes (hot-reload enabled)

# 3. Verify
cd frontend && npx tsc --noEmit
make test

# 4. Commit
git add .
git commit -m "feat: add new feature"
```

---

## Frontend Development

### Component Pattern

```tsx
import { useState } from 'react';
import { cn } from '../utils/cn';

interface MyComponentProps {
    title: string;
    onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
    const [active, setActive] = useState(false);
    
    return (
        <div className={cn("p-4 rounded", active && "bg-blue-500")}>
            <h2>{title}</h2>
        </div>
    );
}
```

### Using ViewModels

```tsx
import { useProblems } from '../viewmodels/useProblems';

function ProblemList() {
    const { problems, loading, filterByDifficulty } = useProblems();
    
    if (loading) return <Spinner />;
    
    return problems.map(p => <ProblemCard key={p.slug} problem={p} />);
}
```

---

## Backend Development

### Adding an Endpoint

```typescript
// api/index.ts
app.get('/api/my-endpoint', async (req, res) => {
    try {
        const result = await problemService.myMethod();
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});
```

---

## Working with Data

```bash
# Always backup first
cp api/data/solutions.json api/data/solutions.json.bak

# Validate after changes
make test
```

---

## Debugging

- **Frontend**: Browser DevTools, React Developer Tools
- **Backend**: `DEBUG_LOGS=true make run-api`

---

## Code Style

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `data:` data changes

---

## Related

- [Architecture Overview](./Architecture-Overview.md)
- [API Reference](./API-Reference.md)
