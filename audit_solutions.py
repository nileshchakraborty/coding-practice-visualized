
import json

PROBLEMS_FILE = 'data/problems.json'
SOLUTIONS_FILE = 'data/solutions.json'

def audit():
    with open(PROBLEMS_FILE, 'r') as f:
        problems_data = json.load(f)
        
    with open(SOLUTIONS_FILE, 'r') as f:
        solutions_data = json.load(f)
        solutions = solutions_data.get('solutions', {})
        
    all_slugs = set()
    for cat in problems_data['categories']:
        for prob in cat['problems']:
            all_slugs.add(prob['slug'])
            
    print(f"Total Problems in list: {len(all_slugs)}")
    print(f"Total Solutions in file: {len(solutions)}")
    
    missing_solution_key = []
    missing_code = []
    missing_statement = []
    missing_viz = []
    
    for slug in all_slugs:
        if slug not in solutions:
            missing_solution_key.append(slug)
            continue
            
        sol = solutions[slug]
        if not sol.get('code'):
            missing_code.append(slug)
        if not sol.get('problemStatement'):
            missing_statement.append(slug)
        # Check viz (animationSteps OR legacy steps)
        has_anim = sol.get('animationSteps') and len(sol['animationSteps']) > 0
        has_legacy = sol.get('steps') and len(sol['steps']) > 0
        if not (has_anim or has_legacy):
            missing_viz.append(slug)

    print("-" * 30)
    print(f"MISSING SOLUTION ENTRY: {len(missing_solution_key)}")
    if missing_solution_key:
        print(f"Sample: {missing_solution_key[:5]}")
        
    print(f"MISSING CODE: {len(missing_code)}")
    if missing_code:
        print(f"Sample: {missing_code[:5]}")
        
    print(f"MISSING STATEMENT (Description): {len(missing_statement)}")
    if missing_statement:
        print(f"Sample: {missing_statement[:5]}")
        
    print(f"MISSING VISUALIZATION: {len(missing_viz)}")
    if missing_viz:
        print(f"Sample: {missing_viz[:5]}")
    print("-" * 30)

if __name__ == "__main__":
    audit()
