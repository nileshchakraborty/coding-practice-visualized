
import json
import time
from ai_engine import generate_solution_json

PROBLEMS_FILE = 'data/problems.json'
SOLUTIONS_FILE = 'data/solutions.json'
TARGET_SLUG = 'permutation-in-string'

def fix_failed():
    print(f"Attempting to fix {TARGET_SLUG}...")
    
    with open(PROBLEMS_FILE, 'r') as f:
        problems_data = json.load(f)
        
    with open(SOLUTIONS_FILE, 'r') as f:
        solutions_data = json.load(f)
        solutions = solutions_data.get('solutions', {})
    
    # Find problem data
    target_prob = None
    for cat in problems_data['categories']:
        for prob in cat['problems']:
            if prob['slug'] == TARGET_SLUG:
                target_prob = prob
                break
        if target_prob: break
        
    if not target_prob:
        print(f"❌ Problem {TARGET_SLUG} not found in problems.json")
        return

    title = target_prob['title']
    desc = target_prob.get('description', title)
    
    print(f"Generating solution for: {title}...")
    
    # Retry loop
    max_retries = 3
    for attempt in range(max_retries):
        try:
            result = generate_solution_json(title, desc)
            
            if "error" in result:
                print(f"⚠️ Attempt {attempt+1} failed: {result['error']}")
                time.sleep(2)
                continue
                
            full_solution = {
                "id": TARGET_SLUG,
                "slug": TARGET_SLUG,
                "title": title,
                "difficulty": target_prob['difficulty'],
                "category": target_prob.get('subTopic', "Uncategorized"),
                "problemStatement": desc,
                "videoUrl": target_prob.get('videoUrl', ""),
                **result
            }
            
            solutions[TARGET_SLUG] = full_solution
            break
        except Exception as e:
             print(f"⚠️ Attempt {attempt+1} error: {e}")
             time.sleep(2)
             
    if TARGET_SLUG in solutions:
        solutions_data['solutions'] = solutions
        with open(SOLUTIONS_FILE, 'w') as f:
            json.dump(solutions_data, f, indent=4)
        print(f"✅ Success! Fixed {TARGET_SLUG}.")
    else:
        print(f"❌ Failed to fix {TARGET_SLUG} after {max_retries} attempts.")

if __name__ == "__main__":
    fix_failed()
