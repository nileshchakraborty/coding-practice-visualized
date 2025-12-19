from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add the current directory to sys.path to ensure we can import from lib
# Vercel structure: /var/task/api/execute.py
# We need to import api.lib.runner
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(current_dir) # Add api/
sys.path.append(parent_dir)  # Add root/

try:
    # Try importing from lib (relative to this file)
    from lib import runner
except ImportError:
    # Fallback to sys path modification if needed
    sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))
    import runner

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            body = json.loads(post_data.decode('utf-8'))
            code = body.get('code')
            test_cases = body.get('testCases')
            
            if not code:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing code"}).encode('utf-8'))
                return

            # Execute Code
            # runner.execute_code returns a dict
            result = runner.execute_code(code, test_cases)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
