#!/usr/bin/env python3
"""
Find all video mismatches by comparing YouTube video titles with problem titles.
"""

import json
import requests
import time
import re

API_KEY = 'temp-youtube-api-key'
SOLUTIONS_FILE = "api/data/solutions.json"
PROBLEMS_FILE = "api/data/problems.json"

def normalize(text):
    """Normalize text for comparison."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_leetcode_number(title):
    """Extract leetcode problem number from video title."""
    match = re.search(r'leetcode\s*(\d+)', title.lower())
    return match.group(1) if match else None

def main():
    # Load data
    with open(PROBLEMS_FILE, "r") as f:
        problems_data = json.load(f)
    
    with open(SOLUTIONS_FILE, "r") as f:
        solutions = json.load(f)
    
    # Build problem slug -> title mapping
    problems = {}
    for cat in problems_data["categories"]:
        for prob in cat["problems"]:
            problems[prob["slug"]] = prob["title"]
    
    # Collect all video IDs
    video_map = {}  # videoId -> (slug, problem_title)
    for slug, sol in solutions.items():
        video_id = sol.get("videoId")
        if video_id:
            video_map[video_id] = (slug, problems.get(slug, sol.get("title", slug)))
    
    video_ids = list(video_map.keys())
    print(f"Checking {len(video_ids)} videos against YouTube API...")
    
    # Batch API calls
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
                    video_titles[item["id"]] = {
                        "title": item["snippet"]["title"],
                        "channel": item["snippet"]["channelTitle"]
                    }
            else:
                print(f"API error: {response.status_code}")
        except Exception as e:
            print(f"Request failed: {e}")
        
        # Small delay to avoid rate limiting
        time.sleep(0.1)
    
    # Find mismatches
    mismatches = []
    missing = []
    valid = []
    
    for video_id, (slug, problem_title) in video_map.items():
        if video_id not in video_titles:
            missing.append({
                "slug": slug,
                "problem_title": problem_title,
                "video_id": video_id
            })
            continue
        
        video_info = video_titles[video_id]
        video_title = video_info["title"]
        
        # Normalize for comparison
        norm_problem = normalize(problem_title)
        norm_video = normalize(video_title)
        
        # Check for significant word overlap
        problem_words = set(norm_problem.split()) - {"a", "the", "of", "in", "for", "to", "and", "or", "is", "with", "ii", "iii", "iv"}
        video_words = set(norm_video.split()) - {"a", "the", "of", "in", "for", "to", "and", "or", "is", "with", "python", "java", "javascript", "leetcode", "dynamic", "programming", "neetcode"}
        
        # Count overlapping significant words
        overlap = problem_words & video_words
        
        # Consider it a match if at least 2 key words overlap OR problem title is largely contained
        is_match = (
            len(overlap) >= 2 or 
            norm_problem in norm_video or
            any(len(w) > 5 and w in norm_video for w in problem_words)
        )
        
        if not is_match:
            mismatches.append({
                "slug": slug,
                "problem_title": problem_title,
                "video_id": video_id,
                "video_title": video_title,
                "channel": video_info["channel"],
                "overlap": list(overlap)
            })
        else:
            valid.append(slug)
    
    # Output results
    print(f"\n{'='*60}")
    print("RESULTS")
    print(f"{'='*60}")
    print(f"Valid: {len(valid)}")
    print(f"Mismatched: {len(mismatches)}")
    print(f"Missing/unavailable: {len(missing)}")
    
    if mismatches:
        print(f"\n{'='*60}")
        print("MISMATCHED VIDEOS (problem title doesn't match video title)")
        print(f"{'='*60}")
        for m in mismatches:
            print(f"\n[{m['slug']}]")
            print(f"  Problem: {m['problem_title']}")
            print(f"  Video:   {m['video_title']}")
            print(f"  Channel: {m['channel']}")
            print(f"  ID:      {m['video_id']}")
    
    if missing:
        print(f"\n{'='*60}")
        print("MISSING/UNAVAILABLE VIDEOS")
        print(f"{'='*60}")
        for m in missing[:20]:
            print(f"  [{m['slug']}] {m['video_id']}")
    
    # Save full report
    report = {
        "valid_count": len(valid),
        "mismatch_count": len(mismatches),
        "missing_count": len(missing),
        "mismatches": mismatches,
        "missing": missing
    }
    
    with open("video_mismatch_report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\nFull report saved to video_mismatch_report.json")

if __name__ == "__main__":
    main()
