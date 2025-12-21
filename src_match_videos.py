import json
import re

def normalize(text):
    return text.lower()

def fix_from_channel():
    try:
        with open('neetcode_channel_videos.json', 'r') as f:
            channel_videos = json.load(f)
        with open('api/data/solutions.json', 'r') as f:
            solution_data = json.load(f)
    except FileNotFoundError:
        print("Error: Missing input files (run fetch_channel_videos.py first).")
        return

    solutions = solution_data.get('solutions', {})
    
    video_map = []
    for vid in channel_videos:
        video_map.append({
            'title_norm': normalize(vid['title']),
            'videoId': vid['videoId'],
            'original_title': vid['title']
        })
        
    updated_count = 0
    
    for slug, sol in solutions.items():
        title = sol.get('title', slug).lower()
        
        candidates = [v for v in video_map if title in v['title_norm']]
        
        if candidates:
            # Prioritize "Python" if multiple
            best_match = candidates[0] 
            python_matches = [c for c in candidates if 'python' in c['title_norm']]
            if python_matches:
                best_match = python_matches[0]
            
            current_vid = sol.get('videoId')
            new_vid = best_match['videoId']
            
            if current_vid != new_vid:
                print(f"Updating '{title}': {current_vid} -> {new_vid} (Found in '{best_match['original_title']}')")
                sol['videoId'] = new_vid
                updated_count += 1
    
    print(f"Total Updates: {updated_count}")
    
    if updated_count > 0:
        with open('api/data/solutions.json', 'w') as f:
            json.dump(solution_data, f, indent=2)
        print("solutions.json saved.")

if __name__ == "__main__":
    fix_from_channel()
