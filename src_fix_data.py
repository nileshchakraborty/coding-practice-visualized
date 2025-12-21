import json

def fix_integrity():
    with open('api/data/solutions.json', 'r') as f:
        data = json.load(f)

    solutions = data.get('solutions', {})
    valid_slugs = set(solutions.keys())
    
    fixed_slugs = 0
    fixed_related = 0

    for key, sol in solutions.items():
        # 1. Fix missing slug
        if not sol.get('slug'):
            sol['slug'] = key
            fixed_slugs += 1
        
        # 2. Fix broken related problems
        related = sol.get('relatedProblems', [])
        valid_related = [r for r in related if r in valid_slugs]
        if len(valid_related) != len(related):
            fixed_related += (len(related) - len(valid_related))
            sol['relatedProblems'] = valid_related

    with open('api/data/solutions.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Fixed missing 'slug' field for {fixed_slugs} problems.")
    print(f"Removed {fixed_related} broken related problem links.")

if __name__ == "__main__":
    fix_integrity()
