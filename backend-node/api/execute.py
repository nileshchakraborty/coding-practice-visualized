from http.server import BaseHTTPRequestHandler
import json
import re
import sys
import io
import traceback

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Handle POST request for code execution."""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            code = data.get('code', '')
            test_cases = data.get('testCases', [])
            
            result = self.execute_code(code, test_cases)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }).encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def execute_code(self, code: str, test_cases: list) -> dict:
        """Execute Python code against test cases."""
        results = []
        all_passed = True
        logs = io.StringIO()
        
        # Create execution namespace
        namespace = {}
        
        try:
            # Execute user code
            exec(code, namespace)
            
            # Find solution function
            solution_func = None
            for name, obj in namespace.items():
                if callable(obj) and not name.startswith('_'):
                    solution_func = obj
                    break
            
            if not solution_func:
                return {
                    'success': False,
                    'error': 'No solution function found'
                }
            
            for i, test in enumerate(test_cases):
                try:
                    # Parse input
                    local_scope = {}
                    input_str = test.get('input', '')
                    
                    # Fix comma-separated assignments
                    sanitized = re.sub(r',\s*(?=[a-zA-Z_]\w*\s*=)', '; ', input_str)
                    exec(sanitized, namespace, local_scope)
                    
                    # Get args
                    args = list(local_scope.values())
                    
                    # Execute function
                    result = solution_func(*args)
                    
                    # Parse expected output
                    output_str = test.get('output', '')
                    expected = eval(output_str, {'null': None, 'true': True, 'false': False, 'None': None})
                    
                    # Compare
                    passed = result == expected
                    if not passed:
                        all_passed = False
                    
                    results.append({
                        'case': i + 1,
                        'passed': passed,
                        'input': input_str,
                        'expected': str(expected),
                        'actual': str(result)
                    })
                    
                except Exception as e:
                    all_passed = False
                    results.append({
                        'case': i + 1,
                        'passed': False,
                        'input': test.get('input', ''),
                        'error': str(e)
                    })
            
            return {
                'success': True,
                'passed': all_passed,
                'results': results,
                'logs': logs.getvalue()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Execution error: {str(e)}',
                'traceback': traceback.format_exc()
            }
