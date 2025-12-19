
import sys
import json
from pathlib import Path
from backend import (
    get_adapter,
    Message,
    ProblemContext,
)
from backend.mcp.tools import get_registry
from backend.services.execution import ExecutionService

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

class AIService:
    @staticmethod
    def generate_solution_json(problem_title: str, problem_desc: str) -> dict:
        adapter = get_adapter()
        prompt = f"""
START PROBLEM
Title: {problem_title}
Description: {problem_desc}
END PROBLEM

Generate the JSON solution adhering to the system prompt structure.
"""
        result = adapter.generate_json(prompt, SOLUTION_SYSTEM_PROMPT)
        if "error" in result: return result
        if "pattern" in result or "code" in result: return result
        if "response" in result: return result
        return result

    @staticmethod
    def ask_tutor(problem_title: str, problem_desc: str, chat_history: list, user_message: str) -> dict:
        adapter = get_adapter()
        messages = [
            Message(role="system", content=TUTOR_SYSTEM_PROMPT),
            Message(role="system", content=f"Context: {problem_title}. {problem_desc}"),
        ]
        
        # Tools
        registry = get_registry()
        tools_info = f"Available Tools: {', '.join(registry.list_tools())}"
        messages.append(Message(role="system", content=tools_info))
        
        for msg in chat_history:
            messages.append(Message(role=msg.get('role', 'user'), content=msg.get('content', '')))
        messages.append(Message(role="user", content=user_message))
        
        return adapter.chat(messages)

    @staticmethod
    def validate_and_fix(solution_data: dict, problem_slug: str):
        code = solution_data.get('code')
        test_cases = solution_data.get('testCases')
        
        if not code or not test_cases:
            return solution_data, False
            
        result = ExecutionService.execute_code(code, test_cases)
        
        if result.get('success') and result.get('passed'):
            return solution_data, True
            
        # Self-correction could go here (call AI again with error)
        print(f"Validation failed for {problem_slug}: {result.get('error') or 'Tests failed'}")
        return solution_data, False
