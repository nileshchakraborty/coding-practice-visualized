import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("YOUTUBE_API_KEY")
CHANNEL_HANDLE = "@GeeksforGeeksVideos" # User requested check

def get_channel_id(handle):
    url = f"https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle={handle}&key={API_KEY}"
    resp = requests.get(url)
    data = resp.json()
    items = data.get('items', [])
    if not items:
        # Fallback to search if handle resolution fails or isn't supported by key type
        print(f"Handle resolution failed, trying search for {handle}...")
        search_url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q={handle}&key={API_KEY}"
        resp = requests.get(search_url)
        data = resp.json()
        items = data.get('items', [])
        
    if items:
        return items[0]['id'], items[0]['contentDetails']['relatedPlaylists']['uploads']
    return None, None

def fetch_all_videos():
    if not API_KEY:
        print("Error: YOUTUBE_API_KEY not found in .env")
        return

    print(f"Resolving channel {CHANNEL_HANDLE}...")
    try:
        # Note: 'forHandle' parameter might require specific API version setup, 
        # but let's try the standard search fallback included above.
        channel_id, uploads_playlist_id = get_channel_id(CHANNEL_HANDLE)
    except Exception as e:
        print(f"Error resolving channel: {e}")
        return

    if not uploads_playlist_id:
        print("Could not find uploads playlist for channel.")
        return

    print(f"Found Channel ID: {channel_id}")
    print(f"Fetching videos from Uploads Playlist: {uploads_playlist_id}...")

    videos = []
    next_page_token = None
    
    while True:
        pl_url = f"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId={uploads_playlist_id}&maxResults=50&key={API_KEY}"
        if next_page_token:
            pl_url += f"&pageToken={next_page_token}"
            
        resp = requests.get(pl_url)
        if resp.status_code != 200:
            print(f"Error fetching playlist: {resp.text}")
            break
            
        data = resp.json()
        items = data.get('items', [])
        
        for item in items:
            snippet = item['snippet']
            videos.append({
                'title': snippet['title'],
                'videoId': snippet['resourceId']['videoId'],
                'publishedAt': snippet['publishedAt']
            })
            
        next_page_token = data.get('nextPageToken')
        print(f"Fetched {len(videos)} videos so far...")
        
        if not next_page_token:
            break

    # Save to file
    outfile = 'neetcode_channel_videos.json'
    with open(outfile, 'w') as f:
        json.dump(videos, f, indent=2)
        
    print(f"Done! Saved {len(videos)} videos to {outfile}")

if __name__ == "__main__":
    fetch_all_videos()
