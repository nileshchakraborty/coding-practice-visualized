
import json
import os
import re

SOLUTIONS_PATH = 'api/data/solutions.json'

def migrate():
    if not os.path.exists(SOLUTIONS_PATH):
        print(f"File not found: {SOLUTIONS_PATH}")
        return

    with open(SOLUTIONS_PATH, 'r') as f:
        data = json.load(f)

    count_js = 0
    count_ts = 0
    count_go = 0

    for slug, problem in data.items():
        impls = problem.get('implementations', {})
        
        # --- JavaScript ---
        if 'javascript' in impls:
            js = impls['javascript']
            code = js.get('code', '')
            if code and 'class Solution' not in code:
                # Naive wrapper: wrap valid function in method
                # Try to preserve JSDoc?
                # Regex match for function:
                # var name = function(args) { body }
                # function name(args) { body }
                # We can't easily parse body with regex.
                
                # Simpler approach:
                # Detect signature line.
                # Replace with class wrapper start.
                # Append } at end.
                
                # var removeElement = function(nums, val) {
                match = re.search(r'(?:var|let|const|function)\s+(\w+)\s*=?\s*function\s*\((.*?)\)', code)
                if not match:
                    match = re.search(r'function\s+(\w+)\s*\((.*?)\)', code)
                
                if match:
                    count_js += 1
                    func_name = match.group(1)
                    params = match.group(2)
                    
                    # Indent body? Too hard to perfect indentation without parser.
                    # Just wrap.
                    
                    # Logic:
                    # 1. Strip original signature line.
                    # 2. Extract comments above it?
                    
                    # Let's try to reconstruct.
                    # For initialCode, it's safer.
                    # For full code, same.
                    
                    # Better Strategy:
                    # Replace `var func = function(args) {` with `class Solution {\n    func(args) {`
                    # And append `}` at end.
                    
                    def wrap_js(c):
                        if 'class Solution' in c: return c
                        
                        # Handle var func = function...
                        c = re.sub(r'(?:var|let|const)\s+(\w+)\s*=\s*function\s*\((.*?)\)\s*{', 
                                   r'class Solution {\n    /**\n     * @param {any} \2\n     * @return {any}\n     */\n    \1(\2) {', c, count=1)
                        
                        # Handle function func...
                        c = re.sub(r'function\s+(\w+)\s*\((.*?)\)\s*{', 
                                   r'class Solution {\n    /**\n     * @param {any} \2\n     * @return {any}\n     */\n    \1(\2) {', c, count=1)
                        
                        if 'class Solution' in c:
                            return c + "\n}"
                        return c

                    js['code'] = wrap_js(js.get('code', ''))
                    js['initialCode'] = wrap_js(js.get('initialCode', ''))

        # --- TypeScript ---
        if 'typescript' in impls:
            ts = impls['typescript']
            code = ts.get('code', '')
            if code and 'class Solution' not in code:
                count_ts += 1
                def wrap_ts(c):
                    if 'class Solution' in c: return c
                    # function func(args): ret {
                    c = re.sub(r'function\s+(\w+)\s*\((.*?)\)(\s*:\s*[\w\[\]\s|]+)?\s*{',
                               r'class Solution {\n    \1(\2)\3 {', c, count=1)
                    if 'class Solution' in c:
                        return c + "\n}"
                    return c

                ts['code'] = wrap_ts(ts.get('code', ''))
                ts['initialCode'] = wrap_ts(ts.get('initialCode', ''))

        # --- Go ---
        if 'go' in impls:
            go = impls['go']
            code = go.get('code', '')
            if code and 'type Solution struct' not in code:
                count_go += 1
                def wrap_go(c):
                    if 'type Solution struct' in c: return c
                    # func funcName(...) ... {
                    # Replace with func (s *Solution) funcName(...) ... {
                    # Prepend type Solution struct {}
                    
                    # Note: Import block might be at top. We shouldn't put struct before imports?
                    # But GoRunner moves package/imports anyway.
                    # It's safer to put type Solution struct {} before the function.
                    
                    signature = re.search(r'func\s+(\w+)\s*\(', c)
                    if signature:
                        func_name = signature.group(1)
                        c = c.replace(f"func {func_name}", f"func (s *Solution) {func_name}", 1)
                        return "type Solution struct {}\n\n" + c
                    return c

                go['code'] = wrap_go(go.get('code', ''))
                go['initialCode'] = wrap_go(go.get('initialCode', ''))

    with open(SOLUTIONS_PATH, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"Migrated: JS={count_js}, TS={count_ts}, Go={count_go}")

if __name__ == "__main__":
    migrate()
