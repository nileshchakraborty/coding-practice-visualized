/**
 * RecommendationService - Frontend service for hot topics/problems
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface HotProblem {
    slug: string;
    score: number;
    views: number;
    solves: number;
}

export interface HotTopic {
    category: string;
    engagement: number;
    problemCount: number;
}

export interface Recommendations {
    hotProblems: HotProblem[];
    hotTopics: HotTopic[];
    stats: { problems: number; categories: number };
}

class RecommendationServiceImpl {
    async getRecommendations(k: number = 10, topicK: number = 5): Promise<Recommendations> {
        try {
            const response = await fetch(
                `${API_BASE}/api/recommendations?k=${k}&topicK=${topicK}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch recommendations');
            }

            return await response.json();
        } catch (error) {
            console.error('Recommendations fetch error:', error);
            // Return empty data on error
            return {
                hotProblems: [],
                hotTopics: [],
                stats: { problems: 0, categories: 0 },
            };
        }
    }

    async updateStats(updates: { slug: string; views?: number; solves?: number }[]): Promise<Recommendations> {
        try {
            const response = await fetch(`${API_BASE}/api/stats/interaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates }),
            });

            if (!response.ok) throw new Error('Failed to update stats');

            return await response.json();
        } catch (error) {
            console.error('Stats update error:', error);
            // Return minimal / empty object to prevent crash, though usually we rely on current state if fail
            return {
                hotProblems: [],
                hotTopics: [],
                stats: { problems: 0, categories: 0 },
            };
        }
    }
}

export const RecommendationService = new RecommendationServiceImpl();
