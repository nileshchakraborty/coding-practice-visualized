
"""
LeetCode Top Interview 150 Visualizer
Entry Point (Refactored)
"""
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.api import router as api_router
from backend.config import Config

app = FastAPI(title="LeetCode Top Interview 150 Visualizer")

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
app.include_router(api_router, prefix="/api")

# Static & SPA Serving
ROOT_DIR = Config.ROOT_DIR
STATIC_UI_DIR = Config.STATIC_DIR

# Mount Assets (if present)
if (STATIC_UI_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=STATIC_UI_DIR / "assets"), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # API Fallback
    if full_path.startswith("api"):
        return {"error": "Not Found"}
        
    # Static Files
    file_path = STATIC_UI_DIR / full_path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
        
    # SPA Index
    index_path = STATIC_UI_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
        
    return {"error": "Frontend not built or not found. Please run build."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
