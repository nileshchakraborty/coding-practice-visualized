/**
 * useTrackingConsent - Hook for managing mandatory user activity tracking consent
 * - Fetches active consent version from server
 * - Checks if user has consented to current version
 * - Forces re-consent when admin changes consent content
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

const CONSENT_KEY = 'codenium_tracking_consent';
const API_BASE = import.meta.env.VITE_API_URL || '';

interface ConsentState {
    accepted: boolean;
    version: string;
    acceptedAt: string | null;
}

interface ConsentContent {
    version: string;
    title: string;
    content: string;
    summary: string;
}

interface ServerConsentStatus {
    tracking_consent: boolean;
    consent_accepted_at: string | null;
    consent_version: string | null;
}

export function useTrackingConsent() {
    const { user, isAuthenticated, logout } = useAuth();
    const [showDisclosure, setShowDisclosure] = useState(false);
    const [hasConsent, setHasConsent] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeVersion, setActiveVersion] = useState<string | null>(null);
    const [consentContent, setConsentContent] = useState<ConsentContent | null>(null);

    // Fetch active consent version and check user's consent status
    useEffect(() => {
        const checkConsent = async () => {
            if (!isAuthenticated || !user) {
                setHasConsent(null);
                setShowDisclosure(false);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);

            try {
                // 1. Fetch current active consent version
                const activeRes = await fetch(`${API_BASE}/api/consent/active`);
                if (!activeRes.ok) {
                    throw new Error('Failed to fetch active consent');
                }
                const activeConsent: ConsentContent = await activeRes.json();
                setActiveVersion(activeConsent.version);
                setConsentContent(activeConsent);

                // 2. Check local storage first
                const localConsent = localStorage.getItem(CONSENT_KEY);
                if (localConsent) {
                    try {
                        const parsed: ConsentState = JSON.parse(localConsent);
                        // Check if local consent matches current active version
                        if (parsed.version === activeConsent.version && parsed.accepted) {
                            setHasConsent(true);
                            setShowDisclosure(false);
                            setIsLoading(false);
                            return;
                        }
                    } catch {
                        localStorage.removeItem(CONSENT_KEY);
                    }
                }

                // 3. Check server-side consent status
                const token = sessionStorage.getItem('auth_token') || localStorage.getItem('google_token');
                if (token) {
                    const statusRes = await fetch(`${API_BASE}/api/user/consent`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (statusRes.ok) {
                        const status: ServerConsentStatus = await statusRes.json();

                        // Check if server consent matches current version
                        if (status.tracking_consent && status.consent_version === activeConsent.version) {
                            // Update local storage and mark as consented
                            const consentState: ConsentState = {
                                accepted: true,
                                version: activeConsent.version,
                                acceptedAt: status.consent_accepted_at
                            };
                            localStorage.setItem(CONSENT_KEY, JSON.stringify(consentState));
                            setHasConsent(true);
                            setShowDisclosure(false);
                            setIsLoading(false);
                            return;
                        }
                    }
                }

                // No valid consent - show disclosure (mandatory)
                setHasConsent(false);
                setShowDisclosure(true);
            } catch (error) {
                console.error('Consent check error:', error);
                // On error, still show disclosure to be safe
                setHasConsent(false);
                setShowDisclosure(true);
            } finally {
                setIsLoading(false);
            }
        };

        checkConsent();
    }, [isAuthenticated, user]);

    // Accept consent
    const acceptConsent = useCallback(async (version: string) => {
        const token = sessionStorage.getItem('auth_token') || localStorage.getItem('google_token');

        // Save to server first
        if (token) {
            const response = await fetch(`${API_BASE}/api/user/consent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    tracking_consent: true,
                    consent_version: version
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save consent');
            }
        }

        // Save to local storage
        const consentState: ConsentState = {
            accepted: true,
            version,
            acceptedAt: new Date().toISOString()
        };
        localStorage.setItem(CONSENT_KEY, JSON.stringify(consentState));

        setHasConsent(true);
        setShowDisclosure(false);
    }, []);

    // Decline consent - logs user out since consent is mandatory
    const declineConsent = useCallback(() => {
        // Clear local consent
        localStorage.removeItem(CONSENT_KEY);
        setHasConsent(false);
        setShowDisclosure(false);

        // Log user out since consent is required
        if (logout) {
            logout();
        }
    }, [logout]);

    // Revoke consent (for settings page)
    const revokeConsent = useCallback(async () => {
        localStorage.removeItem(CONSENT_KEY);
        setHasConsent(false);

        const token = sessionStorage.getItem('auth_token') || localStorage.getItem('google_token');
        if (token) {
            try {
                await fetch(`${API_BASE}/api/user/consent`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        tracking_consent: false,
                        consent_version: activeVersion
                    })
                });
            } catch (error) {
                console.error('Failed to sync consent revocation:', error);
            }
        }
    }, [activeVersion]);

    return {
        hasConsent,
        showDisclosure,
        isLoading,
        activeVersion,
        consentContent,
        acceptConsent,
        declineConsent,
        revokeConsent
    };
}
