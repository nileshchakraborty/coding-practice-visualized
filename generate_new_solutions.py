
import json
import time
import os
from ai_engine import generate_solution_json

PROBLEMS_FILE = 'data/problems.json'
SOLUTIONS_FILE = 'data/solutions.json'

def run_generation():
    provider = os.getenv("AI_PROVIDER", "ollama")
    print(f"Using AI Provider: {provider}")
    
    if provider == "ollama":
        print("WARNING: Using local LLM (Ollama). This might be slow.")

    with open(PROBLEMS_FILE, 'r') as f:
        problems_data = json.load(f)

    with open(SOLUTIONS_FILE, 'r') as f:
        solutions_data = json.load(f)
        
    solutions = solutions_data.get('solutions', {})
    
    # Identify missing solutions
    missing_problems = []
    category_map = {} # slug -> category/subTopic
    
    for cat in problems_data['categories']:
        for prob in cat['problems']:
            if not prob.get('has_solution'):
                missing_problems.append(prob)
                category_map[prob['slug']] = prob.get('subTopic', cat['name'])
    
    print(f"Found {len(missing_problems)} problems needing solutions.")
    
    success_count = 0
    total = len(missing_problems)
    
    for i, prob in enumerate(missing_problems):
        slug = prob['slug']
        title = prob['title']
        desc = prob.get('description', title) # Fallback to title if desc missing
        
        print(f"[{i+1}/{total}] Generating solution for: {title} ({slug})...")
        
        try:
            # Generate solution
            # Note: generate_solution_json returns a dict with 'pattern', 'code', etc.
            result = generate_solution_json(title, desc)
            
            if "error" in result:
                print(f"❌ Generation failed for {slug}: {result['error']}")
                continue
                
            # Post-process result to match schema
            # result likely has: pattern, code, intuition, visualizationType, animationSteps, testCases, etc.
            # We need to add 'title', 'slug', 'difficulty', 'link'
            
            full_solution = {
                "id": slug, # or some ID
                "slug": slug,
                "title": title,
                "difficulty": prob['difficulty'],
                "category": category_map.get(slug, "Uncategorized"),
                "problemStatement": desc,
                "videoUrl": "", # AI doesn't know this
                **result # Merge AI fields
            }
            
            # Save to solutions dict
            solutions[slug] = full_solution
            
            # Update problems.json has_solution flag AND description if it was missing
            prob['has_solution'] = True
            
            success_count += 1
            print(f"✅ Success! Saved {slug}.")
            
            # Incremental Save
            solutions_data['solutions'] = solutions
            with open(SOLUTIONS_FILE, 'w') as f:
                json.dump(solutions_data, f, indent=4)
                
            with open(PROBLEMS_FILE, 'w') as f:
                json.dump(problems_data, f, indent=4)
                
        except Exception as e:
            print(f"❌ critical error for {slug}: {e}")
            import traceback
            traceback.print_exc()

        # Rate limit
        time.sleep(1) # Be nice to APIs

    print(f"Completed! Generated {success_count}/{total} solutions.")

if __name__ == "__main__":
    run_generation()
