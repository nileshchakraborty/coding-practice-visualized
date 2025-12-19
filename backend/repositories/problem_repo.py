
import json
from pathlib import Path
from backend.config import Config

class ProblemRepository:
    def __init__(self):
        self.config = Config()

    def title_to_slug(self, title: str) -> str:
        return title.lower().replace(" ", "-").replace("(", "").replace(")", "").replace("'", "")

    def load_solutions(self):
        if not self.config.SOLUTIONS_FILE.exists():
             return {"solutions": {}}
        with open(self.config.SOLUTIONS_FILE) as f:
            return json.load(f)

    def load_problems(self):
        if not self.config.PROBLEMS_FILE.exists():
            return {"categories": []}
        with open(self.config.PROBLEMS_FILE) as f:
            data = json.load(f)
            
        sol_map = {}
        try:
             solutions = self.load_solutions()
             sol_map = solutions.get("solutions", {})
        except:
             pass

        for cat in data.get("categories", []):
            for p in cat.get("problems", []):
                p["slug"] = self.title_to_slug(p["title"])
                if p["slug"] in sol_map:
                    p["has_solution"] = True
                else:
                    p["has_solution"] = p.get("has_solution", False)
                    
        return data

    def get_solution(self, slug: str):
        solutions = self.load_solutions()
        sol_map = solutions.get("solutions", {})
        return sol_map.get(slug)

    def save_solution(self, slug: str, data: dict):
        solutions = self.load_solutions()
        # Initialize if strictly empty? load_solutions handles it
        if "solutions" not in solutions:
            solutions["solutions"] = {}
            
        solutions["solutions"][slug] = data
        with open(self.config.SOLUTIONS_FILE, "w") as f:
            json.dump(solutions, f, indent=4)
            
    def find_problem_by_slug(self, slug: str):
        problems = self.load_problems()
        for cat in problems["categories"]:
            for p in cat["problems"]:
                 if self.title_to_slug(p["title"]) == slug:
                     return p
        return None
