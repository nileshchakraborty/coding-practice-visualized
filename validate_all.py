import json
import sys
import os
import shutil

# Add api to path
try:
    from api._lib.runner import execute_code as execute_python
except ImportError:
    sys.path.append(os.path.join(os.getcwd(), 'api'))
    from _lib.runner import execute_code as execute_python

from api._lib.node_runner_wrapper import execute_node_code

SOLUTIONS_FILE = "data/solutions.json"

def run_full_validation():
    print(f"Loading solutions from {SOLUTIONS_FILE}...")
    if not os.path.exists(SOLUTIONS_FILE):
        print(f"Error: {SOLUTIONS_FILE} not found.")
        sys.exit(1)

    with open(SOLUTIONS_FILE, "r") as f:
        data = json.load(f)
    
    solutions = data.get("solutions", {})
    print(f"Found {len(solutions)} problems.")

    total_tests = 0
    passed_tests = 0
    failed_tests = 0
    
    failed_details = []

    for slug, sol in solutions.items():
        # Get implementations map
        implementations = sol.get("implementations", {})
        
        # Backward compatibility: Check root "code" if implementations empty
        if not implementations and sol.get("code"):
            implementations = {"python": sol["code"]}

        if not implementations:
            # print(f"SKIPPED {slug} (No implementations)")
            continue

        test_cases = sol.get("testCases", [])
        if not test_cases:
            continue

        for lang, code in implementations.items():
            if not code: continue
            
            total_tests += 1
            
            try:
                result = None
                if lang == 'python':
                    result = execute_python(code, test_cases)
                elif lang in ['javascript', 'typescript']:
                    result = execute_node_code(code, test_cases)
                else:
                    print(f"Testing {slug} [{lang}]...", end="", flush=True)
                    continue

                if result and result["success"] and result["passed"]:
                    print(" PASSED")
                    passed_tests += 1
                else:
                    print(f"\n❌ {slug} [{lang}] FAILED")
                    if result:
                         if result.get("error"):
                             print(f"   Error: {result['error']}")
                         else:
                             # Print first failed case logic
                             case_results = result.get("results", [])
                             for r in case_results:
                                 if not r.get("passed"):
                                     print(f"   Case {r.get('case')} Failed: Input: {r.get('input')} | Expected: {r.get('expected')} | Actual: {r.get('actual')} | Error: {r.get('error')}")
                                     break
                    failed_tests += 1
                    failed_details.append(f"{slug} ({lang})")

            except Exception as e:
                print(f"\n❌ {slug} [{lang}] CRASHED: {e}")
                failed_tests += 1
                failed_details.append(f"{slug} ({lang})")

    print("\n" + "="*40)
    print("FINAL RESULTS")
    print("="*40)
    print(f"Total Implementation Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {failed_tests}")
    
    if failed_details:
        print("\nFailed Implementations:")
        for s in failed_details:
            print(f"- {s}")
        sys.exit(1)
    else:
        print("\nAll implementations passed!")
        sys.exit(0)

if __name__ == "__main__":
    run_full_validation()
