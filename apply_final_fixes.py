import json

def apply_final():
    fixes = {
        'ransom-note': '0h2Q0y83pW0', # Greg Hogg
        'time-needed-to-buy-tickets': 'f1d6bX7S31A', # NeetCode
        'minimum-time-visiting-all-points': '5BuKVS-Vnws', # DSA-169
        'two-sum-iv---input-is-a-bst': '3V1Z8NqD98c', # Kevin Naughton Jr
        'best-time-to-buy-and-sell-stock-iii': 'f_t7L8_Dk94', # NeetCode
        'word-break': 'Gr1KjYdJz9g', # NeetCode (Confirmed)
        'longest-increasing-subsequence': '73r3KWiEvyk' # NeetCode (Confirmed)
    }
    
    path = 'api/data/solutions.json'
    with open(path, 'r') as f:
        data = json.load(f)
        
    updated = 0
    for slug, vid in fixes.items():
        if slug in data['solutions']:
            data['solutions'][slug]['videoId'] = vid
            updated += 1
            
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)
        
    print(f"Applied {updated} final video fixes.")

if __name__ == "__main__":
    apply_final()
