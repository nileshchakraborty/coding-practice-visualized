
import json

PROBLEMS_FILE = 'data/problems.json'
SOLUTIONS_FILE = 'data/solutions.json'

def fix_titles():
    with open(PROBLEMS_FILE, 'r') as f:
        problems_data = json.load(f)
    with open(SOLUTIONS_FILE, 'r') as f:
        solutions_data = json.load(f)
        solutions = solutions_data.get('solutions', {})
        
    problem_map = {}
    for cat in problems_data['categories']:
        for prob in cat['problems']:
            problem_map[prob['slug']] = prob
            
    fixed_count = 0
    for slug, sol in solutions.items():
        if slug in problem_map:
            expected = problem_map[slug]['title']
            current = sol.get('title')
            # Fix if None, empty, or mismatched (ignoring case/spaces might be wise but strict sync is better)
            if current != expected:
                sol['title'] = expected
                fixed_count += 1
                
    solutions_data['solutions'] = solutions
    with open(SOLUTIONS_FILE, 'w') as f:
        json.dump(solutions_data, f, indent=4)
        
    print(f"Fixed {fixed_count} titles.")

if __name__ == "__main__":
    fix_titles()
