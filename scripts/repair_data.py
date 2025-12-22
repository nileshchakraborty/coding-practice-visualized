
import json
import os
import sys
import time
import requests
import re

SOLUTIONS_PATH = 'api/data/solutions.json'
AUDIT_LOG_PATH = 'scripts/audit_log.json'
MODEL = "qwen2.5-coder:14b"
API_URL = "http://localhost:11434/api/chat"

def chat_with_ollama(prompt):
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "You are a code generator. Output only raw code. No markdown formatting. No explanation."},
            {"role": "user", "content": prompt}
        ],
        "stream": False
    }
    try:
        resp = requests.post(API_URL, json=payload, timeout=60)
        if resp.status_code == 200:
            return resp.json().get('message', {}).get('content', '')
        else:
            print(f"Ollama Error: {resp.text}")
            return None
    except Exception as e:
        print(f"Ollama Connection Error: {e}")
        return None

def repair():
    if not os.path.exists(AUDIT_LOG_PATH):
        print("Audit log not found.")
        return

    with open(AUDIT_LOG_PATH, 'r') as f:
        log = json.load(f)
    
    with open(SOLUTIONS_PATH, 'r') as f:
        data = json.load(f)

    print(f"Starting repair for {len(log)} problems using model {MODEL}...")
    
    updates = 0
    
    for slug, discrepancies in log.items():
        if slug not in data: continue
        
        problem = data[slug]
        print(f"[{slug}] Fixing {len(discrepancies)} languages...")
        
        for defect in discrepancies:
            lang = defect['lang']
            target_func = defect['expected'] # Valid python name e.g. threeSum
            
            # Additional hint for TS types based on python name?
            # e.g. threeSum -> number[][]
            # isPalindrome -> boolean
            
            prompt = f"""
            Generate the initial code skeleton for LeetCode problem: "{slug}".
            Target Language: {lang}.
            
            The Python signature is:
            def {target_func}(...): pass
            
            Requirements:
            1. Output ONLY the code. No markdown. No comments.
            2. WRAP IT:
               - JS/TS: class Solution {{ method(...) {{ ... }} }}
               - Java/C++: class Solution {{ public Type method(...) {{ ... }} }}
               - Go: type Solution struct {{}} ... func (s *Solution) method(...) Type {{ ... }}
               - Rust: impl Solution {{ pub fn method(...) -> Type {{ ... }} }}
            3. Function name MUST be '{target_func}' (or language equivalent e.g. threeSum, method_name).
            4. Do NOT implement logic. JS/TS: empty body. Typed langs: return default value (0, false, nil).
            5. Use correct types.
            6. For TypeScript, use specific types like number[], string, boolean. Avoid 'any'.
            7. For Go, use 'func (s *Solution)'.
            """
            
            content = chat_with_ollama(prompt)
            
            if content:
                # Cleanup
                content = content.replace('```' + lang, '').replace('```', '').strip()
                
                # Validation check: Does it have the wrapper?
                valid = False
                if lang in ['typescript', 'javascript', 'java', 'cpp']:
                    if 'class Solution' in content: valid = True
                elif lang == 'go':
                    if 'type Solution struct' in content: valid = True
                elif lang == 'rust':
                    if 'impl Solution' in content: valid = True
                
                if valid:
                    if 'implementations' not in problem: problem['implementations'] = {}
                    if lang not in problem['implementations']: problem['implementations'][lang] = {}
                    
                    problem['implementations'][lang]['initialCode'] = content
                    # Reset code to initialCode to remove corrupted logic
                    problem['implementations'][lang]['code'] = content
                    updates += 1
                    print(f"  -> Fixed {lang}")
                else:
                    print(f"  -> Generated invalid code for {lang}. Skipping.\nSample: {content[:100]}...")
            else:
                print(f"  -> Failed to generate {lang}")
            
    # Save
    with open(SOLUTIONS_PATH, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Repaired {updates} language entries.")

if __name__ == "__main__":
    repair()
