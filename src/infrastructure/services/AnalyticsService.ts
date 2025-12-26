import { Collection } from 'mongodb';
import { mongoDBService, ActivityEvent, UserProgress, YouTubeSession } from '../database/MongoDBService';

export interface DashboardMetrics {
    totalUsers: number;
    activeUsersToday: number;
    problemsSolved: number;
    totalCompiles: number;
    avgWatchTime: number;
}

export interface DailyActivity {
    date: string;
    views: number;
    solves: number;
    compiles: number;
}

export interface GeoDistribution {
    country: string;
    city: string;
    count: number;
}

export interface TopProblem {
    slug: string;
    views: number;
    solves: number;
    avgTime?: number;
}

export class AnalyticsService {
    /**
     * Get high-level dashboard metrics
     */
    async getOverviewMetrics(): Promise<DashboardMetrics> {
        const events = await mongoDBService.activityEvents();
        const progress = await mongoDBService.userProgress();
        const ytSessions = await mongoDBService.youtubeSessions();

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [
            totalUsers,
            activeUsersToday,
            problemsSolved,
            totalCompiles,
            avgWatchTimeResult
        ] = await Promise.all([
            // Total unique users (approximate from events or progress)
            progress.distinct('user_id').then(users => users.length),

            // Active users today
            events.distinct('user_id', { created_at: { $gte: todayStart } }).then(users => users.length),

            // Problems solved
            progress.countDocuments({ status: 'solved' }),

            // Total compiles
            progress.aggregate([
                { $group: { _id: null, total: { $sum: '$compile_count' } } }
            ]).toArray().then(res => res[0]?.total || 0),

            // Average watch time
            ytSessions.aggregate([
                { $group: { _id: null, avg: { $avg: '$total_watch_time' } } }
            ]).toArray().then(res => res[0]?.avg || 0)
        ]);

        return {
            totalUsers,
            activeUsersToday,
            problemsSolved,
            totalCompiles,
            avgWatchTime: Math.round(avgWatchTimeResult)
        };
    }

    /**
     * Get daily activity for the last 30 days
     */
    async getDailyActivity(days: number = 30): Promise<DailyActivity[]> {
        const events = await mongoDBService.activityEvents();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        const activity = await events.aggregate([
            { $match: { created_at: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
                    views: { $sum: { $cond: [{ $eq: ["$event_type", "view_solution"] }, 1, 0] } },
                    solves: { $sum: { $cond: [{ $eq: ["$event_type", "solve_problem"] }, 1, 0] } },
                    compiles: { $sum: { $cond: [{ $eq: ["$event_type", "practice_run"] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]).toArray();

        return activity.map(item => ({
            date: item._id,
            views: item.views,
            solves: item.solves,
            compiles: item.compiles
        }));
    }

    /**
     * Get top problems by engagement
     */
    async getTopProblems(limit: number = 10): Promise<TopProblem[]> {
        const progress = await mongoDBService.userProgress();

        const top = await progress.aggregate([
            {
                $group: {
                    _id: "$problem_slug",
                    views: { $sum: "$practice_count" },
                    solves: { $sum: { $cond: [{ $eq: ["$status", "solved"] }, 1, 0] } },
                    avgTime: { $avg: "$total_time_spent" }
                }
            },
            { $sort: { views: -1 } },
            { $limit: limit }
        ]).toArray();

        return top.map(item => ({
            slug: item._id,
            views: item.views,
            solves: item.solves,
            avgTime: Math.round(item.avgTime || 0)
        }));
    }

    /**
     * Get geographic distribution of users
     */
    async getGeoDistribution(): Promise<GeoDistribution[]> {
        const events = await mongoDBService.activityEvents();

        const geo = await events.aggregate([
            {
                $group: {
                    _id: { country: "$geo_country", city: "$geo_city" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]).toArray();

        return geo.map(item => ({
            country: item._id.country,
            city: item._id.city,
            count: item.count
        }));
    }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
