import subprocess
import json
import os
import sys

def execute_node_code(code, test_cases):
    """
    Executes the given JavaScript code against the provided test cases using node_runner.js.
    Returns a result dict with passed/failed status and details.
    """
    runner_path = os.path.join(os.path.dirname(__file__), '../../api/_runners/node_runner.js')
    
    if not os.path.exists(runner_path):
        # Fallback for different CWD
        runner_path = os.path.join(os.getcwd(), 'api/_runners/node_runner.js')
        
    input_payload = {
        "code": code,
        "testCases": test_cases
    }
    
    try:
        process = subprocess.run(
            ['node', runner_path],
            input=json.dumps(input_payload),
            capture_output=True,
            text=True,
            timeout=5
        )
        
        stdout = process.stdout
        stderr = process.stderr
        
        if process.returncode != 0:
             return {"success": False, "error": "Node process crashed", "logs": stdout, "stderr": stderr}

        try:
            # Parse last line as JSON result
            lines = stdout.strip().split('\n')
            if not lines:
                 return {"success": False, "error": "No output from runner", "logs": stdout, "stderr": stderr}
            
            result_json = json.loads(lines[-1])
            logs = '\n'.join(lines[:-1])
            
            # Aggregate results
            results = result_json.get("results", [])
            passed = all(r.get("passed", False) for r in results) and len(results) > 0
            
            return {
                "success": True,
                "passed": passed,
                "results": results,
                "logs": logs,
                "error": result_json.get("error")
            }
            
        except json.JSONDecodeError:
             return {"success": False, "error": "Invalid JSON output from Node runner", "logs": stdout, "stderr": stderr}

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Timeout"}
    except Exception as e:
        return {"success": False, "error": str(e)}
