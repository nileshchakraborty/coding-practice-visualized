import json
import os
import sys

def validate_deep():
    print("Starting Deep Quality Check...")
    
    try:
        with open('api/data/solutions.json', 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"FATAL: Could not load solutions.json: {e}")
        return

    solutions = data.get('solutions', {})
    problems_count = len(solutions)
    print(f"Total Problems: {problems_count}")

    errors = []
    warnings = []

    slugs = set(solutions.keys())

    for slug, sol in solutions.items():
        # 1. Check Required Fields
        required = ['slug', 'title', 'difficulty', 'problemStatement', 'approaches']
        for field in required:
            if not sol.get(field):
                errors.append(f"[{slug}] Missing required field: {field}")

        # 2. Check Approaches
        approaches = sol.get('approaches', [])
        if not approaches:
            errors.append(f"[{slug}] No approaches found")
        
        has_bruteforce = False
        has_optimal = False
        
        for app in approaches:
            if not app.get('code'):
                errors.append(f"[{slug}] Approach '{app.get('name')}' missing code")
            if 'brute' in app.get('name', '').lower(): has_bruteforce = True
            if 'optimal' in app.get('name', '').lower(): has_optimal = True

        # 3. Check Video ID format
        vid = sol.get('videoId')
        if vid:
            if len(vid) != 11:
                warnings.append(f"[{slug}] Suspicious Video ID length: {vid}")
        
        # 4. Check Related Problems
        related = sol.get('relatedProblems', [])
        for rel in related:
            if rel not in slugs:
                warnings.append(f"[{slug}] Related problem not found: {rel}")

        # 5. Check Content Loigc
        if not sol.get('pythonCode') and not approaches:
             errors.append(f"[{slug}] No Python code available (root or approach)")

    print("\n--- Validation Report ---")
    print(f"Errors: {len(errors)}")
    for e in errors[:10]:
        print(f"  - {e}")
    if len(errors) > 10: print(f"  ... and {len(errors)-10} more")

    print(f"\nWarnings: {len(warnings)}")
    for w in warnings[:20]:
        print(f"  - {w}")
    if len(warnings) > 20: print(f"  ... and {len(warnings)-20} more")

    if not errors:
        print("\nSUCCESS: No critical data integrity issues found.")
    else:
        print("\nFAILURE: Critical issues detected.")

if __name__ == "__main__":
    validate_deep()
