import React, { useState, useEffect, useCallback } from 'react';
import {
    Users,
    CheckCircle,
    Activity,
    Globe,
    TrendingUp,
    Monitor,
    Clock,
    RefreshCw,
    BarChart2
} from 'lucide-react';

interface Metrics {
    totalUsers: number;
    activeUsersToday: number;
    problemsSolved: number;
    totalCompiles: number;
    avgWatchTime: number;
}

interface DailyActivity {
    date: string;
    views: number;
    solves: number;
    compiles: number;
}

interface TopProblem {
    slug: string;
    views: number;
    solves: number;
    avgTime: number;
}

interface GeoData {
    country: string;
    city: string;
    count: number;
}

interface AnalyticsTabProps {
    adminToken: string | null;
}

// eslint-disable-next-line max-lines-per-function
export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ adminToken }) => {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [activity, setActivity] = useState<DailyActivity[]>([]);
    const [topProblems, setTopProblems] = useState<TopProblem[]>([]);
    const [geoDist, setGeoDist] = useState<GeoData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_BASE = import.meta.env.VITE_API_URL || '';

    const fetchAnalytics = useCallback(async () => {
        if (!adminToken) return;
        setLoading(true);
        setError(null);

        try {
            const headers = { 'Authorization': `Bearer ${adminToken}` };

            const [metricsRes, activityRes, problemsRes, geoRes] = await Promise.all([
                fetch(`${API_BASE}/api/admin/analytics/overview`, { headers }),
                fetch(`${API_BASE}/api/admin/analytics/activity`, { headers }),
                fetch(`${API_BASE}/api/admin/analytics/problems`, { headers }),
                fetch(`${API_BASE}/api/admin/analytics/geo`, { headers })
            ]);

            if (!metricsRes.ok) throw new Error('Failed to fetch metrics');

            const [metricsData, activityData, problemsData, geoData] = await Promise.all([
                metricsRes.json(),
                activityRes.json(),
                problemsRes.json(),
                geoRes.json()
            ]);

            setMetrics(metricsData);
            setActivity(activityData);
            setTopProblems(problemsData);
            setGeoDist(geoData);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'An error occurred while fetching analytics';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [adminToken, API_BASE]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    if (loading && !metrics) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 animate-pulse">Analyzing system activity...</p>
            </div>
        );
    }

    // --- Helper for Line Chart (SVG) ---
    const renderLineChart = (data: DailyActivity[]) => {
        if (data.length === 0) return <div className="h-48 flex items-center justify-center text-slate-500">No activity data available</div>;

        const maxVal = Math.max(...data.map(d => Math.max(d.views, d.solves, d.compiles)), 10);
        const height = 200;
        const width = 600;
        const padding = 20;

        const points = (key: keyof Pick<DailyActivity, 'views' | 'solves' | 'compiles'>) =>
            data.map((d, i) => {
                const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
                const y = height - ((d[key] / maxVal) * (height - 2 * padding)) - padding;
                return `${x},${y}`;
            }).join(' ');

        return (
            <div className="relative w-full h-full group">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full drop-shadow-2xl">
                    <defs>
                        <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(v => (
                        <line
                            key={v}
                            x1={padding} y1={height - padding - (height - 2 * padding) * v}
                            x2={width - padding} y2={height - padding - (height - 2 * padding) * v}
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="1"
                        />
                    ))}

                    {/* Fills */}
                    <polyline points={`${points('views')} ${width - padding},${height - padding} ${padding},${height - padding}`} fill="url(#viewsGradient)" />

                    {/* Lines */}
                    <polyline points={points('views')} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500" />
                    <polyline points={points('compiles')} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" strokeOpacity="0.6" />
                    <polyline points={points('solves')} fill="none" stroke="#f59e0b" strokeWidth="2" strokeOpacity="0.8" />
                </svg>
                <div className="absolute top-2 right-2 flex gap-4 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Views</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Solves</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Compiles</div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">System Intelligence</h2>
                    <p className="text-slate-400 mt-1">Real-time performance and user engagement metrics</p>
                </div>
                <button
                    onClick={fetchAnalytics}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl transition-all border border-slate-700 active:scale-95"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
                    <TrendingUp className="rotate-180" />
                    {error}
                </div>
            )}

            {/* Metrics HUD */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Total Base', value: metrics?.totalUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'DAU', value: metrics?.activeUsersToday, icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                    { label: 'Total Solves', value: metrics?.problemsSolved, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Compile OPS', value: metrics?.totalCompiles, icon: Monitor, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    { label: 'Avg Watch', value: `${metrics?.avgWatchTime}s`, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition-all group">
                        <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <stat.icon size={20} />
                        </div>
                        <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{stat.value ?? '—'}</h3>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Waveform */}
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Activity className="text-indigo-500" size={20} />
                            Activity Waveform
                        </h3>
                        <span className="text-xs text-slate-500 font-mono">Last 30 Days</span>
                    </div>
                    <div className="h-64">
                        {renderLineChart(activity)}
                    </div>
                </div>

                {/* Geo Distribution Panel */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                        <Globe className="text-emerald-500" size={20} />
                        Global Footprint
                    </h3>
                    <div className="space-y-4 max-h-[260px] overflow-y-auto custom-scrollbar pr-2">
                        {geoDist.length > 0 ? geoDist.map((item, i) => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
                                        {item.country}
                                    </div>
                                    <div className="text-sm">
                                        <p className="text-slate-200 group-hover:text-white transition-colors">{item.city || 'Unknown'}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{item.country}</p>
                                    </div>
                                </div>
                                <span className="text-indigo-400 font-mono text-sm">{item.count}</span>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-full py-10 opacity-40">
                                <Globe size={40} className="mb-2" />
                                <p className="text-xs">Awaiting geo data...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Top Problems */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <BarChart2 className="text-amber-500" size={20} />
                        Highest Engagement Problems
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    {topProblems.map((problem, i) => (
                        <div key={i} className="flex items-center gap-4 group">
                            <span className="text-slate-600 font-mono text-xl w-6">{i + 1}</span>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{problem.slug}</span>
                                    <span className="text-xs text-slate-500 font-mono">{problem.solves} solves / {problem.views} views</span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-1000 ease-out"
                                        style={{ width: `${Math.min(100, (problem.views / (topProblems[0]?.views || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
