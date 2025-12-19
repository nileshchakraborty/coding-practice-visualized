
import json
import re

SOLUTIONS_FILE = 'data/solutions.json'
RAW_DATA_FILE = 'data/merged_problems_raw.json'

def parse_example(text):
    # Try to extract Input and Output
    # Format: Input: ... \nOutput: ... (\nExplanation: ...)?
    
    # Normalize newlines
    text = text.replace('\r\n', '\n').strip()
    
    input_match = re.search(r'Input:\s*(.*?)\nOutput:', text, re.DOTALL)
    output_match = re.search(r'\nOutput:\s*(.*?)(?:\nExplanation:|$)', text, re.DOTALL)
    
    if input_match and output_match:
        inp = input_match.group(1).strip()
        out = output_match.group(1).strip()
        return {"input": inp, "output": out}
    return None

def fill_real_data():
    print("Loading solutions...")
    with open(SOLUTIONS_FILE, 'r') as f:
        solutions_data = json.load(f)
        solutions = solutions_data.get('solutions', {})
        
    print("Loading raw LeetCode data (19MB)...")
    try:
        with open(RAW_DATA_FILE, 'r') as f:
            raw_data = json.load(f)
            # Assuming raw_data is { "questions": [...] }
            questions = raw_data.get('questions', [])
    except Exception as e:
        print(f"Error loading raw data: {e}")
        return

    # Index raw data by slug AND title
    raw_map = {}
    title_map = {}
    for q in questions:
        # standard slug
        if 'problem_slug' in q:
            raw_map[q['problem_slug']] = q
        if 'title' in q:
            title_map[q['title'].lower()] = q
    
    # Explicit Mappings
    slug_mapping = {
        'lowest-common-ancestor-of-a-bst': 'lowest-common-ancestor-of-a-binary-search-tree',
        'powx,-n': 'powx-n',
        'gfg---reverse-first-k-elements-of-a-queue': 'reverse-first-k-elements-of-queue'  # GFG usually not in LC dataset, but worth a try if valid slug
    }
    
    print(f"Indexed {len(raw_map)} raw questions.")
    
    updated_count = 0
    missing_raw = 0
    
    for slug, sol in solutions.items():
        raw_q = None
        
        # Check Explicit Mapping
        search_slug = slug
        if slug in slug_mapping:
            search_slug = slug_mapping[slug]

        # Try exact slug match
        if search_slug in raw_map:
            raw_q = raw_map[search_slug]
        # Try flexible slug match (replace --- with -)
        elif slug.replace('---', '-') in raw_map:
             raw_q = raw_map[slug.replace('---', '-')]
        # Try Title match (from solution title or problem title)
        else:
            sol_title = sol.get('title', '').lower()
            if sol_title in title_map:
                raw_q = title_map[sol_title]
                print(f"Matched {slug} via Title '{sol['title']}'")
            # Try removing special chars from slug?
            # e.g. powx,-n -> powx-n
            
            
        if raw_q:
            
            # 1. Update Description
            # Clean up unicode non-breaking spaces
            desc = raw_q.get('description', '').replace('\u00a0', ' ')
            if desc:
                sol['problemStatement'] = desc
                
            # 2. Update Test Cases
            examples = raw_q.get('examples', [])
            new_test_cases = []
            for ex in examples:
                parsed = parse_example(ex['example_text'])
                if parsed:
                    new_test_cases.append(parsed)
            
            if new_test_cases:
                sol['testCases'] = new_test_cases
                
            # 3. Update Title/Metadata
            if 'title' in raw_q:
                sol['title'] = raw_q['title']
            if 'difficulty' in raw_q:
                sol['difficulty'] = raw_q['difficulty']
                
            updated_count += 1
        else:
            print(f"⚠️ No raw data found for slug: {slug}")
            missing_raw += 1
            
    print(f"Updated {updated_count} solutions with real data.")
    print(f"Missing raw data for {missing_raw} slugs.")
    
    # Save
    solutions_data['solutions'] = solutions
    with open(SOLUTIONS_FILE, 'w') as f:
        json.dump(solutions_data, f, indent=4)
        print("Saved solutions.json")

if __name__ == "__main__":
    fill_real_data()
