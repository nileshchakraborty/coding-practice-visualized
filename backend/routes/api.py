
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from backend.repositories.problem_repo import ProblemRepository
from backend.services.ai_service import AIService
from backend.services.execution import ExecutionService

router = APIRouter()
repo = ProblemRepository()

# --- DTOs ---
class CodeSubmission(BaseModel):
    code: str
    slug: str
    testCases: list[dict] = None

class GenerateRequest(BaseModel):
    slug: str

class TutorRequest(BaseModel):
    slug: str
    message: str
    history: list[dict] = []

# --- Endpoints ---

@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "leetcode-visual"}

@router.get("/problems")
async def get_problems():
    return repo.load_problems()

@router.get("/solutions/{slug}")
async def get_solution(slug: str):
    sol = repo.get_solution(slug)
    if sol: return sol
    # 404 JSON
    return HTMLResponse(status_code=404, content='{"error": "Solution not found"}', media_type="application/json")

@router.post("/run")
async def run_code(submission: CodeSubmission):
    # Get test cases if not provided
    test_cases = submission.testCases
    if not test_cases:
        sol = repo.get_solution(submission.slug)
        if sol:
            test_cases = sol.get("testCases", [])
            
    if not test_cases:
        return {"error": "No test cases available", "success": False}
        
    return ExecutionService.execute_code(submission.code, test_cases)

@router.post("/generate")
async def generate_solution(request: GenerateRequest):
    # Check cache
    if repo.get_solution(request.slug):
         return {"success": True, "slug": request.slug, "cached": True}
         
    # Get Problem
    problem = repo.find_problem_by_slug(request.slug)
    if not problem:
        return {"success": False, "error": "Problem not found"}
        
    # Generate
    solution_data = AIService.generate_solution_json(problem['title'], f"LeetCode problem {problem['title']}")
    if "error" in solution_data:
         return {"success": False, "error": solution_data["error"]}
         
    # Validate
    solution_data, passed = AIService.validate_and_fix(solution_data, request.slug)
    
    # Enrich and Save
    solution_data["generated"] = True
    solution_data["validationPassed"] = passed
    solution_data["title"] = problem["title"]
    
    repo.save_solution(request.slug, solution_data)
    
    return {"success": True, "slug": request.slug, "passed": passed}

@router.post("/tutor")
async def tutor_endpoint(request: TutorRequest):
    problem = repo.find_problem_by_slug(request.slug)
    if not problem:
         return {"error": "Problem not found"}
         
    desc = f"LeetCode problem {problem['title']}"
    return AIService.ask_tutor(problem['title'], desc, request.history, request.message)
