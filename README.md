# Visual Learning Platform (Codenium) 🚀

A next-generation platform for visualizing algorithms and data structures. Built with high-performance visualization engines and a vast library of interactive content.

## 🌟 Key Features

### 1. **Massive Content Library**
- **250+ Scenarios**: Coverage of Arrays, Trees, Graphs, DP, Backtracking, and more.
- **100% Enhanced**: Every single problem features detailed, step-by-step animations.
- **Interactive**: Scrub, replay, and speed control for every visualization.

### 2. **High-Performance Architecture**
- **Trie-Based Search Engine**: 
  - Instant results with **O(L)** complexity (search term length).
  - **Fuzzy Matching**: Finds "N-Queen" when searching "n queen" via normalization.
  - **Tokenized**: Finds "Queen" within "N-Queens".
  - **Memoized Cache**: Zero latency for repeated queries.
- **SmartVisualizer™ Engine**: 
  - Unified rendering stage for Matrix, Graph, Tree, and Array visualizations.
  - Dynamic `arrayState` rendering for high-FPS grid updates (e.g., N-Queens).
  - **Variable State Panel**: Real-time tracking of pointer values (i, j, left, right) alongside the visual.

### 3. **Modern Frontend Stack**
- **Framework**: React + Vite (Fast HMR & Build)
- **Architecture**: MVVM (Model-View-ViewModel) Pattern.
  - `viewmodels/useProblems.ts`: Manages filtering & stats.
  - `utils/SearchEngine.ts`: Reusable Trie logic.
- **Styling**: TailwindCSS with Dark/Light mode support.

## 🛠️ Architecture Overview

```mermaid
graph TD
    User[User] -->|Search/Filter| ViewModel[useProblems ViewModel]
    ViewModel -->|Query| Trie[SearchEngine (Trie + Cache)]
    ViewModel -->|Data| App[App Component]
    App -->|Select Problem| SmartViz[SmartVisualizer Component]
    SmartViz -->|Render| MatrixViz[Matrix Visualizer]
    SmartViz -->|Render| GraphViz[Graph Visualizer]
    SmartViz -->|Render| TreeViz[Tree Visualizer]
    
    Data[Solutions.json] -->|Load| ViewModel
    Data -->|Index| Trie
```

## 📸 Demo

### Interactive Visualizations
The platform transforms static code into dynamic experiences:
- **Arrays**: Watch pointers move in real-time.
- **Trees**: See DFS/BFS traversals node-by-node.
- **Grids**: Observe N-Queens placement or Pathfinding dynamically.

### AI Integration
- **Tutor Mode**: Context-aware AI explains the "Why" behind every step.

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   ./start.sh
   ```
   Access at `http://localhost:3000`.

## 🧪 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **State Management**: MVVM Hooks
- **Visualization**: Custom SVG/HTML5 renderers (No heavy canvas libs)
- **Data**: JSON-based static content (Pre-computed steps for performance)

## ✅ Validation Status

- **Build**: Passing (Vite Prod Build)
- **Coverage**: 250/250 Solutions Enhanced
- **Tests**: Core Search Logic Verified
