
import json
import os
import re

SOLUTIONS_PATH = 'api/data/solutions.json'

def sync_signatures():
    with open(SOLUTIONS_PATH, 'r') as f:
        data = json.load(f)

    updates = 0
    
    for slug, problem in data.items():
        impls = problem.get('implementations', {})
        
        for lang, obj in impls.items():
            code = obj.get('code', '')
            initial = obj.get('initialCode', '')
            
            if not code: continue
            
            # Logic: Parse signature from CODE
            # Then reconstruct INITIAL CODE using that signature + empty body.
            
            new_initial = None
            
            if lang in ['typescript', 'javascript', 'java', 'cpp']:
                # Pattern: capture everything up to the opening brace of the method
                # class Solution {
                #     method(...) {
                
                # We need to find the method definition inside the class.
                # Heuristic: split by lines. Find the line with method def.
                
                lines = code.split('\n')
                class_decl = None
                method_decl = None
                
                for line in lines:
                    if 'class Solution' in line:
                        class_decl = line
                    elif 'struct Solution' in line: # C++ struct? usually class.
                        class_decl = line
                    elif method_decl is None:
                        # Find method line
                        # Exclude comments, imports, empty lines
                        stripped = line.strip()
                        if not stripped: continue
                        if stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*'): continue
                        if stripped.startswith('import') or stripped.startswith('package') or stripped.startswith('#include') or stripped.startswith('using'): continue
                        if 'class Solution' in line: continue
                        if line.strip() == '}': continue # block end
                        
                        # Check if line ends with {
                        if '{' in line:
                            # Candidate for method
                            # Check keywords
                            if lang == 'typescript' or lang == 'javascript':
                                if '(' in line:
                                    method_decl = line.split('{')[0].rstrip()
                            elif lang == 'java' or lang == 'cpp':
                                if '(' in line:
                                     # Avoid constructor 'Solution()'
                                     if 'Solution(' not in line:
                                         method_decl = line.split('{')[0].rstrip()
                
                if class_decl and method_decl:
                    # Reconstruct
                    # class Solution {
                    #     method(...) {
                    #         // ...
                    #         return ...;
                    #     }
                    # }
                    
                    # Determine default return
                    ret_stmt = "return;" # Void default
                    lower_decl = method_decl.lower()
                    
                    if lang == 'typescript':
                        if ': number' in method_decl: ret_stmt = "return 0;"
                        if ': boolean' in method_decl: ret_stmt = "return false;"
                        if ': string' in method_decl: ret_stmt = 'return "";'
                        if '[]' in method_decl or 'Array' in method_decl: ret_stmt = "return [];"
                        if ': void' in method_decl: ret_stmt = ""
                        
                    elif lang in ['java', 'cpp']:
                        if 'int ' in method_decl: ret_stmt = "return 0;"
                        if 'boolean ' in method_decl or 'bool ' in method_decl: ret_stmt = "return false;"
                        if 'void ' in method_decl: ret_stmt = ""
                        if 'String ' in method_decl or 'string ' in method_decl: ret_stmt = 'return "";'
                        if 'List' in method_decl or 'vector' in method_decl: ret_stmt = "return {};" if lang == 'cpp' else "return new ArrayList<>();"
                        if 'ListNode' in method_decl: ret_stmt = "return null;" if lang == 'java' else "return nullptr;"
                        if 'TreeNode' in method_decl: ret_stmt = "return null;" if lang == 'java' else "return nullptr;"
                        
                    
                    new_initial = f"{class_decl}\n{method_decl} {{\n        // Your code here\n        {ret_stmt}\n    }}\n}}"
                    
            elif lang == 'go':
                # type Solution struct {}
                # func (s *Solution) Method(...) Type {
                
                if 'func (s *Solution)' in code:
                    # Extract func line
                    match = re.search(r'func\s+\(s\s+\*Solution\)\s+(.*?)\s*{', code, re.DOTALL)
                    if match:
                        func_sig = match.group(1).strip() # Name(args) Type
                        # Construct
                        # type Solution struct {}
                        # func (s *Solution) Name(args) Type {
                        #     return ...
                        # }
                        
                        ret_stmt = "return"
                        # Go parsing for return type is tricky 'func ... (type) {' or 'func ... type {'
                        # Just output valid skeleton
                        
                        new_initial = f"type Solution struct {{}}\n\nfunc (s *Solution) {func_sig} {{\n    // Your code here\n    {ret_stmt}\n}}"

            elif lang == 'rust':
                # impl Solution {
                #     pub fn name(...) -> Type {
                
                match = re.search(r'pub\s+fn\s+(.*?)\s*{', code)
                if match:
                    sig = match.group(1).strip() # name(...) -> Type
                    
                    # Determine return
                    ret_val = "Default::default()"
                    
                    new_initial = f"impl Solution {{\n    pub fn {sig} {{\n        // Your code here\n        {ret_val}\n    }}\n}}"

            if new_initial:
                # Basic cleanup
                new_initial = new_initial.replace('\n        \n', '\n')
                
                # Check if meaningfully different (ignoring verify indent diffs)
                # But actually checking if it fixes types
                
                obj['initialCode'] = new_initial
                updates += 1
                
    with open(SOLUTIONS_PATH, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"Synced {updates} implementations.")

if __name__ == "__main__":
    sync_signatures()
