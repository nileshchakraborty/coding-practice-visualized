import json
import re

def validate_quality():
    path = 'api/data/solutions.json'
    with open(path, 'r') as f:
        data = json.load(f)
        
    solutions = data.get('solutions', {})
    
    report = {
        'total': len(solutions),
        'missing_intuition': [],
        'missing_complexity': [],
        'short_code': [],
        'missing_approaches': [],
        'placeholder_text': []
    }
    
    for slug, sol in solutions.items():
        # Check Intuition
        intuition = sol.get('intuition')
        if not intuition or (isinstance(intuition, list) and not intuition) or (isinstance(intuition, str) and len(intuition) < 10):
            report['missing_intuition'].append(slug)
            
        # Check Complexity
        tc = sol.get('timeComplexity')
        sc = sol.get('spaceComplexity')
        if not tc or not sc or '?' in tc or '?' in sc:
            report['missing_complexity'].append(f"{slug} (TC: {tc}, SC: {sc})")
            
        # Check Code Quality (Heuristic: Length)
        code = sol.get('code', '')
        if not code or len(code) < 50:
            report['short_code'].append(slug)
            
        if "pass" in code and len(code) < 60:
             report['placeholder_text'].append(f"{slug} (Contains 'pass')")

        # Check Approaches (if schema supports it)
        # Some solutions might use a top-level 'code' and 'intuition', others might use 'approaches' list.
        # We need to support both or strict check based on expected schema.
        # Assuming current high-quality standard is top-level fields OR approaches list.
        
    print(f"--- Quality Audit Report ({report['total']} Problems) ---")
    
    print(f"\n[MISSING INTUITION] - {len(report['missing_intuition'])}")
    for s in report['missing_intuition'][:10]: print(f"  - {s}")
    if len(report['missing_intuition']) > 10: print("  ... and more")
    
    print(f"\n[MISSING/BAD COMPLEXITY] - {len(report['missing_complexity'])}")
    for s in report['missing_complexity'][:10]: print(f"  - {s}")
    
    print(f"\n[SHORT/SUSPICIOUS CODE] - {len(report['short_code'])}")
    for s in report['short_code'][:10]: print(f"  - {s}")
    
    print(f"\n[PLACEHOLDER TEXT] - {len(report['placeholder_text'])}")
    for s in report['placeholder_text'][:10]: print(f"  - {s}")

    quality_score = 100 
    quality_score -= len(report['missing_intuition']) * 0.5
    quality_score -= len(report['missing_complexity']) * 1
    quality_score -= len(report['short_code']) * 2
    
    print(f"\nEst. Quality Score: {max(0, quality_score):.1f}/100")

if __name__ == "__main__":
    validate_quality()
