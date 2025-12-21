#!/usr/bin/env python3
"""Fix graph visualization issues in solutions.json"""
import json

GRAPH_FIXES = {
    "clone-graph": [
        {"step": 1, "visual": "Input: Connected Graph", "transientMessage": "node.val = 1, neighbors = [2,4]", 
         "graphState": {"nodes": [{"id": "1", "label": "1", "x": 200, "y": 100}, {"id": "2", "label": "2", "x": 100, "y": 200}, 
                                  {"id": "3", "label": "3", "x": 300, "y": 200}, {"id": "4", "label": "4", "x": 200, "y": 300}],
                       "edges": [{"from": "1", "to": "2"}, {"from": "1", "to": "4"}, {"from": "2", "to": "3"}, {"from": "3", "to": "4"}]},
         "pointers": [], "color": "accent"},
        {"step": 2, "visual": "BFS: Start at node 1", "transientMessage": "Create clone, add to visited",
         "graphState": {"nodes": [{"id": "1", "label": "1 ✓", "x": 200, "y": 100, "visited": True}, {"id": "2", "label": "2", "x": 100, "y": 200},
                                  {"id": "3", "label": "3", "x": 300, "y": 200}, {"id": "4", "label": "4", "x": 200, "y": 300}],
                       "edges": [{"from": "1", "to": "2"}, {"from": "1", "to": "4"}, {"from": "2", "to": "3"}, {"from": "3", "to": "4"}]},
         "pointers": [{"label": "curr", "node": "1"}], "color": "accent"},
        {"step": 3, "visual": "Clone neighbors 2, 4", "transientMessage": "Connect clones to node 1",
         "graphState": {"nodes": [{"id": "1", "label": "1 ✓", "x": 200, "y": 100, "visited": True}, {"id": "2", "label": "2 ✓", "x": 100, "y": 200, "visited": True},
                                  {"id": "3", "label": "3", "x": 300, "y": 200}, {"id": "4", "label": "4 ✓", "x": 200, "y": 300, "visited": True}],
                       "edges": [{"from": "1", "to": "2", "highlight": True}, {"from": "1", "to": "4", "highlight": True}, {"from": "2", "to": "3"}, {"from": "3", "to": "4"}]},
         "pointers": [], "color": "accent"},
        {"step": 4, "visual": "Clone neighbor 3", "transientMessage": "Complete all edges",
         "graphState": {"nodes": [{"id": "1", "label": "1 ✓", "x": 200, "y": 100, "visited": True}, {"id": "2", "label": "2 ✓", "x": 100, "y": 200, "visited": True},
                                  {"id": "3", "label": "3 ✓", "x": 300, "y": 200, "visited": True}, {"id": "4", "label": "4 ✓", "x": 200, "y": 300, "visited": True}],
                       "edges": [{"from": "1", "to": "2"}, {"from": "1", "to": "4"}, {"from": "2", "to": "3", "highlight": True}, {"from": "3", "to": "4", "highlight": True}]},
         "pointers": [], "color": "success"}
    ],
    "course-schedule": [
        {"step": 1, "visual": "Build DAG", "transientMessage": "prereqs=[[1,0],[2,0],[3,1],[3,2]]",
         "graphState": {"nodes": [{"id": "0", "label": "0", "x": 200, "y": 50}, {"id": "1", "label": "1", "x": 100, "y": 150},
                                  {"id": "2", "label": "2", "x": 300, "y": 150}, {"id": "3", "label": "3", "x": 200, "y": 250}],
                       "edges": [{"from": "0", "to": "1"}, {"from": "0", "to": "2"}, {"from": "1", "to": "3"}, {"from": "2", "to": "3"}]},
         "pointers": [], "color": "accent"},
        {"step": 2, "visual": "Indegree = [0,1,1,2]", "transientMessage": "Course 0 has no prereqs",
         "graphState": {"nodes": [{"id": "0", "label": "0 (in:0)", "x": 200, "y": 50, "highlight": True}, {"id": "1", "label": "1 (in:1)", "x": 100, "y": 150},
                                  {"id": "2", "label": "2 (in:1)", "x": 300, "y": 150}, {"id": "3", "label": "3 (in:2)", "x": 200, "y": 250}],
                       "edges": [{"from": "0", "to": "1"}, {"from": "0", "to": "2"}, {"from": "1", "to": "3"}, {"from": "2", "to": "3"}]},
         "pointers": [], "color": "accent"},
        {"step": 3, "visual": "Take course 0", "transientMessage": "Decrement neighbors",
         "graphState": {"nodes": [{"id": "0", "label": "0 ✓", "x": 200, "y": 50, "visited": True}, {"id": "1", "label": "1 (in:0)", "x": 100, "y": 150, "highlight": True},
                                  {"id": "2", "label": "2 (in:0)", "x": 300, "y": 150, "highlight": True}, {"id": "3", "label": "3", "x": 200, "y": 250}],
                       "edges": [{"from": "0", "to": "1", "highlight": True}, {"from": "0", "to": "2", "highlight": True}, {"from": "1", "to": "3"}, {"from": "2", "to": "3"}]},
         "pointers": [{"label": "taken", "value": "1"}], "color": "accent"},
        {"step": 4, "visual": "Take 1 & 2", "transientMessage": "Both ready (indegree=0)",
         "graphState": {"nodes": [{"id": "0", "label": "0 ✓", "x": 200, "y": 50, "visited": True}, {"id": "1", "label": "1 ✓", "x": 100, "y": 150, "visited": True},
                                  {"id": "2", "label": "2 ✓", "x": 300, "y": 150, "visited": True}, {"id": "3", "label": "3 (in:0)", "x": 200, "y": 250, "highlight": True}],
                       "edges": [{"from": "0", "to": "1"}, {"from": "0", "to": "2"}, {"from": "1", "to": "3"}, {"from": "2", "to": "3"}]},
         "pointers": [{"label": "taken", "value": "3"}], "color": "accent"},
        {"step": 5, "visual": "Result: True", "transientMessage": "All 4 courses completed!",
         "graphState": {"nodes": [{"id": "0", "label": "0 ✓", "x": 200, "y": 50}, {"id": "1", "label": "1 ✓", "x": 100, "y": 150},
                                  {"id": "2", "label": "2 ✓", "x": 300, "y": 150}, {"id": "3", "label": "3 ✓", "x": 200, "y": 250}],
                       "edges": [{"from": "0", "to": "1"}, {"from": "0", "to": "2"}, {"from": "1", "to": "3"}, {"from": "2", "to": "3"}]},
         "pointers": [], "color": "success"}
    ],
    "course-schedule-ii": [
        {"step": 1, "visual": "Build DAG", "transientMessage": "prereqs define order",
         "graphState": {"nodes": [{"id": "0", "label": "0", "x": 200, "y": 50}, {"id": "1", "label": "1", "x": 100, "y": 150},
                                  {"id": "2", "label": "2", "x": 300, "y": 150}, {"id": "3", "label": "3", "x": 200, "y": 250}],
                       "edges": [{"from": "0", "to": "1"}, {"from": "0", "to": "2"}, {"from": "1", "to": "3"}, {"from": "2", "to": "3"}]},
         "pointers": [], "color": "accent"},
        {"step": 2, "visual": "Kahn's: Start 0", "transientMessage": "order = [0]",
         "graphState": {"nodes": [{"id": "0", "label": "0 ✓", "x": 200, "y": 50, "visited": True}, {"id": "1", "label": "1", "x": 100, "y": 150},
                                  {"id": "2", "label": "2", "x": 300, "y": 150}, {"id": "3", "label": "3", "x": 200, "y": 250}],
                       "edges": [{"from": "0", "to": "1", "highlight": True}, {"from": "0", "to": "2", "highlight": True}, {"from": "1", "to": "3"}, {"from": "2", "to": "3"}]},
         "pointers": [{"label": "order", "value": "[0]"}], "color": "accent"},
        {"step": 3, "visual": "Take 1, 2", "transientMessage": "order = [0,1,2]",
         "graphState": {"nodes": [{"id": "0", "label": "0 ✓", "x": 200, "y": 50, "visited": True}, {"id": "1", "label": "1 ✓", "x": 100, "y": 150, "visited": True},
                                  {"id": "2", "label": "2 ✓", "x": 300, "y": 150, "visited": True}, {"id": "3", "label": "3", "x": 200, "y": 250, "highlight": True}],
                       "edges": [{"from": "0", "to": "1"}, {"from": "0", "to": "2"}, {"from": "1", "to": "3"}, {"from": "2", "to": "3"}]},
         "pointers": [{"label": "order", "value": "[0,1,2]"}], "color": "accent"},
        {"step": 4, "visual": "Result: [0,1,2,3]", "transientMessage": "Valid topological order",
         "graphState": {"nodes": [{"id": "0", "label": "0 ✓", "x": 200, "y": 50}, {"id": "1", "label": "1 ✓", "x": 100, "y": 150},
                                  {"id": "2", "label": "2 ✓", "x": 300, "y": 150}, {"id": "3", "label": "3 ✓", "x": 200, "y": 250}],
                       "edges": [{"from": "0", "to": "1"}, {"from": "0", "to": "2"}, {"from": "1", "to": "3"}, {"from": "2", "to": "3"}]},
         "pointers": [{"label": "order", "value": "[0,1,2,3]"}], "color": "success"}
    ],
    "network-delay-time": [
        {"step": 1, "visual": "Weighted Graph", "transientMessage": "times=[[2,1,1],[2,3,1],[3,4,1]]",
         "graphState": {"nodes": [{"id": "1", "label": "1", "x": 100, "y": 150}, {"id": "2", "label": "2 (src)", "x": 200, "y": 50},
                                  {"id": "3", "label": "3", "x": 300, "y": 150}, {"id": "4", "label": "4", "x": 400, "y": 150}],
                       "edges": [{"from": "2", "to": "1", "weight": 1}, {"from": "2", "to": "3", "weight": 1}, {"from": "3", "to": "4", "weight": 1}]},
         "pointers": [], "color": "accent"},
        {"step": 2, "visual": "Dijkstra: dist[2]=0", "transientMessage": "All others = ∞",
         "graphState": {"nodes": [{"id": "1", "label": "1 (∞)", "x": 100, "y": 150}, {"id": "2", "label": "2 (0)", "x": 200, "y": 50, "highlight": True},
                                  {"id": "3", "label": "3 (∞)", "x": 300, "y": 150}, {"id": "4", "label": "4 (∞)", "x": 400, "y": 150}],
                       "edges": [{"from": "2", "to": "1", "weight": 1}, {"from": "2", "to": "3", "weight": 1}, {"from": "3", "to": "4", "weight": 1}]},
         "pointers": [{"label": "curr", "node": "2"}], "color": "accent"},
        {"step": 3, "visual": "Relax: dist[1,3]=1", "transientMessage": "Update neighbors",
         "graphState": {"nodes": [{"id": "1", "label": "1 (1)", "x": 100, "y": 150, "highlight": True}, {"id": "2", "label": "2 (0)", "x": 200, "y": 50, "visited": True},
                                  {"id": "3", "label": "3 (1)", "x": 300, "y": 150, "highlight": True}, {"id": "4", "label": "4 (∞)", "x": 400, "y": 150}],
                       "edges": [{"from": "2", "to": "1", "weight": 1, "highlight": True}, {"from": "2", "to": "3", "weight": 1, "highlight": True}, {"from": "3", "to": "4", "weight": 1}]},
         "pointers": [], "color": "accent"},
        {"step": 4, "visual": "Relax: dist[4]=2", "transientMessage": "From node 3",
         "graphState": {"nodes": [{"id": "1", "label": "1 (1) ✓", "x": 100, "y": 150, "visited": True}, {"id": "2", "label": "2 (0) ✓", "x": 200, "y": 50, "visited": True},
                                  {"id": "3", "label": "3 (1) ✓", "x": 300, "y": 150, "visited": True}, {"id": "4", "label": "4 (2)", "x": 400, "y": 150, "highlight": True}],
                       "edges": [{"from": "2", "to": "1", "weight": 1}, {"from": "2", "to": "3", "weight": 1}, {"from": "3", "to": "4", "weight": 1, "highlight": True}]},
         "pointers": [], "color": "accent"},
        {"step": 5, "visual": "Result: max=2", "transientMessage": "All nodes reachable",
         "graphState": {"nodes": [{"id": "1", "label": "1 (1)", "x": 100, "y": 150}, {"id": "2", "label": "2 (0)", "x": 200, "y": 50},
                                  {"id": "3", "label": "3 (1)", "x": 300, "y": 150}, {"id": "4", "label": "4 (2)", "x": 400, "y": 150}],
                       "edges": [{"from": "2", "to": "1", "weight": 1}, {"from": "2", "to": "3", "weight": 1}, {"from": "3", "to": "4", "weight": 1}]},
         "pointers": [{"label": "answer", "value": "2"}], "color": "success"}
    ],
    "redundant-connection": [
        {"step": 1, "visual": "Union-Find", "transientMessage": "edges=[[1,2],[1,3],[2,3]]",
         "graphState": {"nodes": [{"id": "1", "label": "1", "x": 200, "y": 50}, {"id": "2", "label": "2", "x": 100, "y": 150}, {"id": "3", "label": "3", "x": 300, "y": 150}],
                       "edges": []},
         "pointers": [{"label": "parent", "value": "[1,2,3]"}], "color": "accent"},
        {"step": 2, "visual": "Union(1,2)", "transientMessage": "Merge sets",
         "graphState": {"nodes": [{"id": "1", "label": "1", "x": 200, "y": 50, "highlight": True}, {"id": "2", "label": "2", "x": 100, "y": 150, "highlight": True}, {"id": "3", "label": "3", "x": 300, "y": 150}],
                       "edges": [{"from": "1", "to": "2", "highlight": True}]},
         "pointers": [{"label": "parent", "value": "[1,1,3]"}], "color": "accent"},
        {"step": 3, "visual": "Union(1,3)", "transientMessage": "Merge sets",
         "graphState": {"nodes": [{"id": "1", "label": "1", "x": 200, "y": 50, "highlight": True}, {"id": "2", "label": "2", "x": 100, "y": 150}, {"id": "3", "label": "3", "x": 300, "y": 150, "highlight": True}],
                       "edges": [{"from": "1", "to": "2"}, {"from": "1", "to": "3", "highlight": True}]},
         "pointers": [{"label": "parent", "value": "[1,1,1]"}], "color": "accent"},
        {"step": 4, "visual": "Cycle: [2,3]", "transientMessage": "Find(2)=Find(3)=1",
         "graphState": {"nodes": [{"id": "1", "label": "1", "x": 200, "y": 50}, {"id": "2", "label": "2", "x": 100, "y": 150}, {"id": "3", "label": "3", "x": 300, "y": 150}],
                       "edges": [{"from": "1", "to": "2"}, {"from": "1", "to": "3"}, {"from": "2", "to": "3", "highlight": True}]},
         "pointers": [{"label": "answer", "value": "[2,3]"}], "color": "success"}
    ],
    "number-of-connected-components-in-an-undirected-graph": [
        {"step": 1, "visual": "Input Graph", "transientMessage": "n=5, edges=[[0,1],[1,2],[3,4]]",
         "graphState": {"nodes": [{"id": "0", "label": "0", "x": 100, "y": 100}, {"id": "1", "label": "1", "x": 200, "y": 100}, {"id": "2", "label": "2", "x": 300, "y": 100},
                                  {"id": "3", "label": "3", "x": 150, "y": 200}, {"id": "4", "label": "4", "x": 250, "y": 200}],
                       "edges": [{"from": "0", "to": "1"}, {"from": "1", "to": "2"}, {"from": "3", "to": "4"}]},
         "pointers": [], "color": "accent"},
        {"step": 2, "visual": "DFS: 0→1→2", "transientMessage": "Component 1",
         "graphState": {"nodes": [{"id": "0", "label": "0 ✓", "x": 100, "y": 100, "visited": True}, {"id": "1", "label": "1 ✓", "x": 200, "y": 100, "visited": True}, {"id": "2", "label": "2 ✓", "x": 300, "y": 100, "visited": True},
                                  {"id": "3", "label": "3", "x": 150, "y": 200}, {"id": "4", "label": "4", "x": 250, "y": 200}],
                       "edges": [{"from": "0", "to": "1", "highlight": True}, {"from": "1", "to": "2", "highlight": True}, {"from": "3", "to": "4"}]},
         "pointers": [{"label": "count", "value": "1"}], "color": "accent"},
        {"step": 3, "visual": "DFS: 3→4", "transientMessage": "Component 2",
         "graphState": {"nodes": [{"id": "0", "label": "0 ✓", "x": 100, "y": 100, "visited": True}, {"id": "1", "label": "1 ✓", "x": 200, "y": 100, "visited": True}, {"id": "2", "label": "2 ✓", "x": 300, "y": 100, "visited": True},
                                  {"id": "3", "label": "3 ✓", "x": 150, "y": 200, "visited": True}, {"id": "4", "label": "4 ✓", "x": 250, "y": 200, "visited": True}],
                       "edges": [{"from": "0", "to": "1"}, {"from": "1", "to": "2"}, {"from": "3", "to": "4", "highlight": True}]},
         "pointers": [{"label": "answer", "value": "2"}], "color": "success"}
    ],
    "cheapest-flights-within-k-stops": [
        {"step": 1, "visual": "Flight Graph", "transientMessage": "src=0, dst=2, k=1",
         "graphState": {"nodes": [{"id": "0", "label": "0", "x": 100, "y": 100}, {"id": "1", "label": "1", "x": 250, "y": 50}, {"id": "2", "label": "2", "x": 400, "y": 100}],
                       "edges": [{"from": "0", "to": "1", "weight": 100}, {"from": "1", "to": "2", "weight": 100}, {"from": "0", "to": "2", "weight": 500}]},
         "pointers": [], "color": "accent"},
        {"step": 2, "visual": "BFS: Start 0", "transientMessage": "cost=0",
         "graphState": {"nodes": [{"id": "0", "label": "0 ($0)", "x": 100, "y": 100, "highlight": True}, {"id": "1", "label": "1 (∞)", "x": 250, "y": 50}, {"id": "2", "label": "2 (∞)", "x": 400, "y": 100}],
                       "edges": [{"from": "0", "to": "1", "weight": 100}, {"from": "1", "to": "2", "weight": 100}, {"from": "0", "to": "2", "weight": 500}]},
         "pointers": [], "color": "accent"},
        {"step": 3, "visual": "0→1: $100", "transientMessage": "0→2: $500",
         "graphState": {"nodes": [{"id": "0", "label": "0 ($0)", "x": 100, "y": 100, "visited": True}, {"id": "1", "label": "1 ($100)", "x": 250, "y": 50, "highlight": True}, {"id": "2", "label": "2 ($500)", "x": 400, "y": 100}],
                       "edges": [{"from": "0", "to": "1", "weight": 100, "highlight": True}, {"from": "1", "to": "2", "weight": 100}, {"from": "0", "to": "2", "weight": 500}]},
         "pointers": [], "color": "accent"},
        {"step": 4, "visual": "1→2: $200", "transientMessage": "Better than $500!",
         "graphState": {"nodes": [{"id": "0", "label": "0", "x": 100, "y": 100}, {"id": "1", "label": "1", "x": 250, "y": 50}, {"id": "2", "label": "2", "x": 400, "y": 100}],
                       "edges": [{"from": "0", "to": "1", "weight": 100, "highlight": True}, {"from": "1", "to": "2", "weight": 100, "highlight": True}, {"from": "0", "to": "2", "weight": 500}]},
         "pointers": [{"label": "answer", "value": "200"}], "color": "success"}
    ],
    "swim-in-rising-water": [
        {"step": 1, "visual": "Grid as Graph", "transientMessage": "Each cell is a node",
         "graphState": {"nodes": [{"id": "00", "label": "0", "x": 100, "y": 100}, {"id": "01", "label": "1", "x": 200, "y": 100},
                                  {"id": "10", "label": "2", "x": 100, "y": 200}, {"id": "11", "label": "3", "x": 200, "y": 200}],
                       "edges": [{"from": "00", "to": "01"}, {"from": "00", "to": "10"}, {"from": "01", "to": "11"}, {"from": "10", "to": "11"}]},
         "pointers": [], "color": "accent"},
        {"step": 2, "visual": "Binary Search t=3", "transientMessage": "Can we reach end?",
         "graphState": {"nodes": [{"id": "00", "label": "0 (start)", "x": 100, "y": 100, "highlight": True}, {"id": "01", "label": "1", "x": 200, "y": 100},
                                  {"id": "10", "label": "2", "x": 100, "y": 200}, {"id": "11", "label": "3 (end)", "x": 200, "y": 200, "highlight": True}],
                       "edges": [{"from": "00", "to": "01"}, {"from": "00", "to": "10"}, {"from": "01", "to": "11"}, {"from": "10", "to": "11"}]},
         "pointers": [{"label": "t", "value": "3"}], "color": "accent"},
        {"step": 3, "visual": "Result: t=3", "transientMessage": "Path found!",
         "graphState": {"nodes": [{"id": "00", "label": "0 ✓", "x": 100, "y": 100, "visited": True}, {"id": "01", "label": "1 ✓", "x": 200, "y": 100, "visited": True},
                                  {"id": "10", "label": "2", "x": 100, "y": 200}, {"id": "11", "label": "3 ✓", "x": 200, "y": 200, "visited": True}],
                       "edges": [{"from": "00", "to": "01", "highlight": True}, {"from": "00", "to": "10"}, {"from": "01", "to": "11", "highlight": True}, {"from": "10", "to": "11"}]},
         "pointers": [{"label": "answer", "value": "3"}], "color": "success"}
    ],
    "alien-dictionary": [
        {"step": 1, "visual": "Build Order Graph", "transientMessage": "Compare adjacent words",
         "graphState": {"nodes": [{"id": "w", "label": "w", "x": 100, "y": 100}, {"id": "e", "label": "e", "x": 150, "y": 200},
                                  {"id": "r", "label": "r", "x": 200, "y": 100}, {"id": "t", "label": "t", "x": 300, "y": 100}, {"id": "f", "label": "f", "x": 250, "y": 200}],
                       "edges": []},
         "pointers": [], "color": "accent"},
        {"step": 2, "visual": "t→f, w→e", "transientMessage": "First differences",
         "graphState": {"nodes": [{"id": "w", "label": "w", "x": 100, "y": 100, "highlight": True}, {"id": "e", "label": "e", "x": 150, "y": 200},
                                  {"id": "r", "label": "r", "x": 200, "y": 100}, {"id": "t", "label": "t", "x": 300, "y": 100, "highlight": True}, {"id": "f", "label": "f", "x": 250, "y": 200}],
                       "edges": [{"from": "t", "to": "f", "highlight": True}, {"from": "w", "to": "e", "highlight": True}]},
         "pointers": [], "color": "accent"},
        {"step": 3, "visual": "r→t, e→r", "transientMessage": "More edges found",
         "graphState": {"nodes": [{"id": "w", "label": "w", "x": 100, "y": 100}, {"id": "e", "label": "e", "x": 150, "y": 200},
                                  {"id": "r", "label": "r", "x": 200, "y": 100}, {"id": "t", "label": "t", "x": 300, "y": 100}, {"id": "f", "label": "f", "x": 250, "y": 200}],
                       "edges": [{"from": "t", "to": "f"}, {"from": "w", "to": "e"}, {"from": "r", "to": "t", "highlight": True}, {"from": "e", "to": "r", "highlight": True}]},
         "pointers": [], "color": "accent"},
        {"step": 4, "visual": 'Result: "wertf"', "transientMessage": "Topological sort",
         "graphState": {"nodes": [{"id": "w", "label": "w (1)", "x": 100, "y": 100, "visited": True}, {"id": "e", "label": "e (2)", "x": 150, "y": 200, "visited": True},
                                  {"id": "r", "label": "r (3)", "x": 200, "y": 100, "visited": True}, {"id": "t", "label": "t (4)", "x": 300, "y": 100, "visited": True}, {"id": "f", "label": "f (5)", "x": 250, "y": 200, "visited": True}],
                       "edges": [{"from": "t", "to": "f"}, {"from": "w", "to": "e"}, {"from": "r", "to": "t"}, {"from": "e", "to": "r"}]},
         "pointers": [{"label": "answer", "value": '"wertf"'}], "color": "success"}
    ]
}

with open("api/data/solutions.json", "r") as f:
    data = json.load(f)

solutions = data.get("solutions", data)
fixed = 0

for slug, steps in GRAPH_FIXES.items():
    if slug in solutions:
        solutions[slug]["animationSteps"] = steps
        print(f"✓ Fixed: {slug}")
        fixed += 1

if "min-stack" in solutions:
    solutions["min-stack"]["initialState"] = []
if "generate-parentheses" in solutions:
    solutions["generate-parentheses"]["initialState"] = [""]

with open("api/data/solutions.json", "w") as f:
    if "solutions" in data:
        data["solutions"] = solutions
        json.dump(data, f, indent=2)
    else:
        json.dump(solutions, f, indent=2)

print(f"\n✅ Fixed {fixed} graph problems + 2 initialState issues")
