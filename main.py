"""
LeetCode Top Interview 150 Visualizer
FastAPI application to visualize and explore LeetCode problems
"""

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import json
import subprocess
import sys
import tempfile
import traceback
import os
from pathlib import Path

app = FastAPI(title="LeetCode Top Interview 150 Visualizer")

# Setup paths
BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "problems.json"
SOLUTIONS_FILE = BASE_DIR / "data" / "solutions.json"

# Mount static files
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

# Templates
templates = Jinja2Templates(directory=BASE_DIR / "templates")


def load_problems():
    if not DATA_FILE.exists():
        return {"categories": []}
    with open(DATA_FILE) as f:
        data = json.load(f)
    # Enrich with slugs
    for cat in data.get("categories", []):
        for p in cat.get("problems", []):
            p["slug"] = title_to_slug(p["title"])
            # Assuming 'has_solution' check necessitates looking at solutions file, 
            # but let's keep it simple or check solutions
            p["has_solution"] = False # Default, update if costly to check all
    
    # Optional: Update has_solution based on solutions.json
    try:
        solutions = load_solutions()
        sol_map = solutions.get("solutions", {})
        for cat in data.get("categories", []):
            for p in cat.get("problems", []):
                if p["slug"] in sol_map:
                    p["has_solution"] = True
    except:
        pass
        
    return data

def load_solutions():
    if not SOLUTIONS_FILE.exists():
         return {"solutions": {}}
    with open(SOLUTIONS_FILE) as f:
        return json.load(f)

def title_to_slug(title):
    return title.lower().replace(" ", "-").replace("(", "").replace(")", "").replace("'", "")

@app.get("/api/problems")
async def get_problems():
    return load_problems()

@app.get("/api/health")
async def health_check():
    """Health check endpoint for deployment platforms"""
    return {"status": "healthy", "service": "leetcode-visual"}

@app.get("/api/solutions/{slug}")
async def get_solution(slug: str):
    solutions = load_solutions()
    if slug in solutions.get("solutions", {}):
        return solutions["solutions"][slug]
    return HTMLResponse(status_code=404, content='{"error": "Solution not found"}', media_type="application/json")


class CodeSubmission(BaseModel):
    code: str
    slug: str
    testCases: list[dict] = None


@app.post("/api/run")
async def run_code(submission: CodeSubmission):
    solutions = load_solutions()
    
    # Use provided test cases if available (custom run), otherwise fetch from solution
    test_cases = submission.testCases
    
    if not test_cases:
        # Check if solution exists to get default test cases
        if submission.slug in solutions.get("solutions", {}):
            solution_data = solutions["solutions"][submission.slug]
            test_cases = solution_data.get("testCases", [])
    
    if not test_cases:
        return {"error": "No test cases available for this problem", "success": False}
    
    # Use shared runner
    from runner import execute_code
    return execute_code(submission.code, test_cases)

class GenerateRequest(BaseModel):
    slug: str

class TutorRequest(BaseModel):
    slug: str
    message: str
    history: list[dict] = [] # [{role: 'user'|'assistant', content: '...'}]


@app.post("/api/generate")
async def generate_solution_endpoint(request: GenerateRequest):
    # 1. Check if already exists
    solutions = load_solutions()
    if request.slug in solutions.get("solutions", {}):
         return {"success": True, "slug": request.slug, "cached": True}
         
    # 2. Get Problem Details
    problems = load_problems()
    problem = None
    for cat in problems["categories"]:
        for p in cat["problems"]:
             if title_to_slug(p["title"]) == request.slug:
                 problem = p
                 break
    if not problem:
        return {"success": False, "error": "Problem not found"}
        
    # 3. Call AI Engine
    from ai_engine import generate_solution_json, validate_and_fix
    
    # We need a description? We only have title + URL. 
    # Ideally we'd scrape the URL or use a stored description.
    # For now, pass title and hope AI knows it (Top 150 are famous)
    solution_data = generate_solution_json(problem["title"], f"LeetCode problem {problem['title']}")
    
    if "error" in solution_data:
         return {"success": False, "error": solution_data["error"]}
         
    # 4. Validate
    solution_data, passed = validate_and_fix(solution_data, request.slug)
    
    # 5. Save even if validation failed (so user can edit it), but mark it?
    # Or maybe only save if valid? Let's save it but add a flag?
    # For now, just save it.
    solution_data["generated"] = True
    solution_data["validationPassed"] = passed
    
    # Add title
    solution_data["title"] = problem["title"]
    
    solutions["solutions"][request.slug] = solution_data
    
    with open(SOLUTIONS_FILE, "w") as f:
        json.dump(solutions, f, indent=4)
        
    return {"success": True, "slug": request.slug, "passed": passed}

@app.post("/api/tutor")
async def tutor_endpoint(request: TutorRequest):
    # Get Problem Details
    problems = load_problems()
    problem = None
    for cat in problems["categories"]:
        for p in cat["problems"]:
             if title_to_slug(p["title"]) == request.slug:
                 problem = p
                 break
                 
    if not problem:
        return {"error": "Problem not found"}
        
    from ai_engine import ask_tutor
    
    # We might generate description or just pass title
    desc = f"LeetCode problem {problem['title']}"
    
    result = ask_tutor(problem['title'], desc, request.history, request.message)
    return result

