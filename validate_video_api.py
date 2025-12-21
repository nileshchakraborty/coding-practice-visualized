import os
import json
import requests
from dotenv import load_dotenv

# Load env variables (looking for YOUTUBE_API_KEY)
load_dotenv()
API_KEY = os.getenv("YOUTUBE_API_KEY")

def validate_videos():
    if not API_KEY:
        print("Error: YOUTUBE_API_KEY not found in environment variables.")
        print("Please add YOUTUBE_API_KEY=your_key_here to your .env file.")
        return

    # Load local solutions
    try:
        with open('api/data/solutions.json', 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("Error: api/data/solutions.json not found.")
        return

    solutions = data.get('solutions', {})
    # Extract non-null video IDs
    vid_map = {v['videoId']: k for k, v in solutions.items() if v.get('videoId')}
    video_ids = list(vid_map.keys())
    
    print(f"Validating {len(video_ids)} video IDs against YouTube API...")

    # YouTube API supports batching up to 50 IDs
    chunk_size = 50
    invalid_ids = []
    
    for i in range(0, len(video_ids), chunk_size):
        chunk = video_ids[i:i + chunk_size]
        ids_param = ",".join(chunk)
        url = f"https://www.googleapis.com/youtube/v3/videos?part=id&id={ids_param}&key={API_KEY}"
        
        try:
            response = requests.get(url)
            if response.status_code != 200:
                print(f"API Error: {response.status_code} - {response.text}")
                continue
                
            results = response.json()
            found_ids = {item['id'] for item in results.get('items', [])}
            
            # Identify which requested IDs were NOT returned
            for vid in chunk:
                if vid not in found_ids:
                    invalid_ids.append(vid)
                    
        except Exception as e:
            print(f"Request failed: {e}")

    print("\n--- Validation Results ---")
    if invalid_ids:
        print(f"Found {len(invalid_ids)} INVALID video IDs:")
        for vid in invalid_ids:
            slug = vid_map.get(vid, "Unknown Problem")
            print(f"  - [{slug}] {vid} (Not found on YouTube)")
            
        import sys
        if "--fix" in sys.argv:
            print("\nApplying fixes (Nullifying invalid IDs)...")
            count = 0
            for vid in invalid_ids:
                slug = vid_map.get(vid)
                if slug and slug in solutions:
                    solutions[slug]['videoId'] = None
                    count += 1
            
            with open('api/data/solutions.json', 'w') as f:
                json.dump(data, f, indent=2)
            print(f"Fixed/Nullified {count} problems.")
    else:
        print("SUCCESS: All checked video IDs exist on YouTube.")

if __name__ == "__main__":
    validate_videos()
