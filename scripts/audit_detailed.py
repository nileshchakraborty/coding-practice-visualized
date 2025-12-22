
import json

SOLUTIONS_PATH = 'api/data/solutions.json'

# All fields we want 100% coverage for
REQUIRED_FIELDS = [
    'title', 'pattern', 'patternEmoji', 'timeComplexity', 'spaceComplexity',
    'oneliner', 'intuition', 'keyInsight', 'mentalModel', 'commonMistakes',
    'interviewTip', 'walkthrough', 'code', 'initialCode', 'approaches',
    'visualizationType', 'initialState', 'animationSteps', 'testCases',
    'problemStatement', 'description', 'examples', 'constraints', 'hints',
    'relatedProblems', 'videoId', 'suggestedNextQuestion', 'implementations'
]

def audit_detailed():
    with open(SOLUTIONS_PATH, 'r') as f:
        data = json.load(f)

    total = len(data)
    missing_report = {field: [] for field in REQUIRED_FIELDS}
    
    for slug, problem in data.items():
        for field in REQUIRED_FIELDS:
            val = problem.get(field)
            is_missing = False
            
            if val is None:
                is_missing = True
            elif isinstance(val, list) and len(val) == 0:
                is_missing = True
            elif isinstance(val, dict) and len(val) == 0:
                is_missing = True
            elif isinstance(val, str) and not val.strip():
                is_missing = True
            
            if is_missing:
                missing_report[field].append(slug)

    print(f"Total Problems: {total}\n")
    print("=" * 60)
    print("DETAILED MISSING FIELDS REPORT")
    print("=" * 60)
    
    # Sort by most missing
    sorted_fields = sorted(missing_report.items(), key=lambda x: len(x[1]), reverse=True)
    
    for field, slugs in sorted_fields:
        count = len(slugs)
        pct = ((total - count) / total) * 100
        status = "✅" if count == 0 else "⚠️" if count < 25 else "❌"
        print(f"\n{status} {field}: {total - count}/{total} ({pct:.1f}%)")
        if slugs and count <= 20:
            print(f"   Missing in: {', '.join(slugs[:10])}")
            if len(slugs) > 10:
                print(f"   ... and {len(slugs) - 10} more")
        elif slugs:
            print(f"   Missing in {count} problems")

    # Save detailed report
    with open('scripts/missing_fields_report.json', 'w') as f:
        json.dump({k: v for k, v in missing_report.items() if v}, f, indent=2)
    
    print(f"\n\nDetailed report saved to scripts/missing_fields_report.json")

if __name__ == "__main__":
    audit_detailed()
