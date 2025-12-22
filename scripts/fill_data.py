
import json
import random

SOLUTIONS_PATH = 'api/data/solutions.json'
REPORT_PATH = 'scripts/missing_fields_report.json'

def fix_all():
    with open(SOLUTIONS_PATH, 'r') as f:
        data = json.load(f)
    
    with open(REPORT_PATH, 'r') as f:
        report = json.load(f)
    
    print(f"Loaded {len(data)} problems.")
    
    # Build pattern -> slugs mapping for related problems generation
    pattern_map = {}
    for slug, problem in data.items():
        pattern = problem.get('pattern', '').lower()
        if pattern:
            if pattern not in pattern_map:
                pattern_map[pattern] = []
            pattern_map[pattern].append(slug)
    
    # Build difficulty -> slugs mapping for suggested next question
    difficulty_map = {'Easy': [], 'Medium': [], 'Hard': []}
    for slug, problem in data.items():
        diff = problem.get('difficulty', 'Medium')
        if diff in difficulty_map:
            difficulty_map[diff].append(slug)
    
    fixes = {
        'description': 0,
        'relatedProblems': 0,
        'suggestedNextQuestion': 0,
        'initialState': 0
    }
    
    # 1. Fix missing descriptions
    for slug in report.get('description', []):
        if slug in data:
            # Copy from problemStatement if available
            ps = data[slug].get('problemStatement', '')
            if ps:
                data[slug]['description'] = ps
                fixes['description'] += 1
            else:
                # Use title + oneliner as fallback
                title = data[slug].get('title', slug)
                oneliner = data[slug].get('oneliner', '')
                data[slug]['description'] = f"{title}. {oneliner}"
                fixes['description'] += 1
    
    # 2. Fix missing relatedProblems
    for slug in report.get('relatedProblems', []):
        if slug in data:
            pattern = data[slug].get('pattern', '').lower()
            if pattern and pattern in pattern_map:
                # Get up to 3 related problems with same pattern (excluding self)
                candidates = [s for s in pattern_map[pattern] if s != slug]
                related = random.sample(candidates, min(3, len(candidates)))
                data[slug]['relatedProblems'] = related
                fixes['relatedProblems'] += 1
            else:
                # Fallback: random 3 problems from same difficulty
                diff = data[slug].get('difficulty', 'Medium')
                candidates = [s for s in difficulty_map.get(diff, []) if s != slug]
                related = random.sample(candidates, min(3, len(candidates)))
                data[slug]['relatedProblems'] = related
                fixes['relatedProblems'] += 1
    
    # 3. Fix missing suggestedNextQuestion
    next_diff = {'Easy': ['Easy', 'Medium'], 'Medium': ['Medium', 'Hard'], 'Hard': ['Hard', 'Medium']}
    
    for slug in report.get('suggestedNextQuestion', []):
        if slug in data:
            pattern = data[slug].get('pattern', '').lower()
            diff = data[slug].get('difficulty', 'Medium')
            
            # Find a related problem with same pattern but different slug
            candidates = []
            if pattern and pattern in pattern_map:
                for d in next_diff.get(diff, ['Medium']):
                    for s in pattern_map[pattern]:
                        if s != slug and data[s].get('difficulty') == d:
                            candidates.append(s)
            
            # Fallback to same difficulty if no pattern match
            if not candidates:
                for d in next_diff.get(diff, ['Medium']):
                    candidates.extend([s for s in difficulty_map.get(d, []) if s != slug])
            
            if candidates:
                next_slug = random.choice(candidates[:10])
                next_problem = data[next_slug]
                data[slug]['suggestedNextQuestion'] = {
                    'slug': next_slug,
                    'title': next_problem.get('title', next_slug),
                    'difficulty': next_problem.get('difficulty', 'Medium'),
                    'pattern': next_problem.get('pattern', 'Unknown')
                }
                fixes['suggestedNextQuestion'] += 1
    
    # 4. Fix min-stack initialState
    if 'min-stack' in data and not data['min-stack'].get('initialState'):
        data['min-stack']['initialState'] = []
        fixes['initialState'] += 1
    
    # Save
    with open(SOLUTIONS_PATH, 'w') as f:
        json.dump(data, f, indent=2)
    
    print("\n=== FIX REPORT ===")
    for field, count in fixes.items():
        print(f"{field}: {count} fixed")
    print("\nDone! Re-run audit to verify.")

if __name__ == "__main__":
    fix_all()
