
import json
import os

SOLUTIONS_PATH = 'api/data/solutions.json'

def verify():
    with open(SOLUTIONS_PATH, 'r') as f:
        data = json.load(f)
    
    code = data['valid-palindrome']['implementations']['javascript']['code']
    print("--- CODE START ---")
    print(code)
    print("--- CODE END ---")

if __name__ == "__main__":
    verify()
