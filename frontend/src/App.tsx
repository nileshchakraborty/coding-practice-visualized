/**
 * App.tsx - Refactored with MVVM Pattern
 * Uses viewmodel hooks for state management
 */
import { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Problem } from './models';
import { useProblems } from './viewmodels';
import { SearchEngine } from './utils/SearchEngine';
import { ThemeToggle } from './components/ThemeToggle';
import { LoginButton } from './components/LoginButton';
import CodeniumLogo from './assets/logo.svg';
import { Search, Filter, ChevronUp, ChevronDown, Check, Zap } from 'lucide-react';

function App() {
  // ViewModels
  const problems = useProblems();
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // UI state
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Local filter state for subtopic - now supports multiple selection
  const [selectedSubTopics, setSelectedSubTopics] = useState<Set<string>>(new Set());

  // Compute stats from viewmodel
  const stats = useMemo(() => {
    if (!problems.stats) return null;

    let totalEasy = 0, totalMedium = 0, totalHard = 0;
    const categoriesWithStats = problems.stats.categories.map(cat => {
      const easy = cat.problems.filter(p => p.difficulty === 'Easy').length;
      const medium = cat.problems.filter(p => p.difficulty === 'Medium').length;
      const hard = cat.problems.filter(p => p.difficulty === 'Hard').length;
      totalEasy += easy;
      totalMedium += medium;
      totalHard += hard;
      return { ...cat, count: cat.problems.length, easy, medium, hard };
    });

    return {
      easy: totalEasy,
      medium: totalMedium,
      hard: totalHard,
      categories: categoriesWithStats
    };
  }, [problems.stats]);

  // Initialize Search Engine (Trie)
  const allProblems = useMemo(() => {
    return problems.stats ? problems.stats.categories.flatMap(c => c.problems) : [];
  }, [problems.stats]);


  const searchEngine = useMemo(() => {
    return new SearchEngine(allProblems, p => p.title);
  }, [allProblems]);

  const searchResults = useMemo(() => {
    const query = problems.filter.search;
    if (!query) return null;

    // 1. Search Problems
    const results = searchEngine.search(query);
    if (results.length > 0) {
      return new Set(results.map(p => p.slug));
    }

    // 2. Fallback: Search Categories (if no problems matched)
    if (!stats) return new Set();

    const categoryAliases: Record<string, string[]> = {
      "1-D Dynamic Programming": ["dp", "dynamic programming"],
      "Multidimensional DP": ["dp", "matrix", "2d"],
      "Breadth-First Search": ["bfs"],
      "Depth-First Search": ["dfs"],
      "Binary Search Tree": ["bst"],
      "Bit Manipulation": ["bit"],
      "Linked List": ["list", "node"],
      "Two Pointers": ["pointer"],
      "Sliding Window": ["window"],
      "Backtracking": ["recursion"],
      "Trie": ["prefix tree"]
    };

    // Create a temporary Category Search Engine
    // Note: In production, consider memoizing this if stats don't change often.
    // However, stats is a dependency, so we could define this search engine in a separate useMemo if needed.
    // For now, creating it inside the effect is okay if stats array is small (it is, < 30 categories).
    // Actually, let's just use the memoized 'allCategories' if we had one, or create it here.

    const catSearchEngine = new SearchEngine(stats.categories, (cat) => {
      const phrases = [cat.name];
      if (categoryAliases[cat.name]) {
        phrases.push(...categoryAliases[cat.name]);
      }
      return phrases;
    });

    const matchedCategories = catSearchEngine.search(query);

    if (matchedCategories.length > 0) {
      const catProblems = matchedCategories.flatMap(c => c.problems);
      return new Set(catProblems.map(p => p.slug));
    }

    return new Set();
  }, [searchEngine, problems.filter.search, stats]);

  // Toggle subtopic selection
  const toggleSubTopic = useCallback((subTopic: string) => {
    setSelectedSubTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subTopic)) {
        newSet.delete(subTopic);
      } else {
        newSet.add(subTopic);
      }
      return newSet;
    });
  }, []);

  // Reset all subtopic filters
  const resetSubTopicFilters = useCallback(() => {
    setSelectedSubTopics(new Set());
  }, []);

  // Filter problems
  const filterProblems = useCallback((problemList: Problem[]) => {
    return problemList.filter(p => {
      const matchesSearch = !searchResults || searchResults.has(p.slug);
      const matchesDiff = problems.filter.difficulty === 'All' || p.difficulty === problems.filter.difficulty;
      const matchesSubTopic = selectedSubTopics.size === 0 || (p.subTopic && selectedSubTopics.has(p.subTopic));
      return matchesSearch && matchesDiff && matchesSubTopic;
    });
  }, [problems.filter.difficulty, searchResults, selectedSubTopics]);

  // All subtopics
  const allSubTopics = useMemo(() => {
    if (!stats) return [];
    return Array.from(new Set(
      stats.categories.flatMap(c => c.problems.map(p => p.subTopic)).filter((t): t is string => !!t)
    )).sort();
  }, [stats]);

  // Handle problem click - navigate to problem page
  const handleProblemClick = useCallback((slug: string) => {
    // Clear search when navigating to a new problem
    problems.updateFilter({ search: '' });
    setLoadingSlug(slug);

    // Navigate to problem page
    navigate(`/problem/${slug}`);
  }, [problems, navigate]);

  // Loading state
  if (problems.loading || !stats) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="app max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <header className="mb-6 sm:mb-8 border-b border-slate-200 dark:border-slate-800 pb-4 sm:pb-6">
          {/* Desktop: Logo + Theme + Stats in one row | Mobile: Stacked */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <img src={CodeniumLogo} alt="Codenium" className="w-8 h-8 sm:w-10 sm:h-10" />
              <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                Codenium
              </h1>
            </div>

            {/* Controls Row - Login button outside scroll area */}
            <div className="flex items-center gap-3 sm:gap-4 justify-between lg:justify-end w-full lg:w-auto">
              {/* Login Button - outside scroll container to prevent dropdown clipping */}
              <LoginButton />

              {/* Theme Toggle + Stats - scrollable on mobile */}
              <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2 lg:pb-0 custom-scrollbar mask-fade-right">
                <ThemeToggle />
                <div className="flex flex-col items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 min-w-[60px] sm:min-w-[80px] shadow-sm flex-shrink-0">
                  <span className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">{stats.easy + stats.medium + stats.hard}</span>
                  <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wide">Total</span>
                </div>
                <div className="flex flex-col items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl min-w-[50px] sm:min-w-[70px] flex-shrink-0">
                  <span className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.easy}</span>
                  <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wide">Easy</span>
                </div>
                <div className="flex flex-col items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl min-w-[50px] sm:min-w-[70px] flex-shrink-0">
                  <span className="text-base sm:text-xl font-bold text-amber-600 dark:text-amber-400">{stats.medium}</span>
                  <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wide">Med</span>
                </div>
                <div className="flex flex-col items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl min-w-[50px] sm:min-w-[70px] flex-shrink-0">
                  <span className="text-base sm:text-xl font-bold text-rose-600 dark:text-rose-400">{stats.hard}</span>
                  <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wide">Hard</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="mb-4 sm:mb-8 flex flex-col gap-3 sm:gap-4">
          {/* Search and Difficulty Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative w-full sm:w-80 lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Search problems..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                defaultValue={problems.filter.search}
                onChange={(e) => {
                  const val = e.target.value;
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                  }
                  searchTimeoutRef.current = setTimeout(() => {
                    problems.updateFilter({ search: val });
                  }, 300);
                }}
              />
            </div>
            {/* Difficulty Filter - Right aligned on desktop */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 custom-scrollbar">
              {(['All', 'Easy', 'Medium', 'Hard'] as const).map(diff => (
                <button
                  key={diff}
                  onClick={() => problems.updateFilter({ difficulty: diff })}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all flex-shrink-0 ${problems.filter.difficulty === diff
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                    }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Subtopic Filter */}
          {allSubTopics.length > 0 && (
            <div className="relative z-20">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${showMobileFilters || selectedSubTopics.size > 0
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Filter size={18} />
                  <span className="font-medium text-sm">Filter Topics</span>
                  {selectedSubTopics.size > 0 && (
                    <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {selectedSubTopics.size}
                    </span>
                  )}
                </div>
                {showMobileFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {/* Filter Dropdown */}
              <div className={`mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden transition-all duration-300 origin-top ${showMobileFilters ? 'max-h-[500px] opacity-100 scale-100' : 'max-h-0 opacity-0 scale-95 border-none'
                }`}>
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Select Patterns</span>
                    {selectedSubTopics.size > 0 && (
                      <button
                        onClick={resetSubTopicFilters}
                        className="text-xs text-rose-500 font-semibold hover:text-rose-600 flex items-center gap-1"
                      >
                        Reset All
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allSubTopics.map(st => (
                      <button
                        key={st}
                        onClick={() => toggleSubTopic(st)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${selectedSubTopics.has(st)
                          ? 'bg-indigo-500 border-indigo-500 text-white shadow-md'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700'
                          }`}
                      >
                        {st}
                        {selectedSubTopics.has(st) && <Check size={14} className="opacity-75" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {stats.categories.map((cat) => {
            const visibleProblems = filterProblems(cat.problems);
            if (visibleProblems.length === 0) return null;

            return (
              <div key={cat.name} className="bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all group shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cat.icon}</span>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{cat.name}</h3>
                    </div>
                    <span className="text-sm text-slate-500 bg-slate-200 dark:bg-slate-950 px-2 py-1 rounded-md">{visibleProblems.length}</span>
                  </div>
                  <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex mt-3">
                    {problems.filter.difficulty === 'Easy' ? (
                      <div className="bg-emerald-500 h-full w-full transition-all duration-500" />
                    ) : problems.filter.difficulty === 'Medium' ? (
                      <div className="bg-amber-500 h-full w-full transition-all duration-500" />
                    ) : problems.filter.difficulty === 'Hard' ? (
                      <div className="bg-rose-500 h-full w-full transition-all duration-500" />
                    ) : (
                      <>
                        <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(cat.easy / cat.count) * 100}%` }} />
                        <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${(cat.medium / cat.count) * 100}%` }} />
                        <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${(cat.hard / cat.count) * 100}%` }} />
                      </>
                    )}
                  </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {visibleProblems.map(p => (
                    <div
                      key={p.slug}
                      onClick={() => handleProblemClick(p.slug)}
                      className={`flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800/50 hover:bg-indigo-500/10 hover:border-l-4 hover:border-l-indigo-500 cursor-pointer transition-all ${loadingSlug === p.slug ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-700 dark:text-slate-300">{p.title}</h4>
                          {p.has_solution && (
                            <Zap size={14} className="text-amber-400 fill-amber-400" />
                          )}
                          {loadingSlug === p.slug && <span className="text-xs text-indigo-400 animate-pulse">Generating...</span>}
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' :
                        p.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-rose-500/10 text-rose-400'
                        }`}>
                        {p.difficulty}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <footer className="mt-12 text-center text-slate-500 dark:text-slate-600 text-sm">
          <p>Built with ❤️ for Visual Learners | Codenium</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
