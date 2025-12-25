/**
 * Admin Dashboard Page
 * 
 * Central control panel for site management.
 * Features: Study plans, problems, solutions, analytics
 * 
 * Supports both:
 * - Production: Google OAuth + TOTP authentication
 * - Local: JWE token authentication
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLogin } from '../components/AdminLogin';
import { useAuth } from '../context/AuthContextDefinition';
import {
    LayoutDashboard,
    BookOpen,
    Code2,
    BarChart3,
    LogOut,
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    ChevronRight,
    AlertCircle,
    CheckCircle,
    Clock,
    TrendingUp,
    Users,
    Activity,
    Database,
    RefreshCw
} from 'lucide-react';

// Types
interface StudyPlan {
    id: string;
    name: string;
    icon: string;
    description: string;
    problems: string[];
}

interface Stats {
    totalProblems: number;
    totalSolutions: number;
    totalPlans: number;
    studyPlanStats: { id: string; name: string; problemCount: number }[];
}

interface ActivityLog {
    timestamp: string;
    action: string;
    details: string;
    email?: string;
    ip: string;
}

interface AnalyticsData {
    recommendations: {
        hotProblems: { slug: string; count: number }[];
        hotTopics: { topic: string; count: number }[];
        stats: { totalViews: number; uniqueProblems: number };
    };
    progress: { totalUsers: number; totalSolves: number };
    cache: { size: number; hits: number; misses: number };
    recentActivity: ActivityLog[];
}

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || '';

export const AdminPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, accessToken, login } = useAuth();
    const [adminToken, setAdminToken] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'plans' | 'problems' | 'analytics'>('dashboard');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Data state
    const [stats, setStats] = useState<Stats | null>(null);
    const [studyPlans, setStudyPlans] = useState<Record<string, StudyPlan>>({});
    const [editingPlan, setEditingPlan] = useState<StudyPlan | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

    // API helper
    const adminFetch = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        const response = await fetch(`${API_BASE}/api/admin${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': adminToken || '',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Request failed');
        }

        return response.json();
    }, [adminToken]);

    // Load data
    const loadData = useCallback(async () => {
        if (!adminToken) return;

        setLoading(true);
        setError(null);

        try {
            const [statsData, plansData] = await Promise.all([
                adminFetch('/stats'),
                adminFetch('/study-plans'),
            ]);

            setStats(statsData);
            setStudyPlans(plansData.plans || {});
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [adminToken, adminFetch]);

    // Load analytics
    const loadAnalytics = useCallback(async () => {
        if (!adminToken) return;

        try {
            const [analyticsData, logsData] = await Promise.all([
                adminFetch('/analytics'),
                adminFetch('/logs?limit=50'),
            ]);

            setAnalytics(analyticsData);
            setActivityLogs(logsData.logs || []);
        } catch (err) {
            console.error('Failed to load analytics:', err);
        }
    }, [adminToken, adminFetch]);

    useEffect(() => {
        if (adminToken) {
            loadData();
            loadAnalytics();
        }
    }, [adminToken, loadData, loadAnalytics]);

    // Handle login
    const handleLogin = (token: string) => {
        setAdminToken(token);
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await fetch(`${API_BASE}/api/admin/revoke`, {
                method: 'POST',
                headers: { 'x-admin-token': adminToken || '' }
            });
        } catch {
            // Ignore revoke errors
        }
        sessionStorage.removeItem('admin_token');
        setAdminToken(null);
        setStats(null);
        setStudyPlans({});
        setAnalytics(null);
    };

    // Save study plan
    const savePlan = async (plan: StudyPlan) => {
        setLoading(true);
        setError(null);

        try {
            if (studyPlans[plan.id]) {
                await adminFetch(`/study-plans/${plan.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(plan),
                });
            } else {
                await adminFetch('/study-plans', {
                    method: 'POST',
                    body: JSON.stringify(plan),
                });
            }

            setSuccess('Study plan saved successfully');
            setEditingPlan(null);
            await loadData();

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    // Delete study plan
    const deletePlan = async (id: string) => {
        if (!confirm(`Delete study plan "${studyPlans[id]?.name}"?`)) return;

        setLoading(true);
        try {
            await adminFetch(`/study-plans/${id}`, { method: 'DELETE' });
            setSuccess('Study plan deleted');
            await loadData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete');
        } finally {
            setLoading(false);
        }
    };

    // Format timestamp
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return 'just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    // Show login if not authenticated
    if (!adminToken) {
        return (
            <AdminLogin
                onLogin={handleLogin}
                googleToken={accessToken}
                googleEmail={user?.email}
                login={login}
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800/50 border-r border-slate-700 p-4 flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                        <LayoutDashboard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold">Admin Panel</h1>
                        <p className="text-xs text-slate-400">Codenium</p>
                    </div>
                </div>

                <nav className="space-y-1 flex-1">
                    {[
                        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                        { id: 'plans', icon: BookOpen, label: 'Study Plans' },
                        { id: 'problems', icon: Code2, label: 'Problems' },
                        { id: 'analytics', icon: BarChart3, label: 'Analytics' },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id as typeof activeTab);
                                if (item.id === 'analytics') loadAnalytics();
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === item.id
                                ? 'bg-purple-600/20 text-purple-400'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="pt-4 border-t border-slate-700">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors mb-2"
                    >
                        <ChevronRight size={18} className="rotate-180" />
                        Back to Site
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto">
                {/* Notifications */}
                {error && (
                    <div className="mb-4 flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                        <AlertCircle size={18} />
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto"><X size={16} /></button>
                    </div>
                )}
                {success && (
                    <div className="mb-4 flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
                        <CheckCircle size={18} />
                        {success}
                    </div>
                )}

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && stats && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                                <p className="text-slate-400 text-sm mb-1">Total Problems</p>
                                <p className="text-3xl font-bold text-white">{stats.totalProblems}</p>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                                <p className="text-slate-400 text-sm mb-1">Total Solutions</p>
                                <p className="text-3xl font-bold text-white">{stats.totalSolutions}</p>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                                <p className="text-slate-400 text-sm mb-1">Study Plans</p>
                                <p className="text-3xl font-bold text-white">{stats.totalPlans}</p>
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-white mb-4">Study Plan Stats</h3>
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left text-slate-400 text-sm font-medium px-4 py-3">Plan</th>
                                        <th className="text-right text-slate-400 text-sm font-medium px-4 py-3">Problems</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.studyPlanStats.map(plan => (
                                        <tr key={plan.id} className="border-b border-slate-700/50 last:border-0">
                                            <td className="text-white px-4 py-3">{plan.name}</td>
                                            <td className="text-right text-slate-300 px-4 py-3">{plan.problemCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Study Plans Tab */}
                {activeTab === 'plans' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Study Plans</h2>
                            <button
                                onClick={() => setEditingPlan({ id: '', name: '', icon: '📚', description: '', problems: [] })}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg"
                            >
                                <Plus size={18} />
                                Add Plan
                            </button>
                        </div>

                        {/* Plan Editor Modal */}
                        {editingPlan && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
                                    <h3 className="text-xl font-bold text-white mb-4">
                                        {editingPlan.id && studyPlans[editingPlan.id] ? 'Edit Plan' : 'New Plan'}
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">ID (slug)</label>
                                                <input
                                                    type="text"
                                                    value={editingPlan.id}
                                                    onChange={e => setEditingPlan({ ...editingPlan, id: e.target.value })}
                                                    disabled={!!studyPlans[editingPlan.id]}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white disabled:opacity-50"
                                                    placeholder="e.g., blind75"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">Icon</label>
                                                <input
                                                    type="text"
                                                    value={editingPlan.icon}
                                                    onChange={e => setEditingPlan({ ...editingPlan, icon: e.target.value })}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                                    placeholder="🔥"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={editingPlan.name}
                                                onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                                placeholder="Blind 75"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Description</label>
                                            <textarea
                                                value={editingPlan.description}
                                                onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
                                                rows={2}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white resize-none"
                                                placeholder="Core interview problems"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Problems (one slug per line)</label>
                                            <textarea
                                                value={editingPlan.problems.join('\n')}
                                                onChange={e => setEditingPlan({
                                                    ...editingPlan,
                                                    problems: e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                                                })}
                                                rows={8}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm resize-none"
                                                placeholder="two-sum&#10;valid-anagram&#10;..."
                                            />
                                            <p className="text-xs text-slate-500 mt-1">
                                                {editingPlan.problems.length} problems
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 mt-6">
                                        <button
                                            onClick={() => setEditingPlan(null)}
                                            className="px-4 py-2 text-slate-400 hover:text-white"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => savePlan(editingPlan)}
                                            disabled={loading || !editingPlan.id || !editingPlan.name}
                                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg"
                                        >
                                            <Save size={16} />
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Plans List */}
                        <div className="space-y-3">
                            {Object.values(studyPlans).map(plan => (
                                <div
                                    key={plan.id}
                                    className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{plan.icon}</span>
                                        <div>
                                            <p className="text-white font-medium">{plan.name}</p>
                                            <p className="text-sm text-slate-400">{plan.problems.length} problems</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setEditingPlan(plan)}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                                            title="Edit Plan"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => deletePlan(plan.id)}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                            title="Delete Plan"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <ChevronRight size={16} className="text-slate-600" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Problems Tab */}
                {activeTab === 'problems' && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Problems Management</h2>
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
                            <Code2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">Problems editor coming soon</p>
                            <p className="text-sm text-slate-500">Edit problems.json directly for now</p>
                        </div>
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Analytics</h2>
                            <button
                                onClick={loadAnalytics}
                                className="flex items-center gap-2 text-slate-400 hover:text-white"
                                title="Refresh Data"
                            >
                                <RefreshCw size={16} />
                                Refresh
                            </button>
                        </div>

                        {analytics ? (
                            <div className="space-y-6">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                                            <TrendingUp size={16} />
                                            <span className="text-sm">Total Views</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white">{analytics.recommendations.stats.totalViews}</p>
                                    </div>
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                                            <Users size={16} />
                                            <span className="text-sm">Active Users</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white">{analytics.progress.totalUsers}</p>
                                    </div>
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                                            <CheckCircle size={16} />
                                            <span className="text-sm">Problems Solved</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white">{analytics.progress.totalSolves}</p>
                                    </div>
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                                            <Database size={16} />
                                            <span className="text-sm">Cache Size</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white">{analytics.cache.size}</p>
                                    </div>
                                </div>

                                {/* Hot Problems & Topics */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <TrendingUp size={18} className="text-orange-400" />
                                            Hot Problems
                                        </h3>
                                        <div className="space-y-2">
                                            {analytics.recommendations.hotProblems.slice(0, 5).map((p, i) => (
                                                <div key={p.slug} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-500 text-sm w-5">{i + 1}.</span>
                                                        <span className="text-white">{p.slug.replace(/-/g, ' ')}</span>
                                                    </div>
                                                    <span className="text-slate-400 text-sm">{p.count} views</span>
                                                </div>
                                            ))}
                                            {analytics.recommendations.hotProblems.length === 0 && (
                                                <p className="text-slate-500 text-sm">No data yet</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <Activity size={18} className="text-purple-400" />
                                            Hot Topics
                                        </h3>
                                        <div className="space-y-2">
                                            {analytics.recommendations.hotTopics.slice(0, 5).map((t, i) => (
                                                <div key={t.topic} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-500 text-sm w-5">{i + 1}.</span>
                                                        <span className="text-white capitalize">{t.topic}</span>
                                                    </div>
                                                    <span className="text-slate-400 text-sm">{t.count} views</span>
                                                </div>
                                            ))}
                                            {analytics.recommendations.hotTopics.length === 0 && (
                                                <p className="text-slate-500 text-sm">No data yet</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Activity Logs */}
                                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Clock size={18} className="text-blue-400" />
                                        Recent Activity
                                    </h3>
                                    <div className="space-y-1 max-h-80 overflow-auto">
                                        {activityLogs.map((log, i) => (
                                            <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-700/50 last:border-0">
                                                <span className="text-slate-500 text-xs whitespace-nowrap mt-0.5">
                                                    {formatTime(log.timestamp)}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                                                            {log.action}
                                                        </span>
                                                        {log.email && (
                                                            <span className="text-xs text-slate-500">{log.email}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-400 truncate mt-1">{log.details}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {activityLogs.length === 0 && (
                                            <p className="text-slate-500 text-sm py-4 text-center">No activity logs yet</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
                                <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400">Loading analytics...</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminPage;
