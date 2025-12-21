import json
import os

def sync_videos():
    # 1. Load Local
    path_local = 'api/data/solutions.json'
    with open(path_local, 'r') as f:
        data_local = json.load(f)
    solutions = data_local['solutions']

    # 2. Load NeetCode Metadata
    try:
        with open('neetcode_metadata.json', 'r') as f:
            meta_list = json.load(f)
    except:
        meta_list = []
        print("Warning: neetcode_metadata.json not found or invalid.")

    # 3. Load User Remote
    try:
        with open('api/data/solutions_remote.json', 'r') as f:
            data_remote = json.load(f)
        remote_solutions = data_remote.get('solutions', {})
    except:
        remote_solutions = {}
        print("Warning: solutions_remote.json not found or invalid.")

    # Build Map 1: NeetCode Metadata (High Trust)
    # slug -> videoId
    meta_map = {}
    for item in meta_list:
        slug = item.get('link', '').strip('/')
        vid = item.get('video')
        if slug and vid:
            meta_map[slug] = vid

    # Build Map 2: Remote Solutions (Medium Trust)
    remote_map = {}
    for slug, sol in remote_solutions.items():
        vid = sol.get('videoId')
        if vid:
            remote_map[slug] = vid

    updated_meta = 0
    updated_remote = 0
    
    # Priority: 
    # 1. Use NeetCode Metadata (Official)
    # 2. Use Remote Solutions (Backup)
    # 3. Compare with invalid? (We assume current invalid IDs need replacement)
    
    for slug, sol in solutions.items():
        old_vid = sol.get('videoId')
        
        # Try Metadata First
        if slug in meta_map:
            new_vid = meta_map[slug]
            if new_vid != old_vid:
                sol['videoId'] = new_vid
                updated_meta += 1
                continue # Done with this one
                
        # Try Remote Second
        if slug in remote_map:
            new_vid = remote_map[slug]
            if new_vid != old_vid:
                sol['videoId'] = new_vid
                updated_remote += 1
                
    print(f"Sync Complete.")
    print(f"  Updated from NeetCode Metadata: {updated_meta}")
    print(f"  Updated from Remote Source: {updated_remote}")
    
    with open(path_local, 'w') as f:
        json.dump(data_local, f, indent=2)

if __name__ == "__main__":
    sync_videos()
