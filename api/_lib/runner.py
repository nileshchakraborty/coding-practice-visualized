import json
import subprocess
import sys
import tempfile
import os
import inspect

def execute_code(code, test_cases):
    """
    Executes the given Python code against the provided test cases.
    Returns a result dict with passed/failed status and details.
    """
    # Runner script template
    runner_code = """

import json
import inspect
import sys
import re
import ast

# --- Security & Limits ---
sys.setrecursionlimit(2000)

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
    
    # Handle [[val, random_index], ...] format
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

    # Standard [1, 2, 3]
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
    if not arr[0] and arr[0] != 0: return None # Handle [null]
    
    root = TreeNode(arr[0])
    q = [root]
    i = 1
    while q and i < len(arr):
        node = q.pop(0)
        
        # Left child
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            q.append(node.left)
        i += 1
        
        # Right child
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
    
    # Trim trailing Nones
    while res and res[-1] is None:
        res.pop()
    return res



def adj_to_graph(adjList):
    if not adjList: return None
    n = len(adjList)
    if n == 0: return None
    nodes = [Node(i + 1) for i in range(n)]
    for i, neighbors in enumerate(adjList):
        nodes[i].neighbors = [nodes[j - 1] for j in neighbors]
    return nodes[0]

def graph_to_adj(node):
    if not node: return []
    from collections import deque
    nodes = {} # val -> node
    q = deque([node])
    nodes[node.val] = node
    while q:
        curr = q.popleft()
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
    test_cases = """ + json.dumps(test_cases) + """
    
    # helper to find solution function
    def find_solution_func(locals_dict):
        # Filter for functions OR CLASSES defined in this module
        ignore = {'run_tests_internal', 'list_to_ll', 'll_to_list', 'list_to_tree', 'tree_to_list', 'adj_to_graph', 'graph_to_adj', 'ListNode', 'TreeNode', 'Node', 'null', 'true', 'false'}
        
        candidates = [obj for name, obj in list(locals_dict.items()) 
                    if (callable(obj) or inspect.isclass(obj)) and obj.__module__ == '__main__' and name not in ignore]
        if not candidates: return None
        return candidates[0]

    solution_func = find_solution_func(globals())
    
    if not solution_func:
        print(json.dumps({"passed": False, "results": [], "error": "No function/class found. Please define a function or class."}))
        return

    is_class_solution = inspect.isclass(solution_func)

    for i, test in enumerate(test_cases):
        expected_str = test.get('output', '').strip()
        expected_display = expected_str or "(custom - no expected)"
        
        try:
            # Print separator for logs
            print()
            print('='*40)
            print(f" TEST CASE {i + 1}")
            print('='*40)
            print(f"Input: {test['input']}")
            # Parse inputs
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
                # 2. If SyntaxError or other weird parsing artifacts (e.g. tuple unpacking of assignments),
                # likely comma-separated assignments (LC style).
                # Fix inputs like "nums = [1,2], target = 3"
                sanitized_input = re.sub(r',\s*(?=[a-zA-Z_]\w*\s*=)', '; ', test['input'])
                exec(sanitized_input, globals(), local_scope)
            
            actual_val = None
            result = None  # Initialize to prevent UnboundLocalError
            solution_func_name = ''
            
            # If full_script_mode produced a result, use it directly (design class imperative tests)
            if full_script_mode and last_expr_val is not None:
                actual_val = last_expr_val
                result = last_expr_val
                solution_func_name = 'script_mode'
            else:
                # Helper to check if inputs are Design-style commands
                cmd_var = next((k for k in local_scope if 'command' in k or 'method' in k or 'op' in k), None)
                arg_var = next((k for k in local_scope if 'arg' in k or 'input' in k or 'val' in k), None)
                is_design_input = (cmd_var and arg_var)

                if is_class_solution:
                    if is_design_input:
                        # Design Problem (e.g., Tweeter, MinStack, Trie)
                        commands = local_scope[cmd_var]
                        arguments = local_scope[arg_var]
                        
                        # First command is usually the class name, first arg is constructor args
                        obj = solution_func(*arguments[0])
                        res_list = [None] # Constructor returns None
                        
                        for cmd_idx in range(1, len(commands)):
                            method = commands[cmd_idx]
                            params = arguments[cmd_idx]
                            if hasattr(obj, method):
                                val = getattr(obj, method)(*params)
                                res_list.append(val)
                            else:
                                res_list.append(None)
                        actual_val = res_list
                        result = res_list
                        solution_func_name = 'design_class'
                    
                    else:
                        # Standard Algo Problem wrapped in Class (e.g. class Solution: def solve(...))
                        # 1. Instantiate (assume no-arg constructor for standard algos)
                        instance = solution_func()
                        
                        # 2. Find the method to call
                        # Heuristic: First public method that isn't __init__
                        methods = [func for func in dir(instance) if callable(getattr(instance, func)) and not func.startswith("__")]
                        if not methods:
                            raise Exception("No public methods found in class Solution")
                        
                        target_method = getattr(instance, methods[0]) # Use the first one
                        
                        # 3. Resolve Arguments (Identical logic to function-based)
                        sig = inspect.signature(target_method)
                        args = []
                        aliases = {
                            'node': ['adjList', 'val'], 'target': ['k'],
                            'arr': ['nums', 'vec'], 'nums': ['arr'], 'root': ['p', 'q']
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
                                # Heuristic conversions
                                if isinstance(val, list) and param in ['l1', 'l2', 'head', 'list1', 'list2', 'headA', 'headB']:
                                    pos = local_scope.get('pos', -1)
                                    val = list_to_ll(val, pos)
                                elif isinstance(val, list) and param in ['root', 'root1', 'root2', 'subRoot']:
                                        val = list_to_tree(val)
                                elif isinstance(val, list) and param in ['node'] and all(isinstance(x, list) for x in val):
                                        val = adj_to_graph(val)
                                elif param in ['p', 'q']:
                                    if isinstance(val, list):
                                        val = list_to_tree(val)
                                    elif isinstance(val, int):
                                        root_tree = None
                                        for a in args:
                                            if isinstance(a, TreeNode):
                                                root_tree = a
                                                break
                                        if root_tree:
                                            def find_node(node, target):
                                                if not node: return None
                                                if node.val == target: return node
                                                left = find_node(node.left, target)
                                                if left: return left
                                                return find_node(node.right, target)
                                            val = find_node(root_tree, val)
                                args.append(val)
                        
                        # 4. Invoke
                        result = target_method(*args)
                        actual_val = result # Conversion happens later
                        solution_func_name = target_method.__name__

                else:
                    # Standard Function Execution
                    # Smart arg matching with aliases
                    sig = inspect.signature(solution_func)
                    args = []
                    # Aliases map: Param Name -> Possible Test Vars
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
                        
                        # 1. Exact match
                        if param in local_scope:
                            val = local_scope[param]
                            found = True
                        # 2. Alias match
                        elif param in aliases:
                            for alias in aliases[param]:
                                if alias in local_scope:
                                    val = local_scope[alias]
                                    found = True
                                    break
                        
                        if found:
                            # Heuristic conversions
                            if isinstance(val, list) and param in ['l1', 'l2', 'head', 'list1', 'list2', 'headA', 'headB']:
                                pos = local_scope.get('pos', -1)
                                val = list_to_ll(val, pos)
                            elif isinstance(val, list) and param in ['root', 'root1', 'root2', 'subRoot']:
                                 val = list_to_tree(val)
                            elif isinstance(val, list) and param in ['node'] and all(isinstance(x, list) for x in val):
                                 val = adj_to_graph(val)
                            # Handle p/q parameter:
                            # If list -> convert to TreeNode (for same-tree, validate-bst)
                            # If int -> find node in tree by value (for LCA problems)
                            elif param in ['p', 'q']:
                                if isinstance(val, list):
                                    val = list_to_tree(val)
                                elif isinstance(val, int):
                                    # p/q are integer VALUES, need to find the node in root tree
                                    root_tree = None
                                    for a in args:
                                        if isinstance(a, TreeNode):
                                            root_tree = a
                                            break
                                    if root_tree:
                                        def find_node(node, target):
                                            if not node: return None
                                            if node.val == target: return node
                                            left = find_node(node.left, target)
                                            if left: return left
                                            return find_node(node.right, target)
                                        val = find_node(root_tree, val)
                                 
                            args.append(val)
                        else:
                            # Default none if not found? Or skip?
                            # If required arg missing, it will crash.
                            pass

                    if len(args) != len(sig.parameters):
                         pass

                    result = solution_func(*args)
                    solution_func_name = solution_func.__name__
                
            # --- Shared Output Conversion ---
            def convert_val(val, func_name=''):
                if isinstance(val, ListNode): return ll_to_list(val)
                if isinstance(val, TreeNode):
                    # For LCA functions, return just the node value, not tree serialization
                    if 'lowestCommonAncestor' in func_name:
                        return val.val
                    return tree_to_list(val)
                if hasattr(val, 'val') and hasattr(val, 'neighbors'): return graph_to_adj(val)
                # Handle Node class with random pointer (copy-list-with-random-pointer)
                if hasattr(val, 'val') and hasattr(val, 'next') and hasattr(val, 'random'):
                    return ll_to_list(val)
                # Handle generic Node class
                if type(val).__name__ == 'Node' and hasattr(val, 'val'):
                    if hasattr(val, 'random'): return ll_to_list(val)
                    if hasattr(val, 'neighbors'): return graph_to_adj(val)
                return val

            actual_val = convert_val(result, locals().get('solution_func_name', '')) # Use resolved name
            
            # Support In-Place: Only for known in-place modification functions
            # Not for functions that return new heads/roots
            in_place_funcs = ['sortColors', 'rotate', 'setZeroes', 'moveZeroes', 
                              'reverseString', 'wallsAndGates', 'gameOfLife']
            
            # TODO: If Class, using in-place args is tricky unless we tracked the args
            # For now, In-place on Class methods isn't explicitly requested but should largely work if args refer to same objs
            
            if actual_val is None and result is None and locals().get('args'): # Check if args exists in scope
                if locals().get('solution_func_name', '') in in_place_funcs:
                    candidates = [convert_val(a) for a in locals().get('args', [])]
                    if candidates and isinstance(candidates[0], list):
                        actual_val = candidates[0]
                else:
                    # For LinkedList/Tree functions that return None = empty result
                    actual_val = []
            
            if locals().get('solution_func_name') == 'groupAnagrams' and isinstance(actual_val, list):
                try:
                    actual_val = sorted([sorted(x) for x in actual_val])
                except: pass
            
            # Eval expected - handle empty/invalid output gracefully
            expected_str = test.get('output', '').strip()
            if not expected_str:
                expected = None  # Empty output means we just run without comparison
            else:
                try:
                    expected = eval(expected_str, globals(), {'null': None, 'true': True, 'false': False, 'True': True, 'False': False})
                except:
                    expected = expected_str  # Use as string if can't eval
            
            # Normalize list-of-lists for order-independent comparison (groupAnagrams, etc.)
            # Skip for [[val, rand_idx]] format (rand_idx can be None/int)
            def is_sortable_list_of_lists(lst):
                if not isinstance(lst, list) or not lst: return False
                if not isinstance(lst[0], list): return False
                # Check if all sublists contain sortable homogeneous types (e.g., strings)
                try:
                    for sublist in lst:
                        if sublist and any(x is None or not isinstance(x, type(sublist[0])) for x in sublist):
                            return False
                    return True
                except:
                    return False
            
            if is_sortable_list_of_lists(expected) and is_sortable_list_of_lists(actual_val):
                try:
                    expected = sorted([sorted(x) for x in expected])
                    actual_val = sorted([sorted(x) for x in actual_val])
                except: pass
            
            # Handle None result for List expected (Function only?)
            if actual_val is None and isinstance(expected, list) and not is_class_solution:
                actual_val = []

            # Special Handling for "k, nums = [...]" expected output (removeElement, etc)
            custom_passed = None
            if isinstance(expected_str, str) and ',' in expected_str and '=' in expected_str:
                 match = re.match(r'^(\d+),\s*(\w+)\s*=\s*(.*)$', expected_str)
                 if match:
                     try:
                         exp_k = int(match.group(1))
                         arr_name = match.group(2)
                         # Support underscores in expected array
                         exp_arr = eval(match.group(3), globals(), {'null': None, 'true': True, 'false': False, '_': '_'})
                         
                         if isinstance(actual_val, int): 
                            if actual_val == exp_k:
                                 # Check array content
                                 modified_arr = local_scope.get(arr_name)
                                 if isinstance(modified_arr, list):
                                     sub_arr = modified_arr[:actual_val]
                                     exp_arr_sliced = exp_arr[:actual_val]
                                     
                                     # Determine sort requirement
                                     func_name = locals().get('solution_func_name', '')
                                     
                                     if 'removeElement' in func_name:
                                         # Sort both for unordered comparison
                                         try:
                                             custom_passed = (sorted(sub_arr) == sorted(exp_arr_sliced))
                                         except:
                                             custom_passed = (sub_arr == exp_arr_sliced)
                                     else:
                                         # Strict order (removeDuplicates, rotate, etc)
                                         custom_passed = (sub_arr == exp_arr_sliced)
                                 else:
                                     custom_passed = False # Array not found or not list
                            else:
                                 custom_passed = False # k mismatch
                     except Exception:
                         pass

            # Compare
            passed = False
            if custom_passed is not None:
                passed = custom_passed
                expected_display = str(expected)
            elif expected is None:
                # Custom test case with no expected output - just show result, mark as "ran"
                passed = True  # No comparison, execution succeeded
                expected_display = "(custom - no expected)"
            else:
                try:
                    # Float comparison logic
                    def is_float(x): return isinstance(x, (float, int)) and not isinstance(x, bool)
                    if is_float(actual_val) and is_float(expected):
                        passed = abs(actual_val - expected) < 1e-5
                    else:
                        passed = (actual_val == expected)
                except:
                    passed = (actual_val == expected)
                expected_display = str(expected)
                
            if not passed and expected is not None:
                all_passed = False
            print(f"Actual: {actual_val}")
            print(f"Expected: {expected_display}")
            print(f"Result: {'PASSED' if passed else 'FAILED'}")
            print()
                
            results.append({
                "case": i + 1,
                "passed": passed,
                "input": test['input'],
                "expected": expected_display,
                "actual": str(actual_val)
            })
            
        except Exception as e:
            all_passed = False
            import traceback
            error_msg = traceback.format_exc()
            print(f"Error: {error_msg}")
            
            results.append({
                "case": i + 1,
                "passed": False,
                "input": test['input'],
                "expected": expected_display,
                "actual": "",
                "error": error_msg
            })
    
    print(json.dumps({"passed": all_passed, "results": results}))


if __name__ == "__main__":
    try:
        run_tests_internal()
    except Exception as e:
        print(json.dumps({"passed": False, "results": [], "error": str(e)}))
"""
    
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
                "results": result_json.get("results", []),
                "logs": logs,
                "error": result_json.get("error", None) or stderr
            }
        except json.JSONDecodeError:
             return {"success": False, "error": "JSON Decode Error", "logs": stdout, "stderr": stderr}
             
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Timeout"}
    finally:
        pass
        # if os.path.exists(temp_path):
        #     os.remove(temp_path)
        print(f"DEBUG: Temp file at {temp_path}")
