# Scripts Reference

Documentation for the 100+ maintenance and utility scripts in the `scripts/` directory.

---

## Overview

Scripts are categorized by function:

| Category | Purpose | Prefix |
|----------|---------|--------|
| Validation | Data integrity checks | `validate-`, `audit-` |
| Enhancement | Add or improve content | `enhance-`, `inject-` |
| Fixes | Repair data issues | `fix-` |
| Generation | Create derived data | `generate-` |
| Analysis | Inspect and report | `analyze-`, `check-` |
| Synchronization | Data sync operations | `sync-` |

---

## Validation Scripts

### `validate-all-data.js`

Comprehensive audit of the entire dataset.

```bash
node scripts/validate-all-data.js
```

**Checks:**
- Required fields present
- Valid difficulty values
- Animation data structure
- Video IDs format

**Output:** Console report + `validation_report.json`

---

### `audit-content-quality.js`

Audit content completeness and quality.

```bash
node scripts/audit-content-quality.js
```

**Checks:**
- Intuition text length
- Mental model presence
- Hint quality
- Explanation depth

---

### `deep-data-audit.js`

Deep validation of nested data structures.

```bash
node scripts/deep-data-audit.js
```

**Checks:**
- Animation frame validity
- State panel consistency
- Example format

---

## Enhancement Scripts

### `enhance-animations.js` (and batches)

Add or improve visualization animations.

```bash
node scripts/enhance-animations.js
# Or specific batches
node scripts/enhance-animations-batch2.js
```

**Purpose:** Add step-by-step animation data to problems.

---

### `inject-mental-models.js`

Add mental model analogies to solutions.

```bash
node scripts/inject-mental-models.js
```

**Example output:**
```json
{
    "mentalModel": "Think of Sliding Window like a caterpillar..."
}
```

---

### `generate-learning-paths.js`

Create problem progression paths.

```bash
node scripts/generate-learning-paths.js
```

**Creates:**
- Easy → Medium → Hard progressions
- "Suggested Next" problem links
- Pattern-based sequences

---

### `generate-approaches.js`

Generate brute force and optimal approach descriptions.

```bash
node scripts/generate-approaches.js
```

---

## Fix Scripts

### `fix-all-viz-mismatches.js`

Repair mismatched visualization data.

```bash
node scripts/fix-all-viz-mismatches.js
```

**Fixes:**
- Data type mismatches
- Missing state panels
- Incorrect variable tracking

---

### `fix-null-values.js`

Remove null values from data.

```bash
node scripts/fix-null-values.js
```

---

### `fix-casing.js`

Normalize text casing.

```bash
node scripts/fix-casing.js
```

---

### `normalize-subtopics.js`

Standardize topic/pattern tags.

```bash
node scripts/normalize-subtopics.js
```

**Before:** `["two pointers", "Two-Pointers", "2 pointers"]`
**After:** `["Two Pointers"]`

---

### `deduplicate-problems.js`

Remove duplicate problem entries.

```bash
node scripts/deduplicate-problems.js
```

---

## Analysis Scripts

### `analyze-missing-models.js`

Find problems without mental models.

```bash
node scripts/analyze-missing-models.js
```

---

### `analyze-video-coverage.js`

Check YouTube video link coverage.

```bash
node scripts/analyze-video-coverage.js
```

**Output:**
```
Total: 252
With Video: 240
Missing Video: 12
Coverage: 95.2%
```

---

### `check-difficulty-mismatch.js`

Find difficulty inconsistencies.

```bash
node scripts/check-difficulty-mismatch.js
```

---

### `check-enhanced-status.js`

Check enhancement status of all problems.

```bash
node scripts/check-enhanced-status.js
```

---

### `list-patterns.js`

List all unique patterns in the dataset.

```bash
node scripts/list-patterns.js
```

**Output:**
```
Two Pointers: 24
Sliding Window: 18
Binary Search: 15
...
```

---

## Python Scripts

### `validate_all.py`

Run solution validation with Python test runner.

```bash
python3 scripts/validate_all.py
# Or via Makefile
make test
```

---

### `sync_initial_code.py`

Sync initial code templates.

```bash
python3 scripts/sync_initial_code.py
```

---

### `migrate_to_class_solution.py`

Migrate function-based solutions to class-based.

```bash
python3 scripts/migrate_to_class_solution.py
```

---

### `audit_all_languages.py`

Audit multi-language solution coverage.

```bash
python3 scripts/audit_all_languages.py
```

---

## Execution Test Scripts

### `test_*_execution.ts`

Test code execution for specific languages.

```bash
npx ts-node scripts/test_python_execution.ts
npx ts-node scripts/test_js_execution.ts
npx ts-node scripts/test_java_execution.ts
npx ts-node scripts/test_cpp_execution.ts
npx ts-node scripts/test_go_execution.ts
npx ts-node scripts/test_rust_execution.ts
```

---

## Running Scripts

### From Project Root

```bash
# JavaScript
node scripts/script-name.js

# Python
python3 scripts/script-name.py

# TypeScript
npx ts-node scripts/script-name.ts
```

### Via Makefile

```bash
# Run validation
make test
```

---

## Script Output Files

| File | Created By | Purpose |
|------|------------|---------|
| `audit_log.json` | Various audits | Detailed audit results |
| `validation_report.json` | `validate-all-data.js` | Validation results |
| `missing_fields_report.json` | Field audits | Missing field list |
| `corrupted_slugs.json` | Corruption checks | Corrupted entries |

---

## Creating New Scripts

### Template

```javascript
// scripts/my-new-script.js
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../api/data/solutions.json');

function main() {
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    
    // Your logic here
    
    // Save changes
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    console.log('Done!');
}

main();
```

### Best Practices

1. **Always backup data first:**
   ```bash
   cp api/data/solutions.json api/data/solutions.json.bak
   ```

2. **Run validation after changes:**
   ```bash
   make test
   ```

3. **Commit data changes separately:**
   ```bash
   git add api/data/solutions.json
   git commit -m "data: description of changes"
   ```

---

## Related Documentation

- [Runbook](./Runbook.md) - Operational procedures
- [Directory Structure](./Directory-Structure.md) - File organization
- [Development Guide](./Development-Guide.md) - Development workflow
