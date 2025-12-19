
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
            exec(test['input'], globals(), local_scope)
            
            actual_val = None
            if is_class_solution:
                # Class Logic
                cmd_var = next((k for k in local_scope if 'command' in k or 'method' in k or 'op' in k), None)
                arg_var = next((k for k in local_scope if 'arg' in k or 'input' in k or 'val' in k), None)
                if cmd_var and arg_var:
                    commands = local_scope[cmd_var]
                    arguments = local_scope[arg_var]
                    obj = solution_func(*arguments[0])
                    res_list = [None]
                    for cmd, params in zip(commands[1:], arguments[1:]):
                         if hasattr(obj, cmd):
                             res_list.append(getattr(obj, cmd)(*params))
                         else: res_list.append(None)
                    actual_val = res_list
                else: raise Exception("Class solution requires commands/args.")
            else:
                # Function Logic
                sig = inspect.signature(solution_func)
                args = []
                for param in sig.parameters:
                    if param in local_scope:
                        val = local_scope[param]
                        if isinstance(val, list) and param in ['l1', 'l2', 'head', 'list1']: val = list_to_ll(val)
                        elif isinstance(val, list) and param in ['root', 'p', 'q']: val = list_to_tree(val)
                        args.append(val)
                result = solution_func(*args)
                actual_val = result
                if isinstance(result, ListNode): actual_val = ll_to_list(result)
                elif isinstance(result, TreeNode): actual_val = tree_to_list(result)
                elif hasattr(result, 'val') and hasattr(result, 'neighbors'): actual_val = graph_to_adj(result)

            # Eval expected
            expected = eval(test['output'], globals(), {'null': None, 'true': True, 'false': False})
            
            # Simple compare
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
