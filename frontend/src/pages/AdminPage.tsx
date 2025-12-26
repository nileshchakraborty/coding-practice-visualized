/* eslint-disable max-lines */
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

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLogin } from '../components/AdminLogin';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { AnalyticsTab } from '../components/admin/AnalyticsTab';
import { ProblemHistoryTab } from '../components/admin/ProblemHistoryTab';
import { ConsentManagementTab } from '../components/admin/ConsentManagementTab';
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

interface Topic {
    id: string;
    name: string;
    slug: string;
    aliases: string[];
    icon: string;
}

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || '';

// eslint-disable-next-line complexity, max-lines-per-function
export const AdminPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, accessToken, login } = useAuth();
    const [adminToken, setAdminToken] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'plans' | 'problems' | 'analytics' | 'topics' | 'history' | 'consent'>('dashboard');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Data state
    const [stats, setStats] = useState<Stats | null>(null);
    const [studyPlans, setStudyPlans] = useState<Record<string, StudyPlan>>({});
    const [editingPlan, setEditingPlan] = useState<StudyPlan | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
    const [normalizationResult, setNormalizationResult] = useState<{ updated: number, errors: Array<{ slug: string; error: string }> } | null>(null);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDangerous?: boolean;
        confirmText?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });


    // API helper
    const adminFetch = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        const response = await fetch(`${API_BASE}/api/admin${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken || ''}`,
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

            const [analyticsData] = await Promise.all([
                adminFetch('/analytics'),
            ]);

            setAnalytics(analyticsData);
        } catch (err) {
            console.error('Failed to load analytics:', err);
        }
    }, [adminToken, adminFetch]);

    // Load topics
    const loadTopics = useCallback(async () => {
        if (!adminToken) return;
        try {
            await adminFetch('/../topics'); // Hack: adminFetch prefixes /api/admin, so we back out
            // Actually let's just use raw fetch for non-admin prefixed routes if needed, 
            // but for simplicity let's stick to standard fetch for public routes.
            const response = await fetch(`${API_BASE}/api/topics`);
            const json = await response.json();
            setTopics(json);
        } catch (err) {
            console.error('Failed to load topics:', err);
        }
    }, [adminToken, adminFetch]);

    useEffect(() => {
        if (adminToken) {
            loadData();
            loadAnalytics();
            loadTopics();
        }
    }, [adminToken, loadData, loadAnalytics, loadTopics]);

    // Handle login
    const handleLogin = (token: string) => {
        setAdminToken(token);
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await fetch(`${API_BASE}/api/admin/revoke`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${adminToken || ''}` }
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

    // Timer ref to prevent race conditions
    const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showSuccess = (message: string, duration = 3000) => {
        if (successTimer.current) clearTimeout(successTimer.current);
        setSuccess(message);
        // Only auto-clear if duration is positive
        if (duration > 0) {
            successTimer.current = setTimeout(() => setSuccess(null), duration);
        }
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

            showSuccess('Study plan saved successfully');
            setEditingPlan(null);
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    // Save topic
    const saveTopic = async (topic: Topic) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/topics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(topic)
            });
            if (!response.ok) throw new Error('Failed to save topic');

            showSuccess('Topic saved successfully');
            setEditingTopic(null);
            await loadTopics();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save topic');
        } finally {
            setLoading(false);
        }
    };

    // Normalize problems
    const normalizeTopics = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Normalize Topics',
            message: 'This will scan all problems and update their categories to match the canonical topics based on aliases. This action affects the live database. Are you sure you want to continue?',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setLoading(true);
                try {
                    const response = await fetch(`${API_BASE}/api/topics/normalize`, {
                        method: 'POST'
                    });
                    const result = await response.json();
                    setNormalizationResult(result);
                    // Don't auto-clear success for normalization so user sees the count
                    showSuccess(`Normalized ${result.updated} problems!`, 5000);
                    await loadData(); // Reload stats
                } catch {
                    setError('Failed to normalize topics');
                } finally {
                    setLoading(false);
                }
            },
            isDangerous: true,
            confirmText: 'Yes, Normalize'
        });
    };

    // Delete study plan
    const deletePlan = (id: string) => {
        const planName = studyPlans[id]?.name;
        setConfirmModal({
            isOpen: true,
            title: 'Delete Study Plan',
            message: `Are you sure you want to delete the study plan "${planName}"? This action cannot be undone.`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setLoading(true);
                try {
                    await adminFetch(`/study-plans/${id}`, { method: 'DELETE' });
                    showSuccess('Study plan deleted');
                    await loadData();
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to delete');
                } finally {
                    setLoading(false);
                }
            },
            isDangerous: true,
            confirmText: 'Delete Plan'
        });
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
                        { id: 'topics', icon: Database, label: 'Manage Topics' },
                        { id: 'problems', icon: Code2, label: 'Problems' },
                        { id: 'history', icon: Clock, label: 'History' },
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



                {/* Topics Tab */}
                {
                    activeTab === 'topics' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">Manage Topics</h2>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={normalizeTopics}
                                        className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg"
                                        title="Scan problems and update categories based on aliases"
                                    >
                                        <RefreshCw size={18} />
                                        Normalize Database
                                    </button>
                                    <button
                                        onClick={() => setEditingTopic({ id: '', name: '', slug: '', aliases: [], icon: '📝' })}
                                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg"
                                    >
                                        <Plus size={18} />
                                        Add Topic
                                    </button>
                                </div>
                            </div>

                            {normalizationResult && (
                                <div className="mb-6 bg-slate-800/50 border border-slate-700 rounded-xl p-4 relative">
                                    <button
                                        onClick={() => setNormalizationResult(null)}
                                        className="absolute top-4 right-4 text-slate-400 hover:text-white"
                                    >
                                        <X size={16} />
                                    </button>
                                    <h4 className="text-white font-medium mb-2">Normalization Result</h4>
                                    <p className="text-emerald-400 text-sm">✅ Updated {normalizationResult.updated} problems</p>
                                    {normalizationResult.errors?.length > 0 && (
                                        <div className="mt-2 text-red-400 text-sm">
                                            <p className="font-medium mb-1">Errors:</p>
                                            <ul className="list-disc pl-4">
                                                {normalizationResult.errors.map((e, i) => (
                                                    <li key={i}>{e.slug}: {e.error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Cache Management Card */}
                            <div className="mb-6 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-white font-medium flex items-center gap-2">
                                        <Database size={18} className="text-blue-400" />
                                        Cache Management
                                    </h4>
                                    <button
                                        onClick={async () => {
                                            setLoading(true);
                                            try {
                                                const response = await fetch(`${API_BASE}/api/admin/cache/invalidate`, {
                                                    method: 'POST',
                                                    headers: { 'Authorization': `Bearer ${adminToken || ''}` }
                                                });
                                                const result = await response.json();
                                                if (result.success) {
                                                    showSuccess(result.message);
                                                    // Reload the page data to show fresh content
                                                    await loadData();
                                                } else {
                                                    setError(result.error || 'Failed to refresh cache');
                                                }
                                            } catch {
                                                setError('Failed to refresh cache');
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        disabled={loading}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm"
                                    >
                                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                        Refresh Cache
                                    </button>
                                </div>
                                <p className="text-slate-400 text-sm mb-3">
                                    If problems or categories appear incorrect, refresh the cache to reload data from the source file.
                                    This ensures the correct learning flow order is restored.
                                </p>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-white">{analytics?.cache?.hits ?? '—'}</p>
                                        <p className="text-xs text-slate-500">Cache Hits</p>
                                    </div>
                                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-white">{analytics?.cache?.misses ?? '—'}</p>
                                        <p className="text-xs text-slate-500">Cache Misses</p>
                                    </div>
                                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-white">{analytics?.cache?.size ?? '—'}</p>
                                        <p className="text-xs text-slate-500">Cache Size</p>
                                    </div>
                                </div>
                            </div>

                            {/* Topic Editor */}
                            {editingTopic && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
                                        <h3 className="text-xl font-bold text-white mb-4">
                                            {editingTopic.id ? 'Edit Topic' : 'New Topic'}
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">Name</label>
                                                <input
                                                    type="text"
                                                    value={editingTopic.name}
                                                    onChange={e => setEditingTopic({ ...editingTopic, name: e.target.value })}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">Slug (auto-generated if empty)</label>
                                                <input
                                                    type="text"
                                                    value={editingTopic.slug}
                                                    onChange={e => setEditingTopic({ ...editingTopic, slug: e.target.value })}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">Icon</label>
                                                <input
                                                    type="text"
                                                    value={editingTopic.icon}
                                                    onChange={e => setEditingTopic({ ...editingTopic, icon: e.target.value })}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">Aliases (comma separated)</label>
                                                <textarea
                                                    value={editingTopic.aliases.join(', ')}
                                                    onChange={e => setEditingTopic({
                                                        ...editingTopic,
                                                        aliases: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                                    })}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                                    rows={3}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                onClick={() => setEditingTopic(null)}
                                                className="px-4 py-2 text-slate-400 hover:text-white"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => saveTopic(editingTopic)}
                                                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {topics.map(topic => (
                                    <div key={topic.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{topic.icon}</span>
                                            <div>
                                                <p className="font-medium text-white">{topic.name}</p>
                                                {topic.aliases.length > 0 && (
                                                    <p className="text-xs text-slate-500 truncate max-w-[150px]">
                                                        {topic.aliases.join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setEditingTopic(topic)}
                                            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* Problems Tab */}
                {
                    activeTab === 'problems' && (
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-6">Problems Management</h2>

                            {/* Cache Management Card */}
                            <div className="mb-6 bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-white font-medium flex items-center gap-2">
                                        <Database size={18} className="text-blue-400" />
                                        Cache Management
                                    </h4>
                                    <button
                                        onClick={async () => {
                                            setLoading(true);
                                            try {
                                                const response = await fetch(`${API_BASE}/api/admin/cache/invalidate`, {
                                                    method: 'POST',
                                                    headers: { 'Authorization': `Bearer ${adminToken || ''}` }
                                                });
                                                const result = await response.json();
                                                if (result.success) {
                                                    showSuccess(result.message);
                                                    await loadData();
                                                } else {
                                                    setError(result.error || 'Failed to refresh cache');
                                                }
                                            } catch {
                                                setError('Failed to refresh cache');
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        disabled={loading}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg"
                                    >
                                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                        Refresh Problems Cache
                                    </button>
                                </div>
                                <p className="text-slate-400 text-sm mb-4">
                                    Refresh the cache to reload problems from <code className="text-purple-400 bg-slate-900/50 px-1.5 py-0.5 rounded">problems.json</code>.
                                    This ensures the correct category order and learning flow is restored.
                                </p>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-white">{analytics?.cache?.hits ?? '—'}</p>
                                        <p className="text-xs text-slate-500">Cache Hits</p>
                                    </div>
                                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-white">{analytics?.cache?.misses ?? '—'}</p>
                                        <p className="text-xs text-slate-500">Cache Misses</p>
                                    </div>
                                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-white">{analytics?.cache?.size ?? '—'}</p>
                                        <p className="text-xs text-slate-500">Cache Size</p>
                                    </div>
                                </div>
                            </div>

                            {/* Learning Flow Order Card */}
                            <div className="mb-6 bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                                <h4 className="text-white font-medium flex items-center gap-2 mb-3">
                                    <ChevronRight size={18} className="text-purple-400" />
                                    Learning Flow Order
                                </h4>
                                <p className="text-slate-400 text-sm mb-4">
                                    Configure the order of categories and problems to create an optimal learning path.
                                    Changes are persisted and reflected on the main site.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => navigate('/admin/category-order')}
                                        className="flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 px-4 py-3 rounded-lg transition-colors"
                                    >
                                        <Database size={16} />
                                        Category Order
                                    </button>
                                    <button
                                        onClick={() => navigate('/admin/problem-order')}
                                        className="flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 px-4 py-3 rounded-lg transition-colors"
                                    >
                                        <Code2 size={16} />
                                        Problem Order
                                    </button>
                                </div>
                            </div>

                            {/* Source of Truth Info */}
                            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                                <div className="flex items-start gap-4">
                                    <Code2 className="w-10 h-10 text-purple-400 flex-shrink-0 mt-1" />
                                    <div>
                                        <h4 className="text-white font-medium mb-2">Source of Truth</h4>
                                        <p className="text-slate-400 text-sm mb-3">
                                            Problems are loaded from <code className="text-purple-400 bg-slate-900/50 px-1.5 py-0.5 rounded">api/data/problems.json</code>.
                                            The category order in this file determines the learning flow progression on the main site.
                                        </p>
                                        <div className="flex items-center gap-3 text-sm">
                                            <span className="flex items-center gap-1.5 text-emerald-400">
                                                <CheckCircle size={14} />
                                                {stats?.totalProblems || 0} problems
                                            </span>
                                            <span className="flex items-center gap-1.5 text-blue-400">
                                                <Database size={14} />
                                                {stats?.totalSolutions || 0} solutions
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* History Tab */}
                {activeTab === 'history' && (
                    <ProblemHistoryTab adminToken={adminToken} />
                )}

                {/* Analytics Tab */}
                {
                    activeTab === 'analytics' && (
                        <AnalyticsTab adminToken={adminToken} />
                    )
                }

                {/* Consent Tab */}
                {
                    activeTab === 'consent' && (
                        <ConsentManagementTab adminToken={adminToken} />
                    )
                }
            </main>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                isDangerous={confirmModal.isDangerous}
                confirmText={confirmModal.confirmText}
            />
        </div>
    );
};

export default AdminPage;
