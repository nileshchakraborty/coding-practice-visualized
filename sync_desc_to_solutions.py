
import json

PROBLEMS_FILE = 'data/problems.json'
SOLUTIONS_FILE = 'data/solutions.json'

def sync_desc():
    with open(PROBLEMS_FILE, 'r') as f:
        problems_data = json.load(f)
        
    with open(SOLUTIONS_FILE, 'r') as f:
        solutions_data = json.load(f)
        solutions = solutions_data.get('solutions', {})
        
    problem_map = {}
    for cat in problems_data['categories']:
        for prob in cat['problems']:
            problem_map[prob['slug']] = prob
            
    updated_count = 0
    for slug, sol in solutions.items():
        if not sol.get('problemStatement'):
            prob = problem_map.get(slug)
            if prob and prob.get('description'):
                sol['problemStatement'] = prob['description']
                updated_count += 1
                
    solutions_data['solutions'] = solutions
    with open(SOLUTIONS_FILE, 'w') as f:
        json.dump(solutions_data, f, indent=4)
        
    print(f"Synced {updated_count} descriptions to solutions.json.")

if __name__ == "__main__":
    sync_desc()
