
import json
import subprocess
import sys
import tempfile
import os
import inspect

# We can keep the runner script template here or load it from a file
# For simplicity, embedding it as before.
RUNNER_TEMPLATE = """
import json
import inspect
import sys
import re
import ast

# --- Data Structures & Helpers ---
class ListNode:
    def __init__(self, val=0, next=None, random=None):
        self.val = val
        self.next = next
        self.random = random

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def list_to_ll(arr, pos=-1):
    if not arr: return None
    if arr and isinstance(arr[0], list) and len(arr[0]) == 2:
        nodes = []
        for val, _ in arr:
            nodes.append(ListNode(val))
        for i, (_, rand_idx) in enumerate(arr):
            if i < len(arr) - 1:
                nodes[i].next = nodes[i + 1]
            if rand_idx is not None:
                 nodes[i].random = nodes[rand_idx]
        return nodes[0]

    head = ListNode(arr[0])
    curr = head
    nodes = [head]
    for x in arr[1:]:
        t = ListNode(x)
        curr.next = t
        curr = t
        nodes.append(t)
    
    if pos != -1 and 0 <= pos < len(nodes):
        curr.next = nodes[pos]
    return head

def ll_to_list(node):
    res = []
    curr = node
    has_random = False
    nodes_map = {}
    idx = 0
    visited = set()
    while curr and id(curr) not in visited:
        visited.add(id(curr))
        nodes_map[curr] = idx
        res.append(getattr(curr, 'val', None))
        if getattr(curr, 'random', None) is not None:
            has_random = True
        curr = getattr(curr, 'next', None)
        idx += 1
        
    if has_random:
        full_res = []
        curr = node
        visited = set()
        while curr and id(curr) not in visited:
            visited.add(id(curr))
            rand_node = getattr(curr, 'random', None)
            rand_idx = nodes_map.get(rand_node, None) if rand_node else None
            full_res.append([getattr(curr, 'val', None), rand_idx])
            curr = getattr(curr, 'next', None)
        return full_res
    return res

def list_to_tree(arr):
    if not arr: return None
    if not arr[0] and arr[0] != 0: return None
    root = TreeNode(arr[0])
    q = [root]
    i = 1
    while q and i < len(arr):
        node = q.pop(0)
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            q.append(node.right)
        i += 1
    return root

def tree_to_list(root):
    if not root: return []
    res = []
    q = [root]
    while q:
        node = q.pop(0)
        if node:
            res.append(node.val)
            q.append(node.left)
            q.append(node.right)
        else:
            res.append(None)
    while res and res[-1] is None:
        res.pop()
    return res

def adj_to_graph(adjList):
    if not adjList: return None
    class Node:
        def __init__(self, val=0, neighbors=None):
            self.val = val
            self.neighbors = neighbors if neighbors is not None else []
    n = len(adjList)
    if n == 0: return None
    nodes = [Node(i + 1) for i in range(n)]
    for i, neighbors in enumerate(adjList):
        nodes[i].neighbors = [nodes[j - 1] for j in neighbors]
    return nodes[0]

def graph_to_adj(node):
    if not node: return []
    from collections import deque
    nodes = {}
    q = deque([node])
    nodes[node.val] = node
    while q:
        curr = q.popleft()
        if hasattr(curr, 'neighbors'):
            for nei in curr.neighbors:
                if nei.val not in nodes:
                    nodes[nei.val] = nei
                    q.append(nei)
    if not nodes: return []
    max_val = max(nodes.keys())
    res = [[] for _ in range(max_val)]
    for val in range(1, max_val + 1):
            if val in nodes:
                res[val-1] = sorted([nei.val for nei in nodes[val].neighbors])
    return res

def run_tests_internal():
    results = []
    all_passed = True
    # TEST_CASES injected via string manip
    test_cases = {TEST_CASES_JSON}
    
    def find_solution_func(locals_dict):
        ignore = {'run_tests_internal', 'list_to_ll', 'll_to_list', 'list_to_tree', 'tree_to_list', 'adj_to_graph', 'graph_to_adj', 'ListNode', 'TreeNode', 'Node', 'null', 'true', 'false'}
        candidates = [obj for name, obj in list(locals_dict.items()) 
                    if (callable(obj) or inspect.isclass(obj)) and obj.__module__ == '__main__' and name not in ignore]
        if not candidates: return None
        return candidates[0]

    solution_func = find_solution_func(globals())
    if not solution_func:
        print(json.dumps({"passed": False, "results": [], "error": "No function/class found."}))
        return

    is_class_solution = inspect.isclass(solution_func)

    for i, test in enumerate(test_cases):
        try:
            local_scope = {'null': None, 'true': True, 'false': False}
            # Input Parsing Strategy
            # 1. Try treating as valid Python script (Imperative Class Test or Semicolon Separated)
            full_script_mode = False
            last_expr_val = None
            
            try:
                # AST Parse Check
                tree = ast.parse(test['input'])
                full_script_mode = True
                
                # Exec and Eval Last Strategy
                if tree.body:
                    last_node = tree.body[-1]
                    if isinstance(last_node, ast.Expr):
                        # Exec prev
                        if len(tree.body) > 1:
                            prev = ast.Module(body=tree.body[:-1], type_ignores=[])
                            exec(compile(prev, filename="<string>", mode="exec"), globals(), local_scope)
                        # Eval last
                        expr = ast.Expression(body=last_node.value)
                        last_expr_val = eval(compile(expr, filename="<string>", mode="eval"), globals(), local_scope)
                    else:
                        exec(compile(tree, filename="<string>", mode="exec"), globals(), local_scope)
                else:
                    exec(test['input'], globals(), local_scope)

            except Exception:
                # 2. If SyntaxError or other weird parsing artifacts
                # likely comma-separated assignments (LC style).
                sanitized_input = re.sub(r',\s*(?=[a-zA-Z_]\w*\s*=)', '; ', test['input'])
                exec(sanitized_input, globals(), local_scope)
            
            actual_val = None
            
            # If we captured an expression value in script mode, that might be the result
            if full_script_mode and last_expr_val is not None:
                # We still need to check if this was a class wrapper or just direct code
                pass # Logic continues below
            
            if is_class_solution:
                # Class Logic
                cmd_var = next((k for k in local_scope if 'command' in k or 'method' in k or 'op' in k), None)
                arg_var = next((k for k in local_scope if 'arg' in k or 'input' in k or 'val' in k), None)
                
                if cmd_var and arg_var:
                    # .. standard class logic ...
                    commands = local_scope[cmd_var]
                    arguments = local_scope[arg_var]
                    obj = solution_func(*arguments[0])
                    res_list = [None]
                    for cmd, params in zip(commands[1:], arguments[1:]):
                         if hasattr(obj, cmd):
                             res_list.append(getattr(obj, cmd)(*params))
                         else: res_list.append(None)
                    actual_val = res_list
                
                elif full_script_mode:
                    # Fallback: Imperative Script Result
                    actual_val = last_expr_val
                
                else: raise Exception("Class solution requires commands/args.")
            else:
                # Smart arg matching with aliases
                sig = inspect.signature(solution_func)
                args = []
                aliases = {
                    'node': ['adjList', 'val'],
                    'target': ['k'],
                    'arr': ['nums', 'vec'],
                    'nums': ['arr'],
                    'root': ['p', 'q']
                }

                for param in sig.parameters:
                    val = None
                    found = False
                    if param in local_scope:
                        val = local_scope[param]
                        found = True
                    elif param in aliases:
                        for alias in aliases[param]:
                            if alias in local_scope:
                                val = local_scope[alias]
                                found = True
                                break
                    
                    if found:
                        if isinstance(val, list) and param in ['l1', 'l2', 'head', 'list1', 'list2', 'headA', 'headB']:
                            pos = local_scope.get('pos', -1)
                            val = list_to_ll(val, pos)
                        elif isinstance(val, list) and param in ['root', 'p', 'q', 'root1', 'root2', 'subRoot']:
                             val = list_to_tree(val)
                        elif isinstance(val, list) and param in ['node'] and all(isinstance(x, list) for x in val):
                             val = adj_to_graph(val)
                        args.append(val)
                    else:
                        pass
                result = solution_func(*args)
                actual_val = result
                
                # Helper to convert outputs
                def convert_val(val):
                    if isinstance(val, ListNode): return ll_to_list(val)
                    if isinstance(val, TreeNode): return tree_to_list(val)
                    if hasattr(val, 'val') and hasattr(val, 'neighbors'): return graph_to_adj(val)
                    return val

                actual_val = convert_val(result)
                
                # Support In-Place: If result is None but expected is List, check args[0]
                if actual_val is None and result is None and args:
                    # Check if args[0] matches expected type or if it was modified
                    # Heuristic: If expected is list and args[0] is list/node
                    candidates = [convert_val(a) for a in args]
                    # We try to find one that matches the expected value? 
                    # Or just default to first arg for standard in-place probs
                    if candidates and isinstance(candidates[0], list):
                        actual_val = candidates[0]

            # Eval expected
            expected = eval(test['output'], globals(), {'null': None, 'true': True, 'false': False})
            
            # Simple compare
            passed = False
            try:
                def is_float(x): return isinstance(x, (float, int)) and not isinstance(x, bool)
                if is_float(actual_val) and is_float(expected):
                    passed = abs(actual_val - expected) < 1e-5
                else:
                    passed = (actual_val == expected)
            except:
                passed = (actual_val == expected)
            if not passed: all_passed = False
            results.append({"case": i+1, "passed": passed, "input": test['input'], "expected": str(expected), "actual": str(actual_val)})
            
        except Exception as e:
            all_passed = False
            results.append({"case": i+1, "passed": False, "input": test['input'], "error": str(e)})

    print(json.dumps({"passed": all_passed, "results": results}))

if __name__ == "__main__":
    try:
        run_tests_internal()
    except Exception as e:
        print(json.dumps({"passed": False, "result": [], "error": str(e)}))
"""

class ExecutionService:
    @staticmethod
    def execute_code(code: str, test_cases: list):
        """
        Executes code against test cases in an isolated subprocess.
        """
        # Inject test cases into template
        runner_code = RUNNER_TEMPLATE.replace("{TEST_CASES_JSON}", json.dumps(test_cases))
        
        full_script = code + "\n\n" + runner_code
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp:
            temp.write(full_script)
            temp_path = temp.name

        try:
             process = subprocess.run(
                [sys.executable, temp_path],
                capture_output=True,
                text=True,
                timeout=5
             )
             stdout = process.stdout
             stderr = process.stderr
             
             try:
                lines = stdout.strip().split('\n')
                if not lines or not lines[-1].strip():
                     return {"success": False, "error": "No output", "logs": stdout, "stderr": stderr}
                result_json = json.loads(lines[-1])
                logs = '\n'.join(lines[:-1])
                return {
                    "success": True,
                    "passed": result_json.get("passed", False),
                    "results": result_json["results"],
                    "logs": logs,
                    "error": result_json.get("error")
                }
             except json.JSONDecodeError:
                 return {"success": False, "error": "JSON Decode Error from Runner", "logs": stdout, "stderr": stderr}

        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Execution Timed Out (5s)"}
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
