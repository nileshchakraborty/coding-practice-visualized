# Contributing

Guidelines for contributing to Codenium.

---

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/leetcode-visual.git`
3. Create a branch: `git checkout -b feature/amazing-feature`
4. Make your changes
5. Commit: `git commit -m 'feat: add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## Development Setup

See [Getting Started](./Getting-Started.md) for environment setup.

---

## Code Style

### TypeScript
- Use explicit types for function parameters
- Avoid `any` - use `unknown` and type guards
- Use interfaces over types for objects

### React
- Functional components with hooks
- TypeScript interfaces for props
- Extract logic to custom hooks

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: formatting changes
refactor: code restructuring
chore: maintenance tasks
data: data file changes
```

---

## Pull Request Process

1. Update documentation if needed
2. Ensure tests pass: `make test`
3. Request review from maintainers
4. Address feedback
5. Squash and merge

---

## Areas for Contribution

| Area | Description |
|------|-------------|
| **Visualizations** | Improve animation quality |
| **Content** | Add mental models, improve explanations |
| **UI/UX** | Design improvements |
| **Performance** | Optimization |
| **Documentation** | Wiki improvements |

---

## Questions?

Open an issue for discussion before starting major changes.
