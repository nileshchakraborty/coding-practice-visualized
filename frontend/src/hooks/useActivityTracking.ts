import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { useTrackingConsent } from './useTrackingConsent';

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * useActivityTracking - Hook for logging user activities and managing session state
 * Supports:
 * - General event logging (views, clicks, etc)
 * - YouTube playback continuity
 * - Practice/compile counting
 */
export function useActivityTracking() {
    const { isAuthenticated, accessToken } = useAuth();
    const { hasConsent } = useTrackingConsent();

    /**
     * Log a generic event to MongoDB
     */
    const logEvent = useCallback(async (eventType: string, metadata: Record<string, unknown> = {}) => {
        // Only log if user has consented (mandatory for logged in users)
        // Anonymous users are logged if they haven't explicitly declined
        if (hasConsent === false) return;

        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }

            // Fire and forget (don't await unless we need to handle success)
            fetch(`${API_BASE}/api/events/log`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    event_type: eventType,
                    metadata
                })
            }).catch(e => console.warn('Delayed log failure:', e));
        } catch (error) {
            // Silently fail to not disrupt user experience
            console.warn('Failed to initiate log event:', error);
        }
    }, [hasConsent, accessToken]);

    /**
     * Sync YouTube video position to persistence
     */
    const syncYoutubePosition = useCallback(async (videoId: string, position: number, duration: number) => {
        if (!isAuthenticated || !accessToken || hasConsent === false) return;

        try {
            await fetch(`${API_BASE}/api/analytics/youtube/${videoId}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    position,
                    total_duration: duration
                })
            });
        } catch (error) {
            console.warn('Failed to sync youtube position:', error);
        }
    }, [isAuthenticated, accessToken, hasConsent]);

    /**
     * Get last saved position for a YouTube video
     */
    const getYoutubePosition = useCallback(async (videoId: string): Promise<number> => {
        if (!isAuthenticated || !accessToken || hasConsent === false) return 0;

        try {
            const res = await fetch(`${API_BASE}/api/analytics/youtube/${videoId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            if (!res.ok) return 0;
            const data = await res.json();
            return data.position || 0;
        } catch {
            return 0;
        }
    }, [isAuthenticated, accessToken, hasConsent]);

    return {
        logEvent,
        syncYoutubePosition,
        getYoutubePosition
    };
}
