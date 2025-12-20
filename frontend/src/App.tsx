/**
 * App.tsx - Refactored with MVVM Pattern
 * Uses viewmodel hooks for state management
 */
import { useState, useMemo, useCallback } from 'react';
import type { Solution, Problem } from './models';
import { useProblems } from './viewmodels';
import { SearchEngine } from './utils/SearchEngine';
import SolutionModal from './components/SolutionModal';
import { ThemeToggle } from './components/ThemeToggle';
import { Search, Brain, Zap, X } from 'lucide-react';

function App() {
  // ViewModels
  const problems = useProblems();

  // Modal state (could be extracted to a useModal hook)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

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
    if (!problems.filter.search) return null;
    const results = searchEngine.search(problems.filter.search);
    return new Set(results.map(p => p.slug));
  }, [searchEngine, problems.filter.search]);

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

  // Handle problem click
  const handleProblemClick = useCallback(async (slug: string) => {
    // Clear search when navigating to a new problem
    problems.updateFilter({ search: '' });

    setLoadingSlug(slug);
    setSelectedSlug(slug);
    try {
      const { SolutionsAPI } = await import('./models');
      let solutionData = await SolutionsAPI.getBySlug(slug);

      if (!solutionData) {
        // Generate if not found
        const genResult = await SolutionsAPI.generate(slug);
        if (genResult.success) {
          solutionData = await SolutionsAPI.getBySlug(slug);
        }
      }

      if (solutionData) {
        setSelectedSolution(solutionData);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Error opening solution", err);
      alert("Failed to load solution. Please ensure Ollama is running.");
    } finally {
      setLoadingSlug(null);
    }
  }, [problems]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

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
      <div className="app max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <header className="mb-6 sm:mb-8 border-b border-slate-200 dark:border-slate-800 pb-4 sm:pb-6">
          {/* Desktop: Logo + Theme + Stats in one row | Mobile: Stacked */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Brain className="text-indigo-500 w-8 h-8 sm:w-10 sm:h-10" />
              <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                Codenium
              </h1>
            </div>

            {/* Theme Toggle + Stats Row */}
            <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-2 lg:pb-0 -mx-3 px-3 lg:mx-0 lg:px-0 custom-scrollbar">
              <ThemeToggle />
              <div className="flex flex-col items-center px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 min-w-[80px] shadow-sm flex-shrink-0">
                <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{stats.easy + stats.medium + stats.hard}</span>
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wide">Total</span>
              </div>
              <div className="flex flex-col items-center px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl min-w-[70px] flex-shrink-0">
                <span className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.easy}</span>
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wide">Easy</span>
              </div>
              <div className="flex flex-col items-center px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl min-w-[70px] flex-shrink-0">
                <span className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400">{stats.medium}</span>
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wide">Med</span>
              </div>
              <div className="flex flex-col items-center px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl min-w-[70px] flex-shrink-0">
                <span className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400">{stats.hard}</span>
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wide">Hard</span>
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
                value={problems.filter.search}
                onChange={(e) => problems.updateFilter({ search: e.target.value })}
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

          {/* Subtopic Filter - Clean inline design with word wrap */}
          {allSubTopics.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Reset Button - Minimal, inline with separator */}
              <button
                onClick={resetSubTopicFilters}
                disabled={selectedSubTopics.size === 0}
                className={`flex items-center gap-1 text-xs font-medium transition-all ${selectedSubTopics.size > 0
                  ? 'text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer'
                  : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                  }`}
              >
                <X size={14} strokeWidth={2.5} />
                <span>Reset</span>
                {selectedSubTopics.size > 0 && (
                  <span className="ml-0.5 bg-rose-500/20 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    {selectedSubTopics.size}
                  </span>
                )}
              </button>

              {/* Separator */}
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />

              {/* Subtopic Pills - Wrapped */}
              {allSubTopics.map(st => (
                <button
                  key={st}
                  onClick={() => toggleSubTopic(st)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${selectedSubTopics.has(st)
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  {st}
                </button>
              ))}
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

        {/* Modal */}
        <SolutionModal
          isOpen={isModalOpen}
          onClose={closeModal}
          solution={selectedSolution}
          slug={selectedSlug}
          onSelectProblem={handleProblemClick}
        />
      </div>
    </div>
  );
}

export default App;
