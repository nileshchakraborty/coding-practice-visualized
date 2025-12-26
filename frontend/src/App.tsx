/* eslint-disable max-lines-per-function */
/**
 * App.tsx - Refactored with MVVM Pattern
 * Uses viewmodel hooks for state management
 */
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Problem } from './models';
import { useProblems } from './viewmodels';
import { useProgress } from './hooks/useProgress';
import { useAuth } from './hooks/useAuth';
import { SearchEngine } from './utils/SearchEngine';
import { ThemeToggle } from './components/ThemeToggle';
import { LoginButton } from './components/LoginButton';
import { useActivityTracking } from './hooks/useActivityTracking';
import { useTrackingConsent } from './hooks/useTrackingConsent';
import { ConsentModal } from './components/ConsentModal';
import { getAllPlans, getPlanProblems, type ListFilter } from './data/problemLists';
import { HotSection } from './components/HotSection';
import CodeniumLogo from './assets/logo.svg';
import { Search, Filter, ChevronUp, ChevronDown, Check, Zap, CheckCircle, Pencil } from 'lucide-react';

/**
 * Static category order defining the learning flow progression.
 * This order should NEVER change - it represents the optimal learning path.
 */
const CATEGORY_ORDER = [
  'Array / String',
  'Two Pointers',
  'Sliding Window',
  'Matrix',
  'Hashmap',
  'Intervals',
  'Stack',
  'Linked List',
  'Binary Tree General',
  'Binary Tree BFS',
  'Binary Search Tree',
  'Graph General',
  'Graph BFS',
  'Trie',
  'Backtracking',
  'Divide & Conquer',
  'Kadane\'s Algorithm',
  'Binary Search',
  'Heap / Priority Queue',
  'Bit Manipulation',
  'Math',
  '1D DP',
  'Multidimensional DP',
] as const;

