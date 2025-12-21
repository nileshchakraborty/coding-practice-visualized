import json
import sys
import os

print("Starting analysis...", flush=True)

file_path = 'api/data/solutions.json'
if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    sys.exit(1)

try:
    with open(file_path, 'r') as f:
        data = json.load(f)
    print("Loaded JSON.", flush=True)
except Exception as e:
    print(f"Error loading JSON: {e}")
    sys.exit(1)

solutions = data.get('solutions', {})
print(f"Solutions count: {len(solutions)}", flush=True)

vid_map = {}

for slug, sol in solutions.items():
    vid = sol.get('videoId')
    if vid:
        if vid not in vid_map:
            vid_map[vid] = []
        vid_map[vid].append(slug)

print("Check Duplicates:", flush=True)
for vid, slugs in vid_map.items():
    if len(slugs) > 1:
        print(f"Video ID {vid} is used by {len(slugs)} problems: {slugs}", flush=True)

print(f"Total unique videos: {len(vid_map)}", flush=True)
