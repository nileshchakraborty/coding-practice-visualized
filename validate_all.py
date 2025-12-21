import json
import sys
import os
import os
try:
    from api._lib.runner import execute_code
except ImportError:
    # Fallback if run from root
    import sys
    sys.path.append(os.path.join(os.getcwd(), 'api'))
    from _lib.runner import execute_code

SOLUTIONS_FILE = "data/solutions.json"

def run_full_validation():
    print(f"Loading solutions from {SOLUTIONS_FILE}...")
    if not os.path.exists(SOLUTIONS_FILE):
        print(f"Error: {SOLUTIONS_FILE} not found.")
        sys.exit(1)

    with open(SOLUTIONS_FILE, "r") as f:
        data = json.load(f)
    
    solutions = data.get("solutions", {})
    print(f"Found {len(solutions)} solutions.")

    passed_count = 0
    failed_count = 0
    skipped_count = 0
    
    failed_slugs = []

    for slug, sol in solutions.items():
        # print(f"Testing {slug}...", end="", flush=True)
        
        if "code" not in sol or not sol["code"]:
            # print(" SKIPPED (No code)")
            skipped_count += 1
            continue
            
        test_cases = sol.get("testCases", [])
        if not test_cases:
            # print(" SKIPPED (No test cases)")
            skipped_count += 1
            continue

        # Run execution
        try:
            result = execute_code(sol["code"], test_cases)
            
            if result["success"] and result["passed"]:
                # print(" PASSED")
                passed_count += 1
            else:
                print(f"\n❌ {slug} FAILED")
                # print(f"Full Result: {json.dumps(result, indent=2)}")
                if result.get("error"):
                    print(f"   Error: {result['error']}")
                else:
                    # Print first failed case logic
                    results = result.get("results", [])
                    for r in results:
                        if not r.get("passed"):
                            print(f"   Case {r['case']} Failed: Input: {r.get('input')} | Expected: {r.get('expected')} | Actual: {r.get('actual')} | Error: {r.get('error')}")
                            break
                failed_count += 1
                failed_slugs.append(slug)
        except Exception as e:
            print(f"\n❌ {slug} CRASHED: {e}")
            failed_count += 1
            failed_slugs.append(slug)

    print("\n" + "="*40)
    print("FINAL RESULTS")
    print("="*40)
    print(f"Total: {len(solutions)}")
    print(f"Passed: {passed_count}")
    print(f"Failed: {failed_count}")
    print(f"Skipped: {skipped_count}")
    
    if failed_slugs:
        print("\nFailed Problems:")
        for s in failed_slugs:
            print(f"- {s}")
        sys.exit(1)
    else:
        print("\nAll executable solutions passed!")
        sys.exit(0)

if __name__ == "__main__":
    run_full_validation()
