import re
import json

# Load current problems
with open('data/problems.json', 'r') as f:
    current_data = json.load(f)

current_slugs = set()
for cat in current_data['categories']:
    for p in cat['problems']:
        current_slugs.add(p['slug'])

print(f"Current problems: {len(current_slugs)}")

# Extract from HTML (simple regex for href="/problems/slug/")
with open('neetcode_raw.html', 'r', encoding='utf-8') as f:
    html = f.read()

# NeetCode links usually look like href="https://leetcode.com/problems/duplicate-emails/"
# or just names in the table. Let's try to extract leetcode URLs.
leetcode_urls = re.findall(r'https://leetcode.com/problems/([a-z0-9-]+)/?', html)
# Also try finding pattern if they use relative links or just text.
# The neetcode.io/practice page is a SPA, so raw HTML might just be a shell.
# Let's check if we got anything.

unique_neetcode = set(leetcode_urls)
print(f"Found {len(unique_neetcode)} potential NeetCode problems from HTML.")

missing = unique_neetcode - current_slugs
print(f"Missing from current: {len(missing)}")
print("Sample missing:", list(missing)[:10])

# If extraction failed (SPA), use a known list or search API.
# NeetCode 150 is a specific subset.
# I might need to use a browser to get the real content if raw HTML is empty of data.
if len(unique_neetcode) < 10:
    print("WARNING: Raw HTML might be empty. Should use browser or hardcoded list.")
