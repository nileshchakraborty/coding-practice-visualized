import sys
import json
import os

# Ensure we can import lib.runner
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

try:
    from lib import runner
except ImportError as e:
    # Fallback if running from a different cwd
    parent = os.path.dirname(current_dir)
    sys.path.append(parent)
    try:
        from api.lib import runner
    except ImportError:
        print(json.dumps({"error": f"Could not import runner: {e}"}))
        sys.exit(1)

def main():
    try:
        # Read JSON from stdin
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input provided"}))
            return

        body = json.loads(input_data)
        code = body.get('code')
        test_cases = body.get('testCases')

        if not code:
            print(json.dumps({"error": "Missing code"}))
            return

        # Execute
        result = runner.execute_code(code, test_cases)
        
        # Print result to stdout
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
