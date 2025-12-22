
import requests

try:
    resp = requests.get('http://localhost:11434/api/tags')
    if resp.status_code == 200:
        models = resp.json().get('models', [])
        print("Available models:")
        for m in models:
            print(f"- {m['name']}")
    else:
        print(f"Error: {resp.status_code}")
except Exception as e:
    print(f"Connection failed: {e}")
