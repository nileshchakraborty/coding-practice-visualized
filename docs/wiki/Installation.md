# Installation

Detailed installation instructions for Codenium.

---

## System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | 22.x | 24.x |
| npm | 10.x | 11.x |
| Python | 3.9 | 3.11+ |
| RAM | 4GB | 8GB+ |
| Disk | 500MB | 1GB+ |

---

## Install Node.js

### Using nvm (Recommended)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 24
nvm install 24
nvm use 24
```

### Using Homebrew (macOS)

```bash
brew install node@24
```

---

## Install Python

### macOS

```bash
brew install python@3.11
```

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install python3.11 python3-pip
```

---

## Install Project Dependencies

```bash
# Clone repository
git clone https://github.com/your-username/leetcode-visual.git
cd leetcode-visual

# Install all dependencies
make install
```

This runs:
1. `npm install` (root)
2. `npm install` (frontend)
3. `npm install` (api)
4. `pip install -r requirements.txt`

---

## Verify Installation

```bash
# Check versions
node --version      # Should be v24.x
python3 --version   # Should be 3.9+

# Start development servers
make dev

# Verify endpoints
curl http://localhost:3001/api/health
```

---

## Troubleshooting

See [Troubleshooting](./Troubleshooting.md) for common issues.

---

## Next Steps

- [Configuration](./Configuration.md) - Set up environment variables
- [Getting Started](./Getting-Started.md) - Quick start guide
