#!/usr/bin/env python3
"""
Comprehensive validation script for leetcode-visual solutions.
Validates:
1. YouTube video IDs match problem topics (title check via API)
2. Python code solutions pass test cases
"""

import json
import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SOLUTIONS_FILE = "api/data/solutions.json"
PROBLEMS_FILE = "api/data/problems.json"
API_KEY = os.getenv("YOUTUBE_API_KEY")

def load_data():
    """Load problems and solutions data."""
    with open(PROBLEMS_FILE, "r") as f:
        problems_data = json.load(f)
    
    with open(SOLUTIONS_FILE, "r") as f:
        solutions_data = json.load(f)
    
    # Extract all problem slugs with their titles
    problems = {}
    for cat in problems_data["categories"]:
        for prob in cat["problems"]:
            problems[prob["slug"]] = {
                "title": prob["title"],
                "difficulty": prob["difficulty"],
                "category": cat["name"]
            }
    
    return problems, solutions_data


def validate_video_titles(problems, solutions, verbose=True):
    """
    Use YouTube API to get video titles and check if they match problem topics.
    """
    if not API_KEY:
        print("⚠️  YOUTUBE_API_KEY not set - skipping video title validation")
        return []
    
    mismatches = []
    video_map = {}  # videoId -> (slug, problem_title)
    
    for slug, sol in solutions.items():
        video_id = sol.get("videoId")
        if video_id:
            video_map[video_id] = (slug, problems.get(slug, {}).get("title", slug))
    
    video_ids = list(video_map.keys())
    print(f"\n🎬 Validating {len(video_ids)} video titles against YouTube API...")
    
    # Batch requests (YouTube API supports up to 50 IDs)
    chunk_size = 50
    video_titles = {}
    
    for i in range(0, len(video_ids), chunk_size):
        chunk = video_ids[i:i + chunk_size]
        ids_param = ",".join(chunk)
        url = f"https://www.googleapis.com/youtube/v3/videos?part=snippet&id={ids_param}&key={API_KEY}"
        
        try:
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                for item in data.get("items", []):
                    video_titles[item["id"]] = item["snippet"]["title"]
        except Exception as e:
            print(f"  API request failed: {e}")
    
    # Compare video titles with problem titles
    for video_id, (slug, problem_title) in video_map.items():
        video_title = video_titles.get(video_id, "")
        if not video_title:
            mismatches.append({
                "slug": slug,
                "problem_title": problem_title,
                "video_id": video_id,
                "video_title": "(Not found/unavailable)",
                "reason": "Video not found on YouTube"
            })
        else:
            # Check if problem title keywords appear in video title
            problem_words = set(problem_title.lower().replace("-", " ").split())
            video_words = set(video_title.lower().split())
            
            # Remove common words
            common_words = {"a", "the", "of", "in", "for", "to", "and", "or", "is", "with", "-", "|", "leetcode"}
            problem_words -= common_words
            video_words -= common_words
            
            # Check for significant overlap
            overlap = problem_words & video_words
            if len(overlap) < min(2, len(problem_words)):  # At least 2 words should match
                mismatches.append({
                    "slug": slug,
                    "problem_title": problem_title,
                    "video_id": video_id,
                    "video_title": video_title,
                    "reason": f"Title mismatch (overlap: {overlap})"
                })
    
    if verbose and mismatches:
        print(f"\n❌ Found {len(mismatches)} potential video mismatches:")
        for m in mismatches[:20]:  # Show first 20
            print(f"  - [{m['slug']}]")
            print(f"    Problem: {m['problem_title']}")
            print(f"    Video:   {m['video_title']}")
            print(f"    ID:      {m['video_id']}")
            print(f"    Reason:  {m['reason']}")
            print()
    
    return mismatches


def validate_code_execution(problems, solutions, verbose=True):
    """
    Run Python code against test cases.
    """
    try:
        sys.path.insert(0, os.path.join(os.getcwd(), 'api'))
        from _lib.runner import execute_code
    except ImportError as e:
        print(f"⚠️  Could not import runner: {e}")
        return []
    
    print(f"\n🧪 Validating code execution for {len(solutions)} solutions...")
    
    failed = []
    passed = 0
    skipped = 0
    
    for slug, sol in solutions.items():
        code = sol.get("code", "")
        test_cases = sol.get("testCases", [])
        
        if not code or not test_cases:
            skipped += 1
            continue
        
        try:
            result = execute_code(code, test_cases)
            if result.get("success") and result.get("passed"):
                passed += 1
            else:
                failed.append({
                    "slug": slug,
                    "title": sol.get("title", slug),
                    "error": result.get("error", "Unknown error"),
                    "results": result.get("results", [])
                })
        except Exception as e:
            failed.append({
                "slug": slug,
                "title": sol.get("title", slug),
                "error": str(e),
                "results": []
            })
    
    print(f"  ✅ Passed: {passed}")
    print(f"  ❌ Failed: {len(failed)}")
    print(f"  ⏭️  Skipped: {skipped}")
    
    if verbose and failed:
        print(f"\n❌ Failed solutions:")
        for f in failed[:20]:  # Show first 20
            print(f"  - [{f['slug']}] {f['title']}")
            print(f"    Error: {f['error']}")
            if f['results']:
                for r in f['results'][:2]:
                    if not r.get('passed'):
                        print(f"    Case: {r.get('input')} -> Expected: {r.get('expected')}, Got: {r.get('actual')}")
            print()
    
    return failed


def check_specific_problems(solutions, slugs):
    """Check specific problems for issues."""
    print("\n🔍 Checking specific problems:")
    for slug in slugs:
        sol = solutions.get(slug, {})
        print(f"\n  [{slug}]")
        print(f"    Title: {sol.get('title', 'NOT FOUND')}")
        print(f"    VideoId: {sol.get('videoId', 'None')}")
        if sol.get('code'):
            code_preview = sol['code'][:100].replace('\n', ' ')
            print(f"    Code preview: {code_preview}...")


def main():
    print("=" * 60)
    print("COMPREHENSIVE SOLUTIONS VALIDATION")
    print("=" * 60)
    
    problems, solutions = load_data()
    print(f"\nLoaded {len(problems)} problems and {len(solutions)} solutions")
    
    # Check specific problematic problems mentioned by user
    check_specific_problems(solutions, [
        "longest-substring-without-repeating-characters",
        "longest-increasing-subsequence"
    ])
    
    # Validate videos
    video_mismatches = validate_video_titles(problems, solutions)
    
    # Validate code
    code_failures = validate_code_execution(problems, solutions)
    
    # Summary
    print("\n" + "=" * 60)
    print("VALIDATION SUMMARY")
    print("=" * 60)
    print(f"Video mismatches: {len(video_mismatches)}")
    print(f"Code failures: {len(code_failures)}")
    
    # Output to file for review
    report = {
        "video_mismatches": video_mismatches,
        "code_failures": code_failures
    }
    
    with open("validation_report.json", "w") as f:
        json.dump(report, f, indent=2)
    print("\nFull report saved to validation_report.json")
    
    if video_mismatches or code_failures:
        sys.exit(1)
    else:
        print("\n✅ All validations passed!")
        sys.exit(0)


if __name__ == "__main__":
    main()
