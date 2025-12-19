
import json
import time
import os
from backend import get_adapter

PROBLEMS_FILE = 'data/problems.json'
SOLUTIONS_FILE = 'data/solutions.json'

def run_population():
    adapter = get_adapter()
    print(f"Using AI Provider: {adapter.name}")
    
    with open(PROBLEMS_FILE, 'r') as f:
        problems_data = json.load(f)
        
    with open(SOLUTIONS_FILE, 'r') as f:
        solutions_data = json.load(f)
        solutions = solutions_data.get('solutions', {})
        
    # Find problems with empty description
    targets = []
    
    for cat in problems_data['categories']:
        for prob in cat['problems']:
            if not prob.get('description'):
                targets.append(prob)
                
    total = len(targets)
    print(f"Found {total} problems with missing descriptions.")
    
    count = 0
    for i, prob in enumerate(targets):
        slug = prob['slug']
        title = prob['title']
        
        print(f"[{i+1}/{total}] Fetching description for: {title}...")
        
        prompt = f"""
        Provide the problem description (problem statement) for the LeetCode problem: "{title}".
        Keep it concise but complete. Do not include examples or constraints unless crucial. 
        Just the text.
        """
        
        try:
            response = adapter.generate(prompt)
            desc = response.get('response', '').strip()
            
            if not desc or "error" in response:
                print(f"❌ Failed to get description for {slug}: {response.get('error')}")
                continue
                
            # Update problem
            prob['description'] = desc
            
            # Update solution if exists
            if slug in solutions:
                solutions[slug]['problemStatement'] = desc
                
            count += 1
            print(f"✅ Updated {slug}")
            
            # Incremental save every 5
            if count % 5 == 0:
                with open(PROBLEMS_FILE, 'w') as f:
                    json.dump(problems_data, f, indent=4)
                with open(SOLUTIONS_FILE, 'w') as f:
                    json.dump(solutions_data, f, indent=4)
                    
        except Exception as e:
            print(f"❌ Error for {slug}: {e}")
            
        time.sleep(1) # Rate limit
        
    # Final save
    with open(PROBLEMS_FILE, 'w') as f:
        json.dump(problems_data, f, indent=4)
    with open(SOLUTIONS_FILE, 'w') as f:
        json.dump(solutions_data, f, indent=4)
        
    print(f"Completed! Updated {count} descriptions.")

if __name__ == "__main__":
    run_population()
