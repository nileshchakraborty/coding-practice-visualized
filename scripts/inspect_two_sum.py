
import json
import os

SOLUTIONS_PATH = 'api/data/solutions.json'

def inspect():
    with open(SOLUTIONS_PATH, 'r') as f:
        data = json.load(f)
    
    p = data.get('two-sum', {})
    print("--- ROOT INITIAL CODE ---")
    print(p.get('initialCode'))
    
    print("\n--- PYTHON IMPL ---")
    print(p.get('implementations', {}).get('python', {}).get('initialCode'))

if __name__ == "__main__":
    inspect()
