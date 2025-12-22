
import json
import os
import re

SOLUTIONS_PATH = 'api/data/solutions.json'

def fix_indent():
    if not os.path.exists(SOLUTIONS_PATH):
        print(f"File not found: {SOLUTIONS_PATH}")
        return

    with open(SOLUTIONS_PATH, 'r') as f:
        data = json.load(f)

    count = 0
    for slug, problem in data.items():
        impls = problem.get('implementations', {})
        
        for lang in ['javascript', 'typescript']:
            if lang in impls:
                obj = impls[lang]
                for key in ['code', 'initialCode']:
                    code = obj.get(key, '')
                    if not code or 'class Solution' not in code:
                        continue
                    
                    current_lines = code.split('\n')
                    
                    # Search for method header line index
                    header_idx = -1
                    for idx, l in enumerate(current_lines):
                         # Regex for: indent? methodName(...) {
                         if re.match(r'^\s*\w+\(.*\)\s*{$', l) and 'class Solution' not in l:
                             header_idx = idx
                             break
                    
                    # Search for method closing brace (second to last usually, or before class end)
                    # We assume single method wrapper
                    method_end_idx = -1
                    for idx in range(len(current_lines)-1, -1, -1):
                        l = current_lines[idx].strip()
                        if l == '}' or l == '};':
                            # If it's the class ending brace, skip
                            # Class end is usually just `}`, but ensure it's the LAST one.
                            if idx == len(current_lines) - 1:
                                continue
                            if idx < header_idx: continue # Impossible
                            method_end_idx = idx
                            break
                    
                    if header_idx != -1 and method_end_idx != -1:
                        # Indent body
                        for k in range(header_idx+1, method_end_idx):
                             if current_lines[k].strip(): 
                                 current_lines[k] = '    ' + current_lines[k]
                        
                        # Indent method closing brace to 4 spaces
                        end_line = current_lines[method_end_idx]
                        if len(end_line) - len(end_line.lstrip()) < 4:
                            current_lines[method_end_idx] = '    ' + end_line.lstrip()
                                 
                        obj[key] = '\n'.join(current_lines)
                        count += 1

    with open(SOLUTIONS_PATH, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Fixed indentation for {count} snippets.")

if __name__ == "__main__":
    fix_indent()
