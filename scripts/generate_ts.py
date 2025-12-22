
import json
import os
import re

SOLUTIONS_PATH = 'api/data/solutions.json'
MISSING_PATH = 'scripts/missing_ts.json'

TYPE_MAP = {
    'int': 'number',
    'float': 'number',
    'bool': 'boolean',
    'str': 'string',
    'void': 'void',
    'List[int]': 'number[]',
    'List[str]': 'string[]',
    'List[bool]': 'boolean[]',
    'List[List[int]]': 'number[][]',
    'Optional[TreeNode]': 'TreeNode | null',
    'Optional[ListNode]': 'ListNode | null',
    'TreeNode': 'TreeNode | null',
    'ListNode': 'ListNode | null'
}

def generate_ts():
    if not os.path.exists(MISSING_PATH):
        print("Missing slugs file not found.")
        return

    with open(MISSING_PATH, 'r') as f:
        missing_slugs = json.load(f)

    with open(SOLUTIONS_PATH, 'r') as f:
        data = json.load(f)

    generated_count = 0

    for slug in missing_slugs:
        if slug not in data: continue
        
        problem = data[slug]
        
        def extract_sig(source_code):
            if not source_code: return None
            # Regex to match function definition: def names(argstring) -> ret:
            # Handles multi-line args? Simple regex usually sufficient for starter code
            matches = re.finditer(r'def\s+(\w+)\s*\((.*?)\)(?:\s*->\s*([\w\[\], ]+))?:', source_code)
            for m in matches:
                name = m.group(1)
                if name == '__init__': continue
                return m
            return None

        match = extract_sig(problem.get('initialCode', ''))
        if not match:
            # Fallback to solution code
            match = extract_sig(problem.get('code', ''))
        
        if match:
            func_name = match.group(1)
            params_str = match.group(2)
            ret_type_str = match.group(3) if len(match.groups()) > 2 else 'any'

            # Parse params
            params = []
            raw_params = [p.strip() for p in params_str.split(',') if p.strip() and p.strip() != 'self']
            
            ts_params = []
            for p in raw_params:
                if ':' in p:
                    p_name, p_type = p.split(':', 1)
                    p_name = p_name.strip()
                    p_type = p_type.strip()
                    ts_type = TYPE_MAP.get(p_type, 'any')
                    ts_params.append(f"{p_name}: {ts_type}")
                else:
                    ts_params.append(f"{p}: any")

            # Return type
            ts_ret = TYPE_MAP.get(ret_type_str, 'any')
            if not ts_ret: ts_ret = 'any'

            # Construct TS
            ts_code = f"function {func_name}({', '.join(ts_params)}): {ts_ret} {{\n    // Your code here\n}};"

            # Inject (or overwrite)
            if 'implementations' not in problem:
                problem['implementations'] = {}
            
            problem['implementations']['typescript'] = {
                'code': ts_code,
                'initialCode': ts_code
            }
            generated_count += 1
            print(f"Generated TS for {slug}: {func_name}")
        else:
            print(f"Skipping {slug}: No valid signature found.")

    # Save
    with open(SOLUTIONS_PATH, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"Updated solutions.json with {generated_count} TypeScript implementations.")

if __name__ == "__main__":
    generate_ts()
