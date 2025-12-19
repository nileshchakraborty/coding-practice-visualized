
import json
import time
from ai_engine import generate_solution_json
from backend import get_config

PROBLEMS_FILE = 'data/problems.json'
SOLUTIONS_FILE = 'data/solutions.json'

def run_filling():
    print("Starting comprehensive solution filling...")
    
    with open(PROBLEMS_FILE, 'r') as f:
        problems_data = json.load(f)
        
    with open(SOLUTIONS_FILE, 'r') as f:
        solutions_data = json.load(f)
        solutions = solutions_data.get('solutions', {})
    
    # Map slug -> problem data
    problem_map = {}
    for cat in problems_data['categories']:
        for prob in cat['problems']:
            problem_map[prob['slug']] = prob
            
    print(f"Total problems: {len(problem_map)}")
    print(f"Existing solutions: {len(solutions)}")
    
    missing_slugs = [s for s in problem_map.keys() if s not in solutions]
    print(f"Missing solutions: {len(missing_slugs)}")
    
    count = 0
    total = len(missing_slugs)
    
    for i, slug in enumerate(missing_slugs):
        prob = problem_map[slug]
        title = prob['title']
        desc = prob.get('description', title)
        
        print(f"[{i+1}/{total}] Regenerating solution for: {title}...")
        
        try:
            # Generate solution code + viz
            result = generate_solution_json(title, desc)
            
            if "error" in result:
                print(f"❌ Failed for {slug}: {result['error']}")
                continue
                
            full_solution = {
                "id": slug,
                "slug": slug,
                "title": title,
                "difficulty": prob['difficulty'],
                "category": prob.get('subTopic', "Uncategorized"),
                "problemStatement": desc,
                "videoUrl": prob.get('videoUrl', ""),
                **result
            }
            
            solutions[slug] = full_solution
            count += 1
            print(f"✅ Saved {slug}")
            
            # Incremental save every 2
            if count % 2 == 0:
                solutions_data['solutions'] = solutions
                with open(SOLUTIONS_FILE, 'w') as f:
                    json.dump(solutions_data, f, indent=4)
                    
        except Exception as e:
            print(f"❌ Error for {slug}: {e}")
            
        time.sleep(1)

    # Final save
    solutions_data['solutions'] = solutions
    with open(SOLUTIONS_FILE, 'w') as f:
        json.dump(solutions_data, f, indent=4)
        
    print(f"Completed! Regenerated {count} solutions.")
    
if __name__ == "__main__":
    run_filling()
