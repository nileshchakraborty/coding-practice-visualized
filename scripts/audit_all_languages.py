
import json
import os
import re

SOLUTIONS_PATH = 'api/data/solutions.json'

def audit_all():
    if not os.path.exists(SOLUTIONS_PATH):
        print(f"File not found: {SOLUTIONS_PATH}")
        return

    with open(SOLUTIONS_PATH, 'r') as f:
        data = json.load(f)

    corrupted_log = {} # slug -> list of corrupted langs

    for slug, problem in data.items():
        root_code = problem.get('initialCode', '')
        if not root_code:
            continue
            
        root_match = re.search(r'def\s+(\w+)\s*\(', root_code)
        if not root_match:
            continue
        root_func = root_match.group(1)
        
        # Normalize root func (e.g. threeSum -> threesum)
        norm_root = root_func.lower().replace('_', '')
        
        impls = problem.get('implementations', {})
        
        for lang in ['java', 'cpp', 'go', 'rust', 'typescript', 'javascript']:
            if lang in impls:
                obj = impls[lang]
                # Check initialCode first, then code
                code = obj.get('initialCode', '') or obj.get('code', '')
                if not code:
                    continue
                
                # Extract func name based on lang
                func_name = None
                
                if lang in ['java', 'cpp', 'javascript', 'typescript']:
                    # class Solution { funcName(...)
                    # or JS function funcName(...)
                    # Search for standard methods
                    match = re.search(r'(?:public\s+|int\s+|void\s+|bool\s+|def\s+)?(\w+)\s*\(', code)
                    # Skip common keywords
                    if match:
                        name = match.group(1)
                        if name not in ['class', 'public', 'private', 'protected', 'func', 'function', 'var', 'let', 'const', 'type', 'impl']:
                            func_name = name
                            
                    # Refined regex for methods inside class
                    # \s+(\w+)\(
                    # But often match class keywords.
                    
                    # Heuristic: Look for the function that IS NOT the class or constructor
                    lines = code.split('\n')
                    for line in lines:
                        if 'class Solution' in line: continue
                        if 'struct' in line: continue
                        if 'impl Solution' in line: continue
                        
                        # Rust: pub fn name(
                        if lang == 'rust':
                            m = re.search(r'pub\s+fn\s+(\w+)\s*\(', line)
                            if m: 
                                func_name = m.group(1)
                                break
                        
                        # Go: func (s *Solution) name(
                        if lang == 'go':
                            m = re.search(r'func\s+\(.*\)\s+(\w+)\s*\(', line)
                            if m:
                                func_name = m.group(1)
                                break
                        
                        # Java/C++/TS/JS: name(...) {
                        # Ignore 'if', 'while', 'for', 'switch'
                        if lang in ['java', 'cpp', 'typescript', 'javascript']:
                             # Look for method definition
                             # (public )? (static )? (Type )? name (args) {
                             m = re.search(r'(?:\w+\s+)*(\w+)\s*\(.*\)\s*{', line)
                             if m:
                                 name = m.group(1)
                                 if name not in ['if', 'while', 'for', 'switch', 'catch', 'constructor', 'Solution', 'function']:
                                     func_name = name
                                     break

                if func_name:
                    norm_func = func_name.lower().replace('_', '')
                    
                    # Comparison
                    # Allow slight diffs? e.g. snake_case vs camelCase is handled by normalization.
                    # 3sum vs threeSum:
                    # norm_root = threesum
                    # norm_func (from 3sum) = threesum? No, root is `threeSum`.
                    
                    # If mismatch:
                    if norm_root != norm_func:
                         # Whitelist some known OK mappings if needed
                         # But 'isPalindrome' != 'threeSum' -> Flag it.
                         
                         if slug not in corrupted_log:
                             corrupted_log[slug] = []
                         corrupted_log[slug].append({
                             'lang': lang,
                             'found': func_name,
                             'expected': root_func
                         })

    print(f"Found corrupted data in {len(corrupted_log)} problems.")
    
    # Dump detailed log
    with open('scripts/audit_log.json', 'w') as f:
        json.dump(corrupted_log, f, indent=2)

if __name__ == "__main__":
    audit_all()
