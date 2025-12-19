"""
AI Engine - Refactored with Adapter Pattern and MCP
Uses pluggable AI adapters and standardized context protocol.
"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from backend import (
    get_adapter,
    Message,
    ProblemContext,
    MCPRequest,
    build_context_from_solution,
)
from backend.mcp.tools import get_registry
from runner import execute_code


# System prompts
SOLUTION_SYSTEM_PROMPT = """You are an expert LeetCode tutor helping ADHD students. 
Your goal is to explain the problem VISUALLY and succinctly.

Output MUST be valid JSON with this exact structure:
{
    "pattern": "Two Pointers",
    "patternEmoji": "👉👈",
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(1)",
    "oneliner": "Use two pointers starting from ends to find the pair.",
    "intuition": [
        "First intuition bullet",
        "Second intuition bullet"
    ],
    "visualizationType": "array", 
    "initialState": [2, 7, 11, 15],
    "animationSteps": [
        {
            "type": "highlight",
            "indices": [0, 3],
            "color": "accent",
            "pointers": [ { "index": 0, "label": "L" }, { "index": 3, "label": "R" } ],
            "transientMessage": "Sum = 17. Too big!"
        }
    ],
    "code": "def twoSum(nums, target):\\n    ...",
    "keyInsight": "The array is sorted, so we can use directionality.",
    "testCases": [
        { "input": "numbers = [2,7,11,15], target = 9", "output": "[1, 2]" }
    ]
}

VISUALIZATION RULES:
- "visualizationType": Only "array" (for now).
- "initialState": The starting array of numbers.
- "animationSteps": Visual changes with indices, color, pointers, and message.
- "code" MUST be a valid Python function.
- "testCases" MUST have valid python input assignment strings.
"""

TUTOR_SYSTEM_PROMPT = """You are a Socratic LeetCode tutor helping students understand algorithms.
Your goal is to guide the student to the solution by asking searching questions, rather than just giving the answer.
Explain BIG O complexity clearly when asked.
Distinguish between Brute Force and Optimal solutions.

Tone: Encouraging, concise, and technical but accessible.

Response Format:
Just plain text (markdown supported). Use code blocks for examples.
"""


def generate_solution_json(problem_title: str, problem_desc: str) -> dict:
    """
    Generate a solution JSON using the configured AI adapter.
    
    Args:
        problem_title: Title of the problem
        problem_desc: Description of the problem
        
    Returns:
        Dict with solution data or error
    """
    adapter = get_adapter()
    
    prompt = f"""
Problem: {problem_title}
Description: {problem_desc}

Generate the JSON solution.
"""
    
    result = adapter.generate_json(prompt, SOLUTION_SYSTEM_PROMPT)
    
    if "error" in result:
        return result
    
    # If result is the parsed JSON, return it
    if "pattern" in result or "code" in result:
        return result
    
    # Check for response wrapper
    if "response" in result:
        return result
    
    return result


def ask_tutor(
    problem_title: str, 
    problem_desc: str, 
    chat_history: list, 
    user_message: str
) -> dict:
    """
    Get a response from the AI tutor using MCP context.
    
    Args:
        problem_title: Title of the problem
        problem_desc: Description of the problem
        chat_history: Previous conversation messages
        user_message: Current user question
        
    Returns:
        Dict with 'response' or 'error'
    """
    adapter = get_adapter()
    
    # Build context
    context = ProblemContext(
        title=problem_title,
        slug=problem_title.lower().replace(' ', '-'),
        description=problem_desc,
    )
    
    # Build messages
    messages = [
        Message(role="system", content=TUTOR_SYSTEM_PROMPT),
        Message(role="system", content=f"Context: Discussing problem '{problem_title}'. {problem_desc}"),
    ]
    
    # Add available tools info
    registry = get_registry()
    tools_info = f"You can ask for: {', '.join(registry.list_tools())}"
    messages.append(Message(role="system", content=tools_info))
    
    # Add history
    for msg in chat_history:
        messages.append(Message(role=msg.get('role', 'user'), content=msg.get('content', '')))
    
    # Add current message
    messages.append(Message(role="user", content=user_message))
    
    result = adapter.chat(messages)
    
    result = adapter.chat(messages)
    
    return result


def generate_visualization_steps(problem_title: str, code: str, initial_state: any, viz_type: str = "array") -> list:
    """
    Generate animation steps for an existing solution.
    """
    adapter = get_adapter()
    
    system_prompt = """You are an expert algorithm visualizer.
    Your goal is to generate a list of "animationSteps" to visualize the execution of the provided code on the "initialState".
    
    Output MUST be a JSON object with a single key "animationSteps" containing a list of steps.
    
    Step Format:
    {
        "type": "highlight",
        "indices": [0, 1],
        "color": "accent", 
        "pointers": [{"index": 0, "label": "i"}, {"index": 1, "label": "j"}],
        "transientMessage": "Checking if nums[0] + nums[1] == target"
    }
    
    Rules:
    - Trace the code logically.
    - Generate 5-10 key steps (don't trace every single loop iteration if it's too long, just key moments).
    - Use "highlight" type.
    - Colors: "accent" (processing), "success" (found/match), "error" (mismatch).
    """
    
    prompt = f"""
    Problem: {problem_title}
    Code:
    {code}
    
    Visualization Type: {viz_type}
    Initial State: {initial_state}
    
    Generate the animationSteps JSON.
    """
    
    result = adapter.generate_json(prompt, system_prompt)
    
    if "animationSteps" in result:
        return result["animationSteps"]
    
    # Fallback if AI returned raw list or wrapped response
    if isinstance(result, list):
        return result
        
    return []

    """
    Validates code against test cases.
    
    Args:
        solution_data: Solution dictionary with code and testCases
        problem_slug: Problem identifier
        
    Returns:
        Tuple of (solution_data, passed: bool)
    """
    code = solution_data.get('code')
    test_cases = solution_data.get('testCases')
    
    if not code or not test_cases:
        return solution_data, False
    
    # Run tests using the tool
    result = execute_code(code, test_cases)
    
    if result.get('success') and result.get('passed'):
        return solution_data, True
    
    print(f"Validation failed for {problem_slug}: {result.get('error') or 'Tests failed'}")
    return solution_data, False


# Convenience function to check adapter status
def check_ai_status() -> dict:
    """Check if the AI adapter is available"""
    try:
        adapter = get_adapter()
        available = adapter.is_available()
        return {
            "available": available,
            "provider": adapter.name,
        }
    except Exception as e:
        return {
            "available": False,
            "error": str(e)
        }
