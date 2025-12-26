import React, { useEffect, useRef, useState } from 'react';
import { useActivityTracking } from '../hooks/useActivityTracking';

interface YouTubePlayerProps {
    videoId: string;
}

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: {
            Player: new (element: HTMLElement | string, options: YouTubePlayerOptions) => YouTubePlayerInstance;
        };
    }
}

interface YouTubePlayerInstance {
    getCurrentTime(): number;
    getDuration(): number;
    destroy(): void;
}

interface YouTubePlayerOptions {
    height: string | number;
    width: string | number;
    videoId: string;
    playerVars?: Record<string, unknown>;
    events?: {
        onReady?: () => void;
        onStateChange?: (event: { data: number }) => void;
    };
}

/**
 * YouTubePlayer - Controlled YouTube player with progress syncing
 * Uses YouTube IFrame Player API to track position and sync with MongoDB/LocalStorage
 */
export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId }) => {
    const playerRef = useRef<YouTubePlayerInstance | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { syncYoutubePosition, getYoutubePosition, logEvent } = useActivityTracking();
    const [isApiReady, setIsApiReady] = useState(() => typeof window !== 'undefined' && !!(window.YT && window.YT.Player));
    const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Initial API load
    useEffect(() => {
        if (isApiReady) return;

        // Check if already available
        if (typeof window !== 'undefined' && window.YT && window.YT.Player) {
            setTimeout(() => setIsApiReady(true), 0);
            return;
        }

        // Check if script already injected
        if (!document.getElementById('youtube-iframe-api')) {
            const tag = document.createElement('script');
            tag.id = 'youtube-iframe-api';
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            if (firstScriptTag?.parentNode) {
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            } else {
                document.head.appendChild(tag);
            }
        }

        const checkAPIReady = setInterval(() => {
            if (window.YT && window.YT.Player) {
                setIsApiReady(true);
                clearInterval(checkAPIReady);
            }
        }, 100);

        return () => clearInterval(checkAPIReady);
    }, [isApiReady]);

    // Player Initialization & Sync
    useEffect(() => {
        if (!isApiReady || !videoId || !containerRef.current) return;

        let player: YouTubePlayerInstance | null = null;

        const syncPosition = () => {
            if (player && player.getCurrentTime) {
                const pos = player.getCurrentTime();
                const duration = player.getDuration();
                if (pos > 0) {
                    syncYoutubePosition(videoId, pos, duration);
                    // Also save to localStorage for immediate offline persistence
                    localStorage.setItem(`yt_pos_${videoId}`, JSON.stringify({ pos, at: Date.now() }));
                }
            }
        };

        const startSyncing = () => {
            if (syncIntervalRef.current) return;
            syncIntervalRef.current = setInterval(syncPosition, 10000); // 10s intervals
        };

        const stopSyncing = () => {
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
                syncIntervalRef.current = null;
            }
        };

        const initPlayer = async () => {
            // 1. Get initial position from MongoDB
            let startPosition = await getYoutubePosition(videoId);

            // 2. Check LocalStorage fallback (use whichever is newer)
            const local = localStorage.getItem(`yt_pos_${videoId}`);
            if (local) {
                try {
                    const { pos } = JSON.parse(local);
                    // Use local if it exists and we couldn't get from server or just stick with server for source of truth
                    if (startPosition === 0) startPosition = pos;
                } catch { /* ignore */ }
            }

            player = new window.YT.Player(containerRef.current as HTMLDivElement, {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    start: Math.max(0, Math.floor(startPosition) - 2), // 2s buffer back
                    modestbranding: 1,
                    rel: 0,
                    origin: window.location.origin
                },
                events: {
                    onReady: () => {
                        playerRef.current = player;
                    },
                    onStateChange: (event: { data: number }) => {
                        // YT.PlayerState.PLAYING = 1
                        // YT.PlayerState.PAUSED = 2
                        // YT.PlayerState.ENDED = 0
                        if (player) {
                            if (event.data === 1) {
                                logEvent('video_play', { videoId, position: player.getCurrentTime() });
                                startSyncing();
                            } else if (event.data === 2) {
                                logEvent('video_pause', { videoId, position: player.getCurrentTime() });
                                stopSyncing();
                                syncPosition();
                            } else if (event.data === 0) {
                                logEvent('video_complete', { videoId });
                                stopSyncing();
                                syncPosition();
                                localStorage.removeItem(`yt_pos_${videoId}`);
                            }
                        }
                    }
                }
            });
        };

        initPlayer();

        return () => {
            stopSyncing();
            syncPosition();
            if (player) {
                try {
                    player.destroy();
                } catch { /* ignore */ }
            }
        };
    }, [isApiReady, videoId, getYoutubePosition, syncYoutubePosition, logEvent]);

    return (
        <div className="w-full h-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
            {!isApiReady ? (
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-500">Loading Player...</span>
                </div>
            ) : (
                <div ref={containerRef} className="w-full h-full" />
            )}
        </div>
    );
};
