#!/usr/bin/env python3
"""
Script to audit solutions.json for missing or problematic visualization data.
"""
import json
from pathlib import Path
from collections import defaultdict

def audit_visualizations():
    solutions_path = Path("api/data/solutions.json")
    
    with open(solutions_path, 'r') as f:
        data = json.load(f)
    
    # Handle nested structure
    solutions = data.get("solutions", data)
    
    issues = defaultdict(list)
    
    for slug, data in solutions.items():
        vis_type = data.get("visualizationType", "")
        animation_steps = data.get("animationSteps", [])
        initial_state = data.get("initialState", [])
        
        # Check 1: Missing visualizationType
        if not vis_type:
            issues["missing_visualizationType"].append(slug)
            continue
            
        # Check 2: Missing or empty animationSteps
        if not animation_steps:
            issues["missing_animationSteps"].append(slug)
            continue
            
        # Check 3: Less than 3 animation steps (too few to be useful)
        if len(animation_steps) < 3:
            issues["too_few_steps"].append((slug, len(animation_steps)))
            continue
        
        # Check 4: Generic/placeholder animation steps
        first_step = animation_steps[0] if animation_steps else {}
        first_visual = first_step.get("visual", "")
        
        # Check if using generic array-based visualization for graph problems
        if vis_type == "graph":
            has_graph_state = any("graphState" in step for step in animation_steps)
            has_array_state = any("arrayState" in step and isinstance(step.get("arrayState"), list) and 
                                  all(isinstance(x, (int, float)) for x in step.get("arrayState", [])) 
                                  for step in animation_steps)
            
            if not has_graph_state and has_array_state:
                issues["graph_using_array_state"].append(slug)
        
        # Check 5: All steps have same visual text (placeholder)
        visuals = [step.get("visual", "") for step in animation_steps]
        if len(set(visuals)) < 3 and len(animation_steps) >= 5:
            issues["repetitive_visuals"].append(slug)
        
        # Check 6: Steps only have generic "Visit node X" pattern
        generic_pattern_count = sum(1 for v in visuals if v.startswith("Visit node") or v.startswith("BFS/DFS step"))
        if generic_pattern_count > len(visuals) * 0.7:
            issues["generic_visit_pattern"].append(slug)
        
        # Check 7: Empty initialState for non-string problems
        if not initial_state and vis_type in ["array", "matrix", "tree", "graph"]:
            issues["empty_initialState"].append(slug)
    
    # Print report
    print("=" * 60)
    print("VISUALIZATION AUDIT REPORT")
    print("=" * 60)
    print(f"\nTotal problems analyzed: {len(solutions)}\n")
    
    total_issues = 0
    for issue_type, slugs in sorted(issues.items()):
        if slugs:
            total_issues += len(slugs)
            print(f"\n### {issue_type.replace('_', ' ').upper()} ({len(slugs)})")
            for item in slugs[:10]:  # Show first 10
                if isinstance(item, tuple):
                    print(f"  - {item[0]} ({item[1]} steps)")
                else:
                    print(f"  - {item}")
            if len(slugs) > 10:
                print(f"  ... and {len(slugs) - 10} more")
    
    print(f"\n{'=' * 60}")
    print(f"TOTAL ISSUES FOUND: {total_issues}")
    print("=" * 60)
    
    # Return detailed data for further processing
    return issues

if __name__ == "__main__":
    audit_visualizations()
