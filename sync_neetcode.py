import json
import requests
import os

URL = "https://raw.githubusercontent.com/neetcode-gh/leetcode/main/.problemSiteData.json"
PROBLEMS_FILE = "data/problems.json"

# Category Mapping (NeetCode -> LeetCode Top 150 style)
CATEGORY_MAP = {
    "Arrays & Hashing": "Array / String", # Roughly
    "Two Pointers": "Two Pointers",
    "Sliding Window": "Sliding Window",
    "Stack": "Stack",
    "Binary Search": "Binary Search",
    "Linked List": "Linked List",
    "Trees": "Binary Tree General", # Or Binary Search Tree
    "Tries": "Trie",
    "Backtracking": "Backtracking",
    "Graphs": "Graph General",
    "Advanced Graphs": "Graph General",
    "1-D DP": "1D DP",
    "2-D DP": "Multidimensional DP",
    "Bit Manipulation": "Bit Manipulation",
    "Math & Geometry": "Math",
    "Intervals": "Intervals",
    "Greedy": "Greedy",
    "Heap / Priority Queue": "Heap"
}

def sync():
    print(f"Downloading NeetCode data from {URL}...")
    try:
        resp = requests.get(URL)
        resp.raise_for_status()
        neetcode_data = resp.json()
    except Exception as e:
        print(f"Failed to download: {e}")
        return

    # Filter for NeetCode 150
    nc_150 = [p for p in neetcode_data if p.get("neetcode150") == True]
    print(f"Found {len(nc_150)} NeetCode 150 problems.")

    # Load local problems
    with open(PROBLEMS_FILE, 'r') as f:
        local_data = json.load(f)

    local_problems_map = {} # slug -> exists
    for cat in local_data["categories"]:
        for p in cat["problems"]:
            local_problems_map[p["slug"]] = True

    added_count = 0
    
    for item in nc_150:
        slug = item["link"].strip("/")
        if slug in local_problems_map:
            continue
            
        # Add new problem
        title = item["problem"]
        difficulty = item["difficulty"]
        
        # Determine category
        nc_pattern = item.get("pattern", "Uncategorized")
        target_category_name = CATEGORY_MAP.get(nc_pattern, nc_pattern)
        
        # New problem object
        new_prob = {
            "title": title,
            "difficulty": difficulty,
            "url": f"https://leetcode.com/problems/{slug}/",
            "slug": slug,
            "subTopic": target_category_name,
            "description": "", # Missing, need to fetch?
            "pattern": nc_pattern, # Keep original pattern as hint
            "has_solution": False
        }
        
        # Find or create category in local_data
        target_cat = next((c for c in local_data["categories"] if c["name"] == target_category_name), None)
        
        if not target_cat:
            # Create new category
            print(f"Creating new category: {target_category_name}")
            target_cat = {
                "name": target_category_name,
                "icon": "📝", # Default icon
                "problems": []
            }
            local_data["categories"].append(target_cat)
            
        target_cat["problems"].append(new_prob)
        added_count += 1
        print(f"Added: {slug} to {target_category_name}")

    if added_count > 0:
        with open(PROBLEMS_FILE, 'w') as f:
            json.dump(local_data, f, indent=4)
        print(f"Successfully added {added_count} problems to {PROBLEMS_FILE}")
    else:
        print("No new problems to add. All synced.")

if __name__ == "__main__":
    sync()
