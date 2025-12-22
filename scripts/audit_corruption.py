
import json
import os
import re

SOLUTIONS_PATH = 'api/data/solutions.json'

def audit_corruption():
    if not os.path.exists(SOLUTIONS_PATH):
        print(f"File not found: {SOLUTIONS_PATH}")
        return

    with open(SOLUTIONS_PATH, 'r') as f:
        data = json.load(f)

    corrupted = []

    for slug, problem in data.items():
        root_code = problem.get('initialCode', '')
        impls = problem.get('implementations', {})
        
        if not root_code:
            continue
            
        root_match = re.search(r'def\s+(\w+)\s*\(', root_code)
        if not root_match:
            continue
        root_func = root_match.group(1)
        
        # Check Python Implementation
        if 'python' in impls:
            py_code = impls['python'].get('initialCode', '')
            if py_code:
                py_match = re.search(r'def\s+(\w+)\s*\(', py_code)
                if py_match:
                    py_func = py_match.group(1)
                    if root_func != py_func:
                        corrupted.append({
                            'slug': slug,
                            'root': root_func,
                            'py_impl': py_func
                        })
        
        # Check TS Implementation (if present and not empty)
        # TS code might be fully implemented or initial.
        # Check code field.
        if 'typescript' in impls:
            ts_code = impls['typescript'].get('code', '')
            # Regex for JS/TS method: indent + name(...)
            ts_match = re.search(r'    (\w+)\(', ts_code)
            if ts_match:
                ts_func = ts_match.group(1)
                if ts_func != root_func and ts_func != 'constructor':
                     # Double check if already added
                     if not any(c['slug'] == slug for c in corrupted):
                         corrupted.append({
                            'slug': slug,
                            'root': root_func,
                            'ts_impl': ts_func
                        })

    print(f"Found {len(corrupted)} corrupted implementations.")
    for c in corrupted:
        print(f"{c['slug']}: Root={c.get('root')} PyImpl={c.get('py_impl')} TSImpl={c.get('ts_impl')}")
        
    # Save list to file for next step
    with open('scripts/corrupted_slugs.json', 'w') as f:
        json.dump([c['slug'] for c in corrupted], f)

if __name__ == "__main__":
    audit_corruption()
