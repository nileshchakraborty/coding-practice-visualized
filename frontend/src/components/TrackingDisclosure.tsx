/**
 * TrackingDisclosure - Modal component for user activity tracking consent
 * Fetches dynamic consent content from server
 * Shows on login when user hasn't consented or consent version changed
 */
import { useState, useEffect } from 'react';
import { Shield, Loader2, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface ConsentContent {
    version: string;
    title: string;
    content: string;
    summary: string;
}

interface TrackingDisclosureProps {
    onAccept: (version: string) => Promise<void>;
    onDecline: () => void;
    isOpen: boolean;
}

export default function TrackingDisclosure({ onAccept, onDecline, isOpen }: TrackingDisclosureProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const [consentContent, setConsentContent] = useState<ConsentContent | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch consent content from server
    useEffect(() => {
        if (isOpen) {
            fetchConsentContent();
        }
    }, [isOpen]);

    const fetchConsentContent = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/api/consent/active`);
            if (!response.ok) {
                throw new Error('Failed to load consent content');
            }
            const data = await response.json();
            setConsentContent(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load consent');
            // Fallback content
            setConsentContent({
                version: '1.0',
                title: 'Activity Tracking Consent',
                content: 'We collect data to improve your learning experience.',
                summary: 'Activity tracking helps us personalize your journey.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!consentContent) return;

        setIsAccepting(true);
        try {
            await onAccept(consentContent.version);
        } finally {
            setIsAccepting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-slate-700 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Shield className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {isLoading ? 'Loading...' : consentContent?.title || 'Activity Tracking'}
                            </h2>
                            <p className="text-slate-400 text-sm">Please review before continuing</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 p-3 rounded-lg mb-4">
                            <AlertCircle size={18} />
                            <span className="text-sm">{error}</span>
                        </div>
                    ) : (
                        <>
                            {/* Render markdown-like content */}
                            <div className="prose prose-invert prose-sm max-w-none">
                                {consentContent?.content.split('\n').map((line, i) => {
                                    // Handle bullet points
                                    if (line.startsWith('•')) {
                                        const content = line.substring(1).trim();
                                        const boldMatch = content.match(/\*\*(.+?)\*\*:\s*(.+)/);
                                        return (
                                            <div key={i} className="flex items-start gap-2 mb-2 ml-2">
                                                <span className="text-purple-400 mt-1">•</span>
                                                <p className="text-slate-300 text-sm">
                                                    {boldMatch ? (
                                                        <>
                                                            <strong className="text-white">{boldMatch[1]}:</strong> {boldMatch[2]}
                                                        </>
                                                    ) : content}
                                                </p>
                                            </div>
                                        );
                                    }
                                    // Regular paragraph
                                    if (line.trim()) {
                                        return <p key={i} className="text-slate-300 text-sm mb-3">{line}</p>;
                                    }
                                    return null;
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Version badge */}
                {consentContent && !isLoading && (
                    <div className="px-6 pb-2">
                        <span className="text-xs text-slate-500">Version {consentContent.version}</span>
                    </div>
                )}

                {/* Footer - Required consent notice */}
                <div className="px-6 py-2 bg-amber-500/10 border-t border-amber-500/20">
                    <p className="text-amber-400 text-xs text-center">
                        ⚠️ You must accept to continue using Codenium
                    </p>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700 flex gap-3">
                    <button
                        onClick={onDecline}
                        disabled={isAccepting}
                        className="flex-1 px-4 py-2.5 text-slate-400 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Decline & Logout
                    </button>
                    <button
                        onClick={handleAccept}
                        disabled={isAccepting || isLoading}
                        className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {isAccepting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Accept & Continue'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
