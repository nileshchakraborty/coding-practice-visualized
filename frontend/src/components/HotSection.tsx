/**
 * HotSection - Displays hot topics and hot problems
 * 
 * Shows trending problems and categories based on view/solve activity
 */
import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Flame, Eye, CheckCircle2 } from 'lucide-react';
import { RecommendationService, type HotProblem, type HotTopic } from '../services/RecommendationService';

interface HotSectionProps {
    onProblemClick: (slug: string) => void;
    onTopicClick: (category: string) => void;
}

export const HotSection: React.FC<HotSectionProps> = ({ onProblemClick, onTopicClick }) => {
    const [hotProblems, setHotProblems] = useState<HotProblem[]>([]);
    const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true);
            const data = await RecommendationService.getRecommendations(6, 6);
            setHotProblems(data.hotProblems);
            setHotTopics(data.hotTopics);
            setLoading(false);
        };

        fetchRecommendations();
        // Refresh every 5 minutes
        const interval = setInterval(fetchRecommendations, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Simulate live activity - Persist updates to server
    useEffect(() => {
        if (hotProblems.length === 0) return;

        const timer = setTimeout(async () => {
            // Prepare updates
            const updates: { slug: string; views?: number; solves?: number }[] = [];

            // Pick 1-3 random problems to update
            const updateCount = Math.floor(Math.random() * 3) + 1;

            for (let i = 0; i < updateCount; i++) {
                const idx = Math.floor(Math.random() * hotProblems.length);
                const problem = hotProblems[idx];

                const u: { slug: string; views?: number; solves?: number } = { slug: problem.slug };
                // Increment views (1-5)
                u.views = Math.floor(Math.random() * 5) + 1;

                // Increment solves (0-2) - less frequent
                if (Math.random() > 0.3) {
                    u.solves = Math.floor(Math.random() * 2);
                }
                updates.push(u);
            }

            if (updates.length > 0) {
                try {
                    const newData = await RecommendationService.updateStats(updates);
                    if (newData && newData.hotProblems && newData.hotProblems.length > 0) {
                        setHotProblems(newData.hotProblems);
                        // We could update topics too if returned
                        if (newData.hotTopics) setHotTopics(newData.hotTopics);
                    }
                } catch (e) {
                    console.error("Failed to persist simulation", e);
                }
            }
        }, 3000); // update every 3 seconds

        return () => clearTimeout(timer);
    }, [hotProblems]);

    const formatSlug = useCallback((slug: string) => {
        return slug.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }, []);

    if (loading) {
        return (
            <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/5 to-rose-500/5 rounded-2xl border border-amber-500/10">
                <div className="animate-pulse flex items-center gap-2">
                    <div className="h-5 w-5 bg-amber-500/20 rounded" />
                    <div className="h-4 bg-slate-700/50 rounded w-32" />
                </div>
            </div>
        );
    }

    if (hotProblems.length === 0 && hotTopics.length === 0) {
        return null;
    }

    return (
        <div className="mb-6 p-4 bg-white/50 dark:bg-transparent dark:bg-gradient-to-r dark:from-amber-500/5 dark:via-rose-500/5 dark:to-purple-500/5 rounded-2xl border border-slate-200 dark:border-amber-500/10 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2 mb-4">
                <Flame className="text-amber-500" size={20} />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Hot Right Now</h2>
                <TrendingUp className="text-emerald-500 ml-auto" size={16} />
            </div>

            {/* Hot Topics - Horizontal Pills */}
            {hotTopics.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Trending Topics</p>
                    <div className="flex flex-wrap gap-2">
                        {hotTopics.map((topic, index) => (
                            <button
                                key={topic.category}
                                onClick={() => onTopicClick(topic.category)}
                                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-amber-500/50 transition-all text-sm shadow-sm dark:shadow-none"
                            >
                                <span className="text-amber-600 dark:text-amber-400 font-medium">#{index + 1}</span>
                                <span className="text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{topic.category}</span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">({topic.problemCount})</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Hot Problems - Compact Cards */}
            {hotProblems.length > 0 && (
                <div>
                    <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Popular Problems</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {hotProblems.map((problem, index) => (
                            <button
                                key={problem.slug}
                                onClick={() => onProblemClick(problem.slug)}
                                className="group flex flex-col items-start p-3 rounded-xl bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 hover:border-rose-500/50 transition-all text-left shadow-sm dark:shadow-none"
                            >
                                <div className="flex items-center gap-1.5 mb-1 w-full">
                                    <Flame className="text-rose-500 shrink-0" size={12} />
                                    <span className="text-[10px] text-rose-500 dark:text-rose-400 font-medium">#{index + 1} Hot</span>
                                </div>
                                <p className="text-xs text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white font-medium line-clamp-2 leading-tight mb-2">
                                    {formatSlug(problem.slug)}
                                </p>
                                <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-auto">
                                    <span className="flex items-center gap-0.5">
                                        <Eye size={10} />
                                        {problem.views}
                                    </span>
                                    <span className="flex items-center gap-0.5">
                                        <CheckCircle2 size={10} />
                                        {problem.solves}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HotSection;
