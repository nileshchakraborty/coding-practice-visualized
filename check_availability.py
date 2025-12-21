import json
import urllib.request
import concurrent.futures

def check_video(vid, slugs):
    url = f"https://www.youtube.com/watch?v={vid}"
    try:
        # User-Agent is required to avoid 429 or immediate block, though YouTube is strict.
        req = urllib.request.Request(
            url, 
            data=None, 
            headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
            }
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            content = response.read().decode('utf-8', errors='ignore')
            if "Video unavailable" in content:
                return (vid, slugs, "Unavailable")
            return (vid, slugs, "Available")
    except Exception as e:
        return (vid, slugs, f"Error: {e}")

def main():
    with open('api/data/solutions.json', 'r') as f:
        data = json.load(f)

    solutions = data.get('solutions', {})
    vid_map = {} # vid -> list of slugs

    for slug, sol in solutions.items():
        vid = sol.get('videoId')
        if vid:
            if vid not in vid_map:
                vid_map[vid] = []
            vid_map[vid].append(slug)
    
    print(f"Checking {len(vid_map)} videos...")
    
    broken_count = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(check_video, vid, slugs): vid for vid, slugs in vid_map.items()}
        for future in concurrent.futures.as_completed(futures):
            vid, slugs, status = future.result()
            if status != "Available":
                print(f"BROKEN: {vid} (Slugs: {slugs}) - Status: {status}")
                broken_count += 1
            # else: print(".", end="", flush=True)

    print(f"\nTotal Broken Videos: {broken_count}")

if __name__ == "__main__":
    main()
