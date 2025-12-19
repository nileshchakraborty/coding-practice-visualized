import json

with open('data/solutions.json', 'r') as f:
    data = json.load(f)

solutions = data.get('solutions', {})
legacy_steps = []
modern_steps = []
has_type_no_steps = []
no_viz = []

for slug, sol in solutions.items():
    has_legacy = 'steps' in sol and sol['steps']
    has_modern = 'animationSteps' in sol and sol['animationSteps']
    has_type = 'visualizationType' in sol
    
    if has_legacy:
        legacy_steps.append(slug)
    if has_modern:
        modern_steps.append(slug)
    if has_type and not has_modern and not has_legacy:
        has_type_no_steps.append(slug)
    if not has_type:
        no_viz.append(slug)

print(f"Total solutions: {len(solutions)}")
print(f"With legacy 'steps': {len(legacy_steps)}")
print(f"With modern 'animationSteps': {len(modern_steps)}")
print(f"Has 'visualizationType' but NO steps: {len(has_type_no_steps)}")
print(f"No visualization info: {len(no_viz)}")

print("\nSample legacy 'steps':", legacy_steps[:5])
print("\nSample type but no steps:", has_type_no_steps[:5])
