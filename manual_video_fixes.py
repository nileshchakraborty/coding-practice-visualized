import json

def apply_manual_fixes():
    # Consolidated list of ALL user provided fixes
    fixes = {
        # Batch 1 (Step 1962 & 1968)
        'factorial-trailing-zeroes': '_NxbBkunCEM',
        'find-k-pairs-with-smallest-sums': 'Youk8DDnLU8',
        'integer-replacement': 'xzoLTiPDY0M',
        'letter-case-permutation': 'IYXWcjwhUYo',
        'minimum-genetic-mutation': '9lkn3rHCSLg',
        'minimum-interval-to-include-each-query': '5hQ5WWW5awQ',
        'minimum-operations-to-reduce-an-integer-to-0': 'O3VbqTLzTu8',
        'search-in-a-binary-search-tree': 'kPcYYCbUUEA',
        'transformed-array': 'b5vu-orCfYQ',
        'gfg---reverse-first-k-elements-of-a-queue': 'VAZkSMoNHik',
        'word-break': 'Sx9NNgInc3A',

        # Batch 2 (Step 1997 - Final Missing 15)
        'average-of-levels-in-binary-tree': '115txA-rS5s',
        'best-time-to-buy-and-sell-stock-iii': '37s1_xBiqH0',
        'count-and-say': 'htSwmFGdFUI',
        'h-index': 'mgG5KFTvfPw',
        'how-many-numbers-are-smaller-than-the-current-number': 'yajqqld8Svc',
        'longest-mountain-in-array': 'rh2Bkul2zzQ',
        'minimum-absolute-difference-in-bst': 'NttA_NC_ZhI',
        'minimum-number-of-arrows-to-burst-balloons': 'lPmkKnvNPrw',
        'ransom-note': 'i3bvxJyUB40',
        'remove-duplicates-from-sorted-list-ii': 'ycAq8iqh0TI',
        'same-tree': 'vRbbcKXCxOw',
        'substring-with-concatenation-of-all-words': '-wlDdMmaYwI',
        'summary-ranges': 'ZHJDwbfqoa8',
        'time-needed-to-buy-tickets': 'cVmS9N6kf2Y',
        'two-sum-iv---input-is-a-bst': 'ssL3sHwPeb4'
    }
    
    path = 'api/data/solutions.json'
    with open(path, 'r') as f:
        data = json.load(f)

    updated = 0
    for slug, vid in fixes.items():
        if slug in data['solutions']:
            data['solutions'][slug]['videoId'] = vid
            updated += 1
        else:
            print(f"Warning: Slug '{slug}' not found.")
            
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Applied {updated} manual fixes.")

if __name__ == "__main__":
    apply_manual_fixes()
