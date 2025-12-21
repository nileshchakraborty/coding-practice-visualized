import json

# Manual fixes for top problems
FIXES = {
    'contains-duplicate': '3OamzN90kPg',
    'ransom-note': None, # No video found
    'rotate-array': 'BHr381Guz3Y',
    'longest-increasing-subsequence': 'cjWnW0hdF1Y',
    'search-insert-position': 'K-RYzDZkzCI'
}

# Calculated from previous step
BROKEN_IDS = [
    'nT35S_W_c8g', 'OKmDwbsROuc', '6Sk5xZCr94o', 'QJz-0VmNpuE', 'a1v3GIaJNoM', 
    'cxoOxinXYiE', 'x2K_4xNxCME', 'jhzZmG0WfoU', 'QzPWc0yI-C0', 'TzMl5gId3s0', 
    'VtM-0OYcRtE', 'zYQC7d06G_g', 'Cpg_BFTU5UQ', '8vuPi0rPWOk', 'cYbN9p1uPQY', 
    'ZoLasC3JuNg', 'lPmkKnxBFs0', 'aBNILPZdQNc', 'R9jDoJq_Qv4', 'vm-2tbxcCPo', 
    'p-pQW3Y-x9I', 'i3_fDqR_dYs', '9LxvhVvBnCI', 'H6VdY3SxjMM', 'lxvKVFC6qT0', 
    'hwLRMlnY2Zk', 'K-Yh3K8E2oE', 'A2M7Kj6p0w4', '3Hdmq_GSgyI', 'zdMhg-EuXgI', 
    'Bb9lSXgGMzk', 'cjWnW0hdVeY', '4YjWuPLN_wg', 'Zv-jagL2_T4', 'q1Q7EZ1CUOE', 
    '0_Kz25a_chk', 'Fv9MY2gLlp8', 'rI2EBUEMfTY', 'w8pfNaHXopQ', 'nbFXQm1iVgU', 
    'XbGD7zfHkkY', 'amvrKhR-e80', '1vC1iM-yd7Q'
]

def patch_solutions():
    with open('api/data/solutions.json', 'r') as f:
        data = json.load(f)
    
    solutions = data['solutions']
    updates = 0
    nullified = 0
    
    # 1. Apply Top Fixes
    for slug, vid in FIXES.items():
        if slug in solutions:
            solutions[slug]['videoId'] = vid
            updates += 1
            print(f"Updated {slug} to {vid}")

    # 2. Nullify other broken IDs
    for slug, sol in solutions.items():
        if sol.get('videoId') in BROKEN_IDS:
            if slug not in FIXES: # Don't overwrite our fixes
                # Double check to preserve valid ones if ID matches? 
                # Broken IDs are unique enough.
                solutions[slug]['videoId'] = None
                nullified += 1
                print(f"Nullified broken video for {slug}")

    # Save
    with open('api/data/solutions.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"\nTotal Manual Fixes: {updates}")
    print(f"Total Nullified: {nullified}")

if __name__ == "__main__":
    patch_solutions()
