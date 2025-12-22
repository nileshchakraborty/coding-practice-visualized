
import json

SOLUTIONS_PATH = 'api/data/solutions.json'

# Fields we want to track
FIELDS_TO_CHECK = [
    'title', 'pattern', 'patternEmoji', 'timeComplexity', 'spaceComplexity',
    'oneliner', 'intuition', 'keyInsight', 'mentalModel', 'commonMistakes',
    'interviewTip', 'walkthrough', 'code', 'initialCode', 'bruteForceCode',
    'bruteForceIntuition', 'approaches', 'visualizationType', 'initialState',
    'animationSteps', 'testCases', 'problemStatement', 'description', 'examples',
    'constraints', 'hints', 'relatedProblems', 'videoId', 'suggestedNextQuestion',
    'implementations'
]

def audit():
    with open(SOLUTIONS_PATH, 'r') as f:
        data = json.load(f)

    total = len(data)
    coverage = {field: 0 for field in FIELDS_TO_CHECK}
    
    for slug, problem in data.items():
        for field in FIELDS_TO_CHECK:
            val = problem.get(field)
            if val:
                # Check if non-empty
                if isinstance(val, list):
                    if len(val) > 0:
                        coverage[field] += 1
                elif isinstance(val, dict):
                    if len(val) > 0:
                        coverage[field] += 1
                elif isinstance(val, str):
                    if val.strip():
                        coverage[field] += 1
                else:
                    coverage[field] += 1

    print(f"Total Problems: {total}\n")
    print("Field Coverage:")
    print("-" * 40)
    
    for field in FIELDS_TO_CHECK:
        count = coverage[field]
        pct = (count / total) * 100
        status = "✅" if pct >= 90 else "⚠️" if pct >= 50 else "❌"
        print(f"{status} {field}: {count}/{total} ({pct:.1f}%)")

if __name__ == "__main__":
    audit()
