/* eslint-disable max-lines-per-function */
import { useState, useEffect, useCallback } from 'react';
import {
    Shield,
    Plus,
    CheckCircle,
    Clock,
    Calendar,
    Edit2,
    Trash2,
    Power,
    X,
    Save,
    AlertCircle
} from 'lucide-react';

interface ConsentContent {
    id?: number;
    version: string;
    title: string;
    content: string;
    summary: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

interface Props {
    adminToken: string | null;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

export const ConsentManagementTab: React.FC<Props> = ({ adminToken }) => {
    const [consents, setConsents] = useState<ConsentContent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentConsent, setCurrentConsent] = useState<ConsentContent | null>(null);

    const fetchConsents = useCallback(async () => {
        if (!adminToken) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/admin/consent`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (response.ok) {
                const data = await response.json();
                setConsents(data);
            } else {
                setError('Failed to load consent versions');
            }
        } catch {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    }, [adminToken]);

    useEffect(() => {
        fetchConsents();
    }, [fetchConsents]);

    const handleSave = async (consent: ConsentContent) => {
        if (!adminToken) return;
        setLoading(true);
        try {
            const isNew = !consents.some(c => c.version === consent.version);
            const method = isNew ? 'POST' : 'PUT';
            const url = isNew
                ? `${API_BASE}/api/admin/consent`
                : `${API_BASE}/api/admin/consent/${consent.version}`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify(consent)
            });

            if (response.ok) {
                await fetchConsents();
                setIsEditing(false);
                setCurrentConsent(null);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to save consent');
            }
        } catch {
            setError('Failed to save consent');
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (version: string) => {
        if (!adminToken) return;
        if (!confirm(`Are you sure you want to activate version ${version}? This will force all users to re-consent.`)) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/admin/consent/${version}/activate`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });

            if (response.ok) {
                await fetchConsents();
            } else {
                setError('Failed to activate version');
            }
        } catch {
            setError('Failed to activate version');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (version: string) => {
        if (!adminToken) return;
        if (!confirm(`Are you sure you want to delete version ${version}?`)) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/admin/consent/${version}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });

            if (response.ok) {
                await fetchConsents();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete version');
            }
        } catch {
            setError('Failed to delete version');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="text-indigo-400" />
                        Consent Management
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Manage tracking consent versions. activating a new version will force all users to re-accept.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setCurrentConsent({
                            version: `1.${consents.length + 1}`,
                            title: 'Data Collection & Privacy Policy',
                            content: '## Data Collection\n\nWe collect ...',
                            summary: 'Updated privacy terms regarding ...',
                            is_active: false
                        });
                        setIsEditing(true);
                    }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Plus size={18} />
                    New Version
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-2 mb-6">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {isEditing && currentConsent && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">
                            {consents.some(c => c.version === currentConsent.version) ? 'Edit Version' : 'New Version'}
                        </h3>
                        <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Version Number</label>
                                <input
                                    type="text"
                                    value={currentConsent.version}
                                    onChange={e => setCurrentConsent({ ...currentConsent, version: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    placeholder="e.g. 1.2"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={currentConsent.title}
                                    onChange={e => setCurrentConsent({ ...currentConsent, title: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Summary (Change Log)</label>
                            <input
                                type="text"
                                value={currentConsent.summary}
                                onChange={e => setCurrentConsent({ ...currentConsent, summary: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                placeholder="Briefly describe what changed..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Content (Markdown)</label>
                            <textarea
                                value={currentConsent.content}
                                onChange={e => setCurrentConsent({ ...currentConsent, content: e.target.value })}
                                className="w-full h-64 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSave(currentConsent)}
                                disabled={loading}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                {loading ? <span className="animate-spin">⌛</span> : <Save size={18} />}
                                Save Version
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {consents.map(consent => (
                    <div
                        key={consent.version}
                        className={`bg-slate-800/50 border rounded-xl p-5 transition-all ${consent.is_active
                            ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                            : 'border-slate-700 hover:border-slate-600'
                            }`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold text-white">v{consent.version}</h3>
                                    {consent.is_active ? (
                                        <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full text-xs font-bold border border-emerald-500/20">
                                            <CheckCircle size={12} />
                                            Active
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full text-xs font-medium">
                                            <Clock size={12} />
                                            Inactive
                                        </span>
                                    )}
                                    <span className="text-slate-500 text-xs flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(consent.created_at || Date.now()).toLocaleDateString()}
                                    </span>
                                </div>
                                <h4 className="text-slate-200 font-medium mb-1">{consent.title}</h4>
                                <p className="text-slate-400 text-sm">{consent.summary}</p>
                            </div>

                            <div className="flex items-center gap-2">
                                {!consent.is_active && (
                                    <>
                                        <button
                                            onClick={() => handleActivate(consent.version)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-medium transition-colors"
                                            title="Activate this version"
                                        >
                                            <Power size={14} />
                                            Activate
                                        </button>
                                        <button
                                            onClick={() => {
                                                setCurrentConsent(consent);
                                                setIsEditing(true);
                                            }}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(consent.version)}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {consents.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-500">
                        <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No consent versions found. Create one to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
