
import json
import os

SOLUTIONS_PATH = 'api/data/solutions.json'
OUTPUT_PATH = 'scripts/missing_ts.json'

def find_missing():
    if not os.path.exists(SOLUTIONS_PATH):
        print(f"File not found: {SOLUTIONS_PATH}")
        return

    with open(SOLUTIONS_PATH, 'r') as f:
        data = json.load(f)

    missing = []
    for slug, problem in data.items():
        impls = problem.get('implementations', {})
        if not impls.get('typescript'):
            missing.append(slug)

    print(f"Found {len(missing)} problems missing TypeScript.")
    
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(missing, f, indent=2)
    print(f"Saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    find_missing()
