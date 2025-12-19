
import json

with open('data/solutions.json', 'r') as f:
    data = json.load(f)

count = 0
for slug, sol in data['solutions'].items():
    # Only migrate if steps exist but animationSteps doesn't
    if 'steps' in sol and sol['steps'] and ('animationSteps' not in sol or not sol['animationSteps']):
        sol['animationSteps'] = sol['steps']
        count += 1
        
print(f"Migrated steps to animationSteps for {count} solutions.")

with open('data/solutions.json', 'w') as f:
    json.dump(data, f, indent=4)
