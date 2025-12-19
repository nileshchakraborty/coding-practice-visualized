
import json

SOLUTIONS_FILE = 'data/solutions.json'

PREMIUM_DATA = {
    "meeting-rooms": {
        "problemStatement": "Given an array of meeting time intervals where intervals[i] = [starti, endi], determine if a person can attend all meetings.",
        "testCases": [
            {"input": "intervals = [[0,30],[5,10],[15,20]]", "output": "false"},
            {"input": "intervals = [[7,10],[2,4]]", "output": "true"}
        ]
    },
    "meeting-rooms-ii": {
        "problemStatement": "Given an array of meeting time intervals intervals where intervals[i] = [starti, endi], return the minimum number of conference rooms required.",
        "testCases": [
            {"input": "intervals = [[0,30],[5,10],[15,20]]", "output": "2"},
            {"input": "intervals = [[7,10],[2,4]]", "output": "1"}
        ]
    },
    "encode-and-decode-strings": {
        "problemStatement": "Design an algorithm to encode a list of strings to a string. The encoded string is then sent to the other end of the network, where it is decoded back to the original list of strings.",
        "testCases": [
            {"input": "dummy_input = [\"lint\",\"code\",\"love\",\"you\"]", "output": "[\"lint\",\"code\",\"love\",\"you\"]"}
        ]
    },
    "alien-dictionary": {
        "problemStatement": "There is a new alien language which uses the latin alphabet. However, the order among letters are unknown to you. You receive a list of non-empty words from the dictionary, where words are sorted lexicographically by the rules of this new language. Derive the order of letters in this language.",
        "testCases": [
            {"input": "words = [\"wrt\",\"wrf\",\"er\",\"ett\",\"rftt\"]", "output": "\"wertf\""},
            {"input": "words = [\"z\",\"x\"]", "output": "\"zx\""},
            {"input": "words = [\"z\",\"x\",\"z\"]", "output": "\"\""}
        ]
    },
    "graph-valid-tree": {
        "problemStatement": "Given n nodes labeled from 0 to n-1 and a list of undirected edges (each edge is a pair of nodes), write a function to check whether these edges make up a valid tree.",
        "testCases": [
            {"input": "n = 5, edges = [[0,1], [0,2], [0,3], [1,4]]", "output": "true"},
            {"input": "n = 5, edges = [[0,1], [1,2], [2,3], [1,3], [1,4]]", "output": "false"}
        ]
    },
    "number-of-connected-components-in-an-undirected-graph": {
        "problemStatement": "You have a graph of n nodes. You are given an integer n and an array edges where edges[i] = [ai, bi] indicates that there is an edge between ai and bi in the graph. Return the number of connected components in the graph.",
        "testCases": [
            {"input": "n = 5, edges = [[0,1],[1,2],[3,4]]", "output": "2"},
            {"input": "n = 5, edges = [[0,1],[1,2],[2,3],[3,4]]", "output": "1"}
        ]
    },
    "walls-and-gates": {
        "problemStatement": "You are given an m x n grid rooms initialized with these three possible values:\n-1: A wall or an obstacle.\n0: A gate.\nINF: Infinity means an empty room. We use the value 231 - 1 = 2147483647 to represent INF as you may assume that the distance to a gate is less than 2147483647.\nFill each empty room with the distance to its nearest gate. If it is impossible to reach a gate, it should be filled with INF.",
        "testCases": [
            {"input": "rooms = [[2147483647,-1,0,2147483647],[2147483647,2147483647,2147483647,-1],[2147483647,-1,2147483647,-1],[0,-1,2147483647,2147483647]]", "output": "[[3,-1,0,1],[2,2,1,-1],[1,-1,2,-1],[0,-1,3,4]]"}
        ]
    },
    "gfg---reverse-first-k-elements-of-a-queue": {
        "problemStatement": "Given an integer K and a queue of integers, we need to reverse the order of the first K elements of the queue, leaving the other elements in the same relative order.",
        "testCases": [
            {"input": "k = 3, queue = [10, 20, 30, 40, 50]", "output": "[30, 20, 10, 40, 50]"},
            {"input": "k = 4, queue = [10, 20, 30, 40, 50]", "output": "[40, 30, 20, 10, 50]"}
        ]
    }
}

def fix_premium():
    with open(SOLUTIONS_FILE, 'r') as f:
        data = json.load(f)
        solutions = data['solutions']
        
    count = 0
    for slug, info in PREMIUM_DATA.items():
        if slug in solutions:
            solutions[slug]['problemStatement'] = info['problemStatement']
            solutions[slug]['testCases'] = info['testCases']
            count += 1
        else:
            print(f"Skipping {slug} (not in solutions.json)")
            
    with open(SOLUTIONS_FILE, 'w') as f:
        json.dump(data, f, indent=4)
        print(f"Fixed {count} premium problems.")

if __name__ == "__main__":
    fix_premium()
