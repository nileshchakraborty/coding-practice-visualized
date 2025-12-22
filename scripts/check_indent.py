
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
                    if 'class Solution' in code:
                        # Fix triple indentation issues or weird newlines
                        # User issue: 
                        # class Solution {
                        #     /** ... */
                        #     isPalindrome(s) {
                        #         let ...
                        #     }
                        # }
                        # My regex put content directly.
                        # Maybe regex replacement didn't indent the body correctly?
                        
                        # My previous regex:
                        # r'class Solution {\n    /**\n     * @param {any} \2\n     * @return {any}\n     */\n    \1(\2) {'
                        
                        # But the BODY of the function was preserved as is.
                        # If the body was already indented (from standalone function), it stays indented.
                        # Standalone function:
                        # var foo = function() {
                        #     stmt;
                        # }
                        #
                        # Wrapped:
                        # class Solution {
                        #     foo() {
                        #     stmt; 
                        #     }
                        # }
                        # The first line of body `stmt;` has 4 spaces.
                        # Inside class method, it should ideally have 8 spaces?
                        # Or 4 if we dedent?
                        
                        # Let's look at pattern.
                        lines = code.split('\n')
                        params = None
                        
                        # Just naive run: Indent everything inside class by 4 spaces?
                        # No, that's too much.
                        
                        # Re-formatting via Prettier/ESLint would be best but hard here.
                        # Simple Heuristic:
                        # 1. Identify Method Body.
                        # 2. Add extra indentation to body lines.
                         pass 
                        
                        # Wait, user screenshot shows:
                        # class Solution {
                        # /**
                        # * ...
                        # */
                        # isPalindrome(s) {
                        #    let i = ...
                        # }
                        #
                        # The screenshot shows correct nesting visually? 
                        # Only line 1 `/**` started at column 0?
                        # Ah, Step 2761 user msg: "code in solution does not follow spacing correctly".
                        # Screenshot shows:
                        # Line 5: `class Solution {`
                        # Line 6: `    /**` (indent 4)
                        # Line 10: `    isPalindrome(s) {` (indent 4)
                        # Line 11: `        let i = 0;` (indent 8)
                        
                        # Wait, screenshot looks Okay?
                        # Maybe the user means line 1-4 comments are outside?
                        # Or maybe the indentation inside `isPalindrome` is mismatched?
                        
                        # If I look closely at screenshot:
                        # `isPalindrome` body starts with `let i = 0`.
                        # It looks aligned with `isPalindrome`? No, it's indented.
                        
                        # Issue might be:
                        # My wrapper script didn't add indentation to the BODY.
                        # Original code:
                        # function foo() { 
                        #     body
                        # }
                        # Body has 4 spaces.
                        # Wrapped:
                        # class Solution {
                        #     foo() {
                        #     body
                        #     }
                        # }
                        # Body still has 4 spaces. It should have 8.
                        
                        # Fix: Add 4 spaces to every line of the body.
                        
                        # How to detect body lines?
                        # Lines between `{` of method and closing `}` of method.
                        # But finding closing `}` is hard without parser.
                        
                        # Alternative: Just run Prettier on the frontend?
                        # Or just accept it.
                        # User specifically complained.
                        
                        # I can add 4 spaces to all lines EXCEPT:
                        # - line containing `class Solution`
                        # - line containing method definition `funcName(...) {`
                        # - last line `}`
                        # - lines starting with `/**` or `*` or `*/` IF they form the JSDoc above method.
                        
                        # Logic:
                        # Find index of method def.
                        # Find index of last }.
                        # Indent everything in between matching current indent?
                        
                        pass
    
def check_problem():
    with open(SOLUTIONS_PATH, 'r') as f:
        data = json.load(f)
    print(data['valid-palindrome']['implementations']['javascript']['code'])

if __name__ == "__main__":
    check_problem()
