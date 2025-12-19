
import json
import sys

PROBLEMS_FILE = 'data/problems.json'
SOLUTIONS_FILE = 'data/solutions.json'

def validate():
    print("Starting Deep Validation...")
    errors = 0
    fixed = 0
    
    try:
        with open(PROBLEMS_FILE, 'r') as f:
            problems_data = json.load(f)
        with open(SOLUTIONS_FILE, 'r') as f:
            solutions_data = json.load(f)
            solutions = solutions_data.get('solutions', {})
    except Exception as e:
        print(f"❌ Critical Error loading JSON files: {e}")
        return

    problem_map = {}
    total_problems = 0
    
    # 1. Validate Problems Structure
    for cat in problems_data['categories']:
        for prob in cat['problems']:
            total_problems += 1
            slug = prob.get('slug')
            if not slug:
                print(f"❌ Problem missing slug: {prob}")
                errors += 1
                continue
            
            problem_map[slug] = prob
            
            # Check description in problems.json
            if not prob.get('description'):
                print(f"❌ Missing description in problems.json for {slug}")
                errors += 1
                # Could fix here if we had logic, but report for now
            
    print(f"✅ Loaded {total_problems} problems from problems.json")
    
    # 2. Validate Solutions Coverage
    solution_keys = set(solutions.keys())
    problem_keys = set(problem_map.keys())
    
    # Missing solutions
    missing_solutions = problem_keys - solution_keys
    if missing_solutions:
        print(f"❌ {len(missing_solutions)} missing entries in solutions.json: {list(missing_solutions)[:5]}...")
        errors += len(missing_solutions)
    
    # Orphan solutions (not in problems.json - usually ok but worth noting)
    orphans = solution_keys - problem_keys
    if orphans:
        print(f"⚠️ {len(orphans)} orphan solutions (not in problem list): {list(orphans)[:5]}...")
        
    # 3. Validate Solution Integrity
    for slug in problem_keys:
        if slug not in solutions:
            continue
            
        sol = solutions[slug]
        
        # Check required fields
        if not sol.get('code') or len(sol['code']) < 10:
            print(f"❌ Invalid/Short code for {slug}")
            errors += 1
            
        if not sol.get('problemStatement') or len(sol['problemStatement']) < 10:
            print(f"❌ Invalid/Short problemStatement for {slug}")
            # Fix if possible
            if problem_map[slug].get('description'):
                print(f"   🛠️  Fixing {slug} statement from problems.json...")
                sol['problemStatement'] = problem_map[slug]['description']
                fixed += 1
            else:
                errors += 1
                
        # Check metadata consistency
        if sol.get('title') != problem_map[slug].get('title'):
            print(f"⚠️ Title Mismatch: {slug} ('{sol.get('title')}' vs '{problem_map[slug].get('title')}')")
            # Loose warning
            
    if fixed > 0:
        print(f"💾 Saving {fixed} automatic fixes to solutions.json...")
        solutions_data['solutions'] = solutions
        with open(SOLUTIONS_FILE, 'w') as f:
            json.dump(solutions_data, f, indent=4)
            
    print("-" * 30)
    print(f"Validation Complete.")
    print(f"Total Problems: {total_problems}")
    print(f"Coverage: {len(solutions)}/{total_problems}")
    print(f"Errors Found: {errors}")
    print(f"Fixed: {fixed}")
    
    if errors == 0:
        print("✅ ALL SYSTEMS GO. Data Integrity Verified.")
    else:
        print("❌ INTEGRITY ISSUES DETECTED.")

if __name__ == "__main__":
    validate()
