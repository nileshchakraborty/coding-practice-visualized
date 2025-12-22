
import json
import os
import re

SOLUTIONS_PATH = 'api/data/solutions.json'

def normalize():
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
                    
                    lines = code.split('\n')
                    
                    # 1. Identify Method Start
                    method_start_idx = -1
                    method_indent = 4 # Default expectation
                    
                    for i, l in enumerate(lines):
                        # Regex for method decl: indent + name(...) {
                        # Ignore JSDoc
                        if re.match(r'^\s*\w+\(.*\)\s*{$', l) and 'class Solution' not in l:
                            method_start_idx = i
                            # Count indent
                            stripped = l.lstrip()
                            method_indent = len(l) - len(stripped)
                            break
                    
                    # 2. Identify Method End
                    # Reverse search for last `}` or `};`
                    method_end_idx = -1
                    for i in range(len(lines)-1, -1, -1):
                        l = lines[i].strip()
                        if (l == '}' or l == '};') and i != len(lines) - 1:
                            method_end_idx = i
                            break
                    
                    if method_start_idx != -1 and method_end_idx != -1:
                        # 3. Analyze Body Indentation via First Line
                        body_lines = lines[method_start_idx+1 : method_end_idx]
                        first_indent = -1
                        for l in body_lines:
                             if l.strip():
                                 stripped = l.lstrip()
                                 first_indent = len(l) - len(stripped)
                                 break
                        
                        if first_indent == -1:
                             continue # Empty body
                        
                        target_indent = method_indent + 4
                        
                        # 4. Dedent or Indent
                        shift = first_indent - target_indent
                        
                        if shift != 0:
                            # Apply shift
                            for k in range(method_start_idx+1, method_end_idx):
                                if lines[k].strip():
                                    if shift > 0:
                                        # Dedent
                                        lines[k] = lines[k][shift:]
                                    else:
                                        # Indent (rare case if negative)
                                        lines[k] = (' ' * abs(shift)) + lines[k]
                        
                        # 5. Fix Method End Indent
                        # Should be same as method_indent
                        end_line = lines[method_end_idx].lstrip().replace(';', '') 
                        # Remove trailing semicolon on method end
                        lines[method_end_idx] = (' ' * method_indent) + end_line
                        
                        # 6. Ensure Class End is 0 indent?
                        # Usually it is.
                        
                        obj[key] = '\n'.join(lines)
                        count += 1

    with open(SOLUTIONS_PATH, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Normalized indentation for {count} snippets.")

if __name__ == "__main__":
    normalize()
