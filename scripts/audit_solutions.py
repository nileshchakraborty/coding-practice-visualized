
import json
import os

SOLUTIONS_PATH = 'api/data/solutions.json'

def audit():
    if not os.path.exists(SOLUTIONS_PATH):
        print(f"File not found: {SOLUTIONS_PATH}")
        return

    with open(SOLUTIONS_PATH, 'r') as f:
        data = json.load(f)

    total = len(data)
    has_python_code = 0
    has_python_initial = 0
    has_js = 0
    has_ts = 0
    has_java = 0
    has_go = 0
    has_rust = 0
    has_cpp = 0
    
    missing_initial = []

    print(f"Auditing {total} problems...")

    for slug, problem in data.items():
        if problem.get('code'):
            has_python_code += 1
        
        if problem.get('initialCode'):
            has_python_initial += 1
        else:
            missing_initial.append(slug)
        
        impls = problem.get('implementations', {})
        if impls.get('javascript'): has_js += 1
        if impls.get('typescript'): has_ts += 1
        if impls.get('java'): has_java += 1
        if impls.get('go'): has_go += 1
        if impls.get('rust'): has_rust += 1
        if impls.get('cpp'): has_cpp += 1

    print("-" * 40)
    print(f"Total Problems: {total}")
    print(f"Python Solutions: {has_python_code} ({(has_python_code/total)*100:.1f}%)")
    print(f"JavaScript: {has_js} ({(has_js/total)*100:.1f}%)")
    print(f"TypeScript: {has_ts} ({(has_ts/total)*100:.1f}%)")
    print(f"Java: {has_java} ({(has_java/total)*100:.1f}%)")
    print(f"Go: {has_go} ({(has_go/total)*100:.1f}%)")
    print(f"Rust: {has_rust} ({(has_rust/total)*100:.1f}%)")
    print(f"C++: {has_cpp} ({(has_cpp/total)*100:.1f}%)")
    print("-" * 40)

    if missing_initial:
        print(f"Problems missing Initial Code ({len(missing_initial)}):")
        print(", ".join(missing_initial[:10]) + ("..." if len(missing_initial)>10 else ""))

if __name__ == "__main__":
    audit()
