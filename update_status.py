
import json

PROBLEMS_FILE = 'data/problems.json'
TARGET_SLUG = 'permutation-in-string'

def update_status():
    with open(PROBLEMS_FILE, 'r') as f:
        data = json.load(f)
        
    found = False
    for cat in data['categories']:
        for prob in cat['problems']:
            if prob['slug'] == TARGET_SLUG:
                prob['has_solution'] = True
                found = True
                break
        if found: break
        
    if found:
        with open(PROBLEMS_FILE, 'w') as f:
            json.dump(data, f, indent=4)
        print(f"Updated {TARGET_SLUG} has_solution=True")
    else:
        print("Slug not found")

if __name__ == "__main__":
    update_status()
