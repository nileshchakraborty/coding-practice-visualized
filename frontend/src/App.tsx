import { useState, useEffect } from 'react';
import axios from 'axios';
import type { Problem, Stats, Solution } from './types';
import SolutionModal from './components/SolutionModal';
import { Search, Brain, Zap } from 'lucide-react';

function App() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/problems');
      // The endpoint returns { categories: [...] } which matches our Stats interface structure roughly
      // but we need to compute the counts if they aren't there?
      // Wait, load_problems returns the raw JSON. It doesn't have "easy", "medium" counts in categories.
      // We should probably rely on the frontend to compute stats from the problems list.
      // OR update the /api/problems endpoint to include stats.

      // Let's assume for now we use the raw data and compute stats in frontend?
      // Or better, let main.py's /api/problems return the enriched structure?
      // I updated /api/problems to return 'data' which is the raw problems.json enriched with slugs.
      // It does NOT have 'easy', 'medium', 'hard' counts in the category objects.

      // let's use the response directly and just ensure we handle missing counts if needed, but App.tsx uses stats.easy etc.

      // Actually, I should merge them or compute them.
      // Let's compute them in frontend for simplicity.
      const data = res.data;
      let totalEasy = 0, totalMedium = 0, totalHard = 0;

      const categoriesWithStats = data.categories.map((cat: { problems: Problem[]; name: string; icon: string }) => {
        const easy = cat.problems.filter((p: Problem) => p.difficulty === 'Easy').length;
        const medium = cat.problems.filter((p: Problem) => p.difficulty === 'Medium').length;
        const hard = cat.problems.filter((p: Problem) => p.difficulty === 'Hard').length;

        totalEasy += easy;
        totalMedium += medium;
        totalHard += hard;

        return {
          ...cat,
          count: cat.problems.length,
          easy, medium, hard
        };
      });

      setStats({
        easy: totalEasy,
        medium: totalMedium,
        hard: totalHard,
        categories: categoriesWithStats
      });
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const handleProblemClick = async (slug: string) => {
    setLoadingSlug(slug);
    setSelectedSlug(slug);
    try {
      // Try to get existing solution
      let solutionData: Solution | null = null;
      try {
        const res = await axios.get(`/api/solutions/${slug}`);
        solutionData = res.data;
      } catch (e) {
        // Not found, generate
        console.log("Solution not found, generating...", e);
      }

      if (!solutionData) {
        // Generate
        const genRes = await axios.post('/api/generate', { slug });
        // After toggle, fetch again
        if (genRes.data.status === 'success') {
          const res = await axios.get(`/api/solutions/${slug}`);
          solutionData = res.data;
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
  };

  // Filter logic handled by derived state if we had full list, 
  // but stats endpoint returns nested categories. 
  // We'll iterate through stats.categories.

  const filterProblems = (problems: Problem[]) => {
    return problems.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDiff = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
      return matchesSearch && matchesDiff;
    });
  };

  if (!stats) return <div className="flex h-screen items-center justify-center text-slate-500">Loading Dashboard...</div>;

  return (
    <div className="app max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-12 border-b border-slate-800 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <Brain className="text-indigo-500 w-10 h-10" />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              LeetCode Visualizer
            </h1>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col items-center px-4 py-3 bg-slate-900 rounded-xl border border-slate-800 min-w-[90px]">
              <span className="text-2xl font-bold text-white">{stats.easy + stats.medium + stats.hard}</span>
              <span className="text-xs uppercase text-slate-500 font-bold tracking-wide">Total</span>
            </div>
            <div className="flex flex-col items-center px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl min-w-[90px]">
              <span className="text-2xl font-bold text-emerald-400">{stats.easy}</span>
              <span className="text-xs uppercase text-slate-500 font-bold tracking-wide">Easy</span>
            </div>
            <div className="flex flex-col items-center px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl min-w-[90px]">
              <span className="text-2xl font-bold text-amber-400">{stats.medium}</span>
              <span className="text-xs uppercase text-slate-500 font-bold tracking-wide">Med</span>
            </div>
            <div className="flex flex-col items-center px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl min-w-[90px]">
              <span className="text-2xl font-bold text-rose-400">{stats.hard}</span>
              <span className="text-xs uppercase text-slate-500 font-bold tracking-wide">Hard</span>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Stats */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Search problems..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['All', 'Easy', 'Medium', 'Hard'] as const).map(diff => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${difficultyFilter === diff
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-600'
                }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.categories.map((cat) => {
          const visibleProblems = filterProblems(cat.problems);
          if (visibleProblems.length === 0) return null;

          return (
            <div key={cat.name} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all group">
              <div className="p-6 border-b border-slate-800 bg-slate-900/80 group-hover:bg-slate-800 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon}</span>
                    <h3 className="font-bold text-lg text-slate-200">{cat.name}</h3>
                  </div>
                  <span className="text-sm text-slate-500 bg-slate-950 px-2 py-1 rounded-md">{cat.count}</span>
                </div>
                {/* Progress bar mock */}
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden flex mt-3">
                  <div className="bg-emerald-500 h-full" style={{ width: '30%' }}></div>
                  <div className="bg-amber-500 h-full" style={{ width: '50%' }}></div>
                  <div className="bg-rose-500 h-full" style={{ width: '20%' }}></div>
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {visibleProblems.map(p => (
                  <div
                    key={p.slug}
                    onClick={() => handleProblemClick(p.slug)}
                    className={`flex items-center justify-between p-4 border-b border-slate-800/50 hover:bg-indigo-500/10 hover:border-l-4 hover:border-l-indigo-500 cursor-pointer transition-all ${loadingSlug === p.slug ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-300">{p.title}</h4>
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

      <footer className="mt-12 text-center text-slate-600 text-sm">
        <p>Built with ❤️ by AI for Visual Learners</p>
      </footer>

      {/* Modal */}
      <SolutionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        solution={selectedSolution}
        slug={selectedSlug}
      />
    </div>
  );
}

export default App;