function App() {
  // ViewModels
  const problems = useProblems();
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth state
  const { isAuthenticated } = useAuth();

  // Progress tracking - only used when authenticated
  const { isSolved, isAttempted, markAttempted, solvedCount, attemptedCount } = useProgress();

  const { logEvent } = useActivityTracking();
  const {
    showDisclosure,
    activeVersion,
    consentContent,
    isLoading: consentLoading,
    acceptConsent,
    declineConsent
  } = useTrackingConsent();

  // UI state
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Local filter state for subtopic - now supports multiple selection
  const [selectedSubTopics, setSelectedSubTopics] = useState<Set<string>>(new Set());

  // Status filter: All, In Progress, Solved
  const [statusFilter, setStatusFilter] = useState<'All' | 'In Progress' | 'Solved'>('All');

  // List filter: All, Blind 75, Top 150
  const [listFilter, setListFilter] = useState<ListFilter>('all');

  // Track filter changes
  useEffect(() => {
    logEvent('filter_change', { difficulty: problems.filter.difficulty, status: statusFilter, list: listFilter });
  }, [problems.filter.difficulty, statusFilter, listFilter, logEvent]);

  // Compute stats from viewmodel (respects list filter)
  const stats = useMemo(() => {
    if (!problems.stats) return null;

    // Filter function based on list selection
    const isInList = (slug: string) => {
      if (listFilter === 'all') return true;
      const planProblems = getPlanProblems(listFilter);
      return planProblems.includes(slug);
    };

    let totalEasy = 0, totalMedium = 0, totalHard = 0;
    const categoriesWithStats = problems.stats.categories.map(cat => {
      // Filter problems by list first
      const filteredProblems = cat.problems.filter(p => isInList(p.slug));
      const easy = filteredProblems.filter(p => p.difficulty === 'Easy').length;
      const medium = filteredProblems.filter(p => p.difficulty === 'Medium').length;
      const hard = filteredProblems.filter(p => p.difficulty === 'Hard').length;
      totalEasy += easy;
      totalMedium += medium;
      totalHard += hard;
      return { ...cat, count: filteredProblems.length, easy, medium, hard };
    });

    // Sort categories according to static CATEGORY_ORDER (learning flow)
    const sortedCategories = [...categoriesWithStats].sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a.name as typeof CATEGORY_ORDER[number]);
      const indexB = CATEGORY_ORDER.indexOf(b.name as typeof CATEGORY_ORDER[number]);
      // Categories not in the order go to the end
      const orderA = indexA === -1 ? CATEGORY_ORDER.length : indexA;
      const orderB = indexB === -1 ? CATEGORY_ORDER.length : indexB;
      return orderA - orderB;
    });

    return {
      easy: totalEasy,
      medium: totalMedium,
      hard: totalHard,
      categories: sortedCategories
    };
  }, [problems.stats, listFilter]);

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

    // Use dynamic topics if available, else hardcoded
    // Actually better to have the search engine handle this using a unified list?
    // For now, let's keep it simple.

    // TODO: Use `topics` state for aliases
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

      // List filter
      let matchesList = true;
      if (listFilter !== 'all') {
        const planProblems = getPlanProblems(listFilter);
        matchesList = planProblems.includes(p.slug);
      }

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'Solved') {
        matchesStatus = isSolved(p.slug);
      } else if (statusFilter === 'In Progress') {
        matchesStatus = isAttempted(p.slug);
      }

      return matchesSearch && matchesDiff && matchesSubTopic && matchesList && matchesStatus;
    });
  }, [problems.filter.difficulty, searchResults, selectedSubTopics, listFilter, statusFilter, isSolved, isAttempted]);

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

    // Mark problem as attempted (in-progress) when opened - only if authenticated
    if (isAuthenticated) {
      markAttempted(slug);
    }

    // Navigate to problem page
    navigate(`/problem/${slug}`);
  }, [problems, navigate, markAttempted, isAuthenticated]);

  // Loading state
  if (problems.loading || !stats || consentLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        <span className="animate-pulse">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className={`bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors ${showDisclosure ? 'overflow-hidden h-screen' : ''}`}>
      <ConsentModal
        isOpen={showDisclosure}
        title={consentContent?.title || 'Data Collection & Privacy'}
        content={consentContent?.content || ''}
        summary={consentContent?.summary || ''}
        version={activeVersion || '1.0'}
        isLoading={consentLoading}
        onAccept={() => activeVersion && acceptConsent(activeVersion)}
        onDecline={declineConsent}
      />
      <div className={`app max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 ${showDisclosure ? 'blur-sm pointer-events-none select-none' : ''}`}>
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

                {/* Progress Metrics - Only show when authenticated */}
                {isAuthenticated && (
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl flex-shrink-0">
                    <div className="flex items-center gap-1.5" title="Completed">
                      <CheckCircle size={14} className="text-emerald-500" />
                      <span className="text-sm font-bold text-emerald-500">{solvedCount}</span>
                    </div>
                    <div className="w-px h-5 bg-slate-300 dark:bg-slate-700" />
                    <div className="flex items-center gap-1.5" title="In Progress">
                      <Pencil size={12} className="text-amber-500" />
                      <span className="text-sm font-bold text-amber-500">{attemptedCount}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="mb-4 sm:mb-8 flex flex-col gap-3 sm:gap-4">
          {/* Row 1: Search + List Selector + Progress (when filtered) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-sm">
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
                    if (val.length > 2) {
                      logEvent('app_search', { query: val });
                    }
                  }, 300);
                }}
              />
            </div>

            {/* List Selector Dropdown */}
            <div className="relative">
              <select
                value={listFilter}
                onChange={(e) => setListFilter(e.target.value as ListFilter)}
                className="appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 pl-4 pr-10 text-sm font-medium text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer transition-colors"
              >
                <option value="all">📚 All Problems</option>
                {getAllPlans().map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.icon} {plan.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>

            {/* Compact Progress Display - Show when authenticated and filtered */}
            {isAuthenticated && listFilter !== 'all' && (
              <div className="flex items-center gap-4 bg-slate-900 rounded-xl px-4 py-2 border border-slate-800">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-emerald-400 font-medium">{stats.categories.flatMap(c => c.problems).filter(p => p.difficulty === 'Easy' && getPlanProblems(listFilter).includes(p.slug) && isSolved(p.slug)).length}/{stats.categories.flatMap(c => c.problems).filter(p => p.difficulty === 'Easy' && getPlanProblems(listFilter).includes(p.slug)).length}</span>
                  <span className="text-amber-400 font-medium">{stats.categories.flatMap(c => c.problems).filter(p => p.difficulty === 'Medium' && getPlanProblems(listFilter).includes(p.slug) && isSolved(p.slug)).length}/{stats.categories.flatMap(c => c.problems).filter(p => p.difficulty === 'Medium' && getPlanProblems(listFilter).includes(p.slug)).length}</span>
                  <span className="text-rose-400 font-medium">{stats.categories.flatMap(c => c.problems).filter(p => p.difficulty === 'Hard' && getPlanProblems(listFilter).includes(p.slug) && isSolved(p.slug)).length}/{stats.categories.flatMap(c => c.problems).filter(p => p.difficulty === 'Hard' && getPlanProblems(listFilter).includes(p.slug)).length}</span>
                </div>
                <div className="h-5 w-px bg-slate-700" />
                <span className="text-white font-bold">{solvedCount}<span className="text-slate-500 font-normal">/{getPlanProblems(listFilter).length}</span></span>
              </div>
            )}
          </div>

          {/* Row 2: Difficulty + Status Filters */}
          <div className="flex flex-wrap gap-2">
            {/* Difficulty Filter */}
            {(['All', 'Easy', 'Medium', 'Hard'] as const).map(diff => (
              <button
                key={diff}
                onClick={() => problems.updateFilter({ difficulty: diff })}
                className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${problems.filter.difficulty === diff
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
              >
                {diff}
              </button>
            ))}

            {/* Divider - Only show when authenticated */}
            {isAuthenticated && <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />}

            {/* Status Filter - Only show when authenticated */}
            {isAuthenticated && (['All', 'In Progress', 'Solved'] as const).map(status => (
              <button
                key={`status-${status}`}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center gap-1 ${statusFilter === status
                  ? status === 'Solved'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : status === 'In Progress'
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                      : 'bg-slate-800 dark:bg-slate-700 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
              >
                {status === 'In Progress' ? <Pencil size={10} /> : status === 'Solved' ? <CheckCircle size={12} /> : null}
                {status === 'All' ? 'All' : status}
              </button>
            ))}
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

        {/* Hot Topics & Problems Section */}
        <HotSection
          onProblemClick={handleProblemClick}
          onTopicClick={(category) => {
            // Find and select the subtopic for this category
            const subtopic = allSubTopics.find(st =>
              st.toLowerCase().includes(category.toLowerCase()) ||
              category.toLowerCase().includes(st.toLowerCase())
            );
            if (subtopic) {
              toggleSubTopic(subtopic);
            }
          }}
        />

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
                          {/* Progress markers - only show when authenticated */}
                          {isAuthenticated && isSolved(p.slug) ? (
                            <CheckCircle size={16} className="text-emerald-500 fill-emerald-500/20 flex-shrink-0" />
                          ) : isAuthenticated && isAttempted(p.slug) ? (
                            <Pencil size={14} className="text-amber-400 flex-shrink-0" />
                          ) : null}
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
