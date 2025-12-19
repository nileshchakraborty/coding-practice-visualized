
import json
import time
from ai_engine import generate_visualization_steps

def run_generation():
    with open('data/solutions.json', 'r') as f:
        data = json.load(f)

    solutions = data.get('solutions', {})
    
    # Candidates: Array/String type, no animationSteps
    candidates = []
    
    for slug, sol in solutions.items():
        has_viz_type = sol.get('visualizationType') in ['array', 'string']
        has_steps = 'animationSteps' in sol and sol['animationSteps']
        
        if has_viz_type and not has_steps:
            candidates.append(slug)
            
    print(f"Found {len(candidates)} candidates for visualization generation.")
    
    # Process all candidates
    batch = candidates
    print(f"Processing all {len(batch)} remaining candidates...")
    
    success_count = 0
    
    for i, slug in enumerate(batch):
        sol = solutions[slug]
        print(f"[{i+1}/{len(batch)}] Generating for {slug}...")
        
        try:
            steps = generate_visualization_steps(
                sol['title'],
                sol['code'],
                sol['initialState'],
                sol['visualizationType']
            )
            
            if steps:
                print(f"✅ Generated {len(steps)} steps for {slug}")
                sol['animationSteps'] = steps
                success_count += 1
                
                # Save incrementally every successful generation to avoid data loss
                with open('data/solutions.json', 'w') as f:
                    json.dump(data, f, indent=4)
                    
            else:
                print(f"⚠️ Failed to generate steps for {slug}")
                
        except Exception as e:
            print(f"❌ Error for {slug}: {e}")
            
        # Rate limit - slightly longer for safety
        time.sleep(2)
        
    print(f"Completed! Generated {success_count} new visualizations.")

if __name__ == "__main__":
    run_generation()
