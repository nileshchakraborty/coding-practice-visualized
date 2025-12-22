
import json
import os
import re

SOLUTIONS_PATH = 'api/data/solutions.json'

def audit():
    if not os.path.exists(SOLUTIONS_PATH):
        print(f"File not found: {SOLUTIONS_PATH}")
        return

    with open(SOLUTIONS_PATH, 'r') as f:
        data = json.load(f)

    mismatches = []
    
    # Heuristic mapping for some known diffs
    # slug: 3sum -> func: threeSum
    # slug: valid-palindrome -> func: isPalindrome
    
    for slug, problem in data.items():
        # Check Python initial code as baseline
        code = problem.get('initialCode', '')
        if not code:
            # Try Python implementation code
            impls = problem.get('implementations', {})
            if 'python' in impls:
                code = impls['python'].get('initialCode', '')
        
        if not code:
            print(f"[WARN] No Python initialCode for {slug}")
            continue

        # Extract func name
        # def funcName(
        match = re.search(r'def\s+(\w+)\s*\(', code)
        if match:
            func_name = match.group(1)
            # Normalize slug: remove -, lower
            norm_slug = slug.replace('-', '').lower()
            norm_func = func_name.lower()
            
            # Check similarity
            # 3sum vs threesum -> close
            # 3sum vs ispalindrome -> different
            
            # Simple check: is one contained in other?
            if norm_slug not in norm_func and norm_func not in norm_slug:
                 # Check edge cases
                 # "reverse-integer" -> "reverse" (ok)
                 # "string-to-integer-atoi" -> "myatoi" (ok)
                 
                 # Heuristic: Levenshtein? Or just manual flagging.
                 mismatches.append(f"{slug} -> {func_name}")
        else:
            print(f"[WARN] Could not find python function in {slug}")

    print(f"Found {len(mismatches)} potential mismatches.")
    for m in mismatches:
        print(m)

if __name__ == "__main__":
    audit()
