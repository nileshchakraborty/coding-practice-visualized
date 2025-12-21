import json
import re

def normalize(text):
    return text.lower().strip()

def fix_invalid_only():
    # Load Invalid IDs List (hardcoded from validation output to be safe)
    invalid_slugs = [
      "ransom-note", "time-needed-to-buy-tickets", "two-sum-iv---input-is-a-bst",
      "h-index", "longest-mountain-in-array", "gfg---reverse-first-k-elements-of-a-queue",
      "substring-with-concatenation-of-all-words", "summary-ranges",
      "minimum-number-of-arrows-to-burst-balloons", "remove-duplicates-from-sorted-list-ii",
      "average-of-levels-in-binary-tree", "minimum-absolute-difference-in-bst",
      "minimum-genetic-mutation", "letter-case-permutation", "factorial-trailing-zeroes",
      "best-time-to-buy-and-sell-stock-iii", "search-in-a-binary-search-tree",
      "find-k-pairs-with-smallest-sums", "minimum-operations-to-reduce-an-integer-to-0",
      "integer-replacement", "transformed-array"
    ]

    try:
        with open('neetcode_channel_videos.json', 'r') as f:
            channel_videos = json.load(f)
        with open('api/data/solutions.json', 'r') as f:
            solution_data = json.load(f)
    except FileNotFoundError:
        print("Error: Missing input files.")
        return

    solutions = solution_data.get('solutions', {})
    
    updates = 0
    
    for slug in invalid_slugs:
        if slug not in solutions: continue
        
        sol = solutions[slug]
        title = sol.get('title', '').lower()
        
        candidates = []
        for vid in channel_videos:
            v_title = vid['title'].lower()
            if v_title.startswith(title):
                candidates.append(vid)
            
        if candidates:
            best = candidates[0]
            print(f"Fixing [{slug}]: {sol.get('videoId')} -> {best['videoId']} ('{best['title']}')")
            sol['videoId'] = best['videoId']
            updates += 1
        else:
            print(f"No match found for [{slug}] '{title}'")
            if sol.get('videoId'):
                print(f"  Clearing invalid ID: {sol.get('videoId')}")
                sol['videoId'] = None
                updates += 1

    if updates > 0:
        with open('api/data/solutions.json', 'w') as f:
            json.dump(solution_data, f, indent=2)
        print(f"Saved {updates} fixes.")

if __name__ == "__main__":
    fix_invalid_only()
