/**
 * MongoDBService - Connection pooling and collection access for MongoDB
 * Used for: activity_events, user_progress, problem_history, youtube_sessions, analytics_aggregates
 */
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ActivityEvent {
    _id?: ObjectId;
    user_id: string;
    session_id: string;
    ip_hash: string;
    event_type:
    | 'page_view' | 'problem_open' | 'problem_solve'
    | 'code_run' | 'code_submit'
    | 'hint_view' | 'solution_view'
    | 'video_start' | 'video_progress' | 'video_complete'
    | 'tab_switch' | 'login' | 'logout'
    | 'app_search' | 'filter_change' | 'view_tab' | 'practice_run';
    problem_slug?: string;
    metadata: {
        language?: string;
        code_length?: number;
        run_success?: boolean;
        watch_seconds?: number;
        video_id?: string;
        from_tab?: string;
        to_tab?: string;
        [key: string]: unknown;
    };
    geo_city: string;
    geo_country: string;
    created_at: Date;
    expires_at: Date;
}

export interface UserProgress {
    _id?: ObjectId;
    user_id: string;
    problem_slug: string;
    status: 'started' | 'attempted' | 'solved';
    practice_count: number;
    compile_count: number;
    solve_attempts: number;
    total_time_spent: number;
    last_session_time: number;
    drafts: {
        python?: string;
        javascript?: string;
        typescript?: string;
        java?: string;
        go?: string;
        rust?: string;
        cpp?: string;
    };
    started_at: Date;
    solved_at?: Date;
    last_activity: Date;
    version: number;
}

export interface ProblemData {
    title: string;
    slug?: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    pattern: string;
    patternEmoji: string;
    tags?: string[];
    description: string;
    problemStatement: string;
    examples: Array<{ input: string; output: string; explanation?: string }>;
    constraints: string[];
    hints?: string[];
    relatedProblems?: string[];
    oneliner: string;
    intuition: string[];
    keyInsight: string;
    approach: string;
    walkthrough?: string[];
    code: string;
    initialCode?: string;
    implementations?: {
        [language: string]: {
            code: string;
            initialCode?: string;
        };
    };
    timeComplexity: string;
    spaceComplexity: string;
    bruteForceTimeComplexity?: string;
    bruteForceSpaceComplexity?: string;
    bruteForceIntuition?: string[];
    visualizationType?: 'array' | 'matrix' | 'tree' | 'graph' | 'linked-list';
    initialState?: unknown;
    animationSteps?: Array<{
        step: number;
        visual: string;
        transientMessage: string;
        arrayState?: unknown;
        pointers?: Array<{ label: string; index: number }>;
        indices?: number[];
        color?: 'accent' | 'success' | 'warning' | 'error';
    }>;
    videoId?: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
}

export interface ProblemHistoryChange {
    field: string;
    old_value: string | null;
    new_value: string | null;
}

export interface ProblemHistory {
    _id?: ObjectId;
    problem_slug: string;
    action: 'create' | 'update' | 'delete' | 'restore';
    previous_data: ProblemData | null;
    current_data: ProblemData | null;
    changes: ProblemHistoryChange[];
    changed_by: string;
    created_at: Date;
    is_rollback: boolean;
    rollback_from?: ObjectId;
}

export interface YouTubeSession {
    _id?: ObjectId;
    user_id: string;
    problem_slug: string;
    video_id: string;
    current_time: number;
    duration: number;
    total_watch_time: number;
    play_count: number;
    completed: boolean;
    last_played_at: Date;
    created_at: Date;
}

export interface AnalyticsAggregate {
    _id?: ObjectId;
    type: 'daily' | 'weekly' | 'monthly' | 'problem' | 'geo';
    key: string;
    metrics: {
        total_users?: number;
        active_users?: number;
        new_users?: number;
        problems_solved?: number;
        total_compiles?: number;
        avg_time_per_problem?: number;
        top_problems?: Array<{ slug: string; count: number }>;
        [key: string]: unknown;
    };
    period_start?: Date;
    period_end?: Date;
    computed_at: Date;
}

// ============================================
// MONGODB SERVICE
// ============================================

class MongoDBService {
    private client: MongoClient | null = null;
    private db: Db | null = null;
    private connecting: Promise<void> | null = null;
    private readonly uri: string;
    private readonly dbName: string;

    constructor() {
        this.uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
        this.dbName = process.env.MONGODB_DB_NAME || 'codenium';
    }

    /**
     * Connect to MongoDB with connection pooling
     */
    async connect(): Promise<void> {
        if (this.db) return;

        if (this.connecting) {
            await this.connecting;
            return;
        }

        this.connecting = (async () => {
            try {
                console.log('[MongoDB] Connecting to database...');
                this.client = new MongoClient(this.uri, {
                    maxPoolSize: 10,
                    minPoolSize: 2,
                    maxIdleTimeMS: 30000,
                    serverSelectionTimeoutMS: 5000,
                });

                await this.client.connect();
                this.db = this.client.db(this.dbName);

                // Create indexes
                await this.ensureIndexes();

                console.log('[MongoDB] Connected successfully');
            } catch (error) {
                console.error('[MongoDB] Connection failed:', error);
                this.client = null;
                this.db = null;
                throw error;
            } finally {
                this.connecting = null;
            }
        })();

        await this.connecting;
    }

    /**
     * Ensure all required indexes exist
     */
    private async ensureIndexes(): Promise<void> {
        if (!this.db) return;

        // Activity events indexes
        const activityEvents = this.db.collection('activity_events');
        await activityEvents.createIndex({ user_id: 1, created_at: -1 });
        await activityEvents.createIndex({ event_type: 1, created_at: -1 });
        await activityEvents.createIndex({ problem_slug: 1 }, { sparse: true });
        await activityEvents.createIndex({ created_at: 1 }, { expireAfterSeconds: 31536000 }); // 1 year TTL

        // User progress indexes
        const userProgress = this.db.collection('user_progress');
        await userProgress.createIndex({ user_id: 1, problem_slug: 1 }, { unique: true });
        await userProgress.createIndex({ user_id: 1, status: 1 });

        // Problem history indexes
        const problemHistory = this.db.collection('problem_history');
        await problemHistory.createIndex({ problem_slug: 1, created_at: -1 });
        await problemHistory.createIndex({ changed_by: 1 });

        // YouTube sessions indexes
        const youtubeSessions = this.db.collection('youtube_sessions');
        await youtubeSessions.createIndex({ user_id: 1, video_id: 1 }, { unique: true });

        // Analytics aggregates indexes
        const analyticsAggregates = this.db.collection('analytics_aggregates');
        await analyticsAggregates.createIndex({ type: 1, key: 1 }, { unique: true });

        console.log('[MongoDB] Indexes ensured');
    }

    /**
     * Get database instance (connects if needed)
     */
    async getDb(): Promise<Db> {
        if (!this.db) {
            await this.connect();
        }
        if (!this.db) {
            throw new Error('MongoDB connection not available');
        }
        return this.db;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.db !== null;
    }

    // ============================================
    // COLLECTION ACCESSORS
    // ============================================

    async activityEvents(): Promise<Collection<ActivityEvent>> {
        const db = await this.getDb();
        return db.collection<ActivityEvent>('activity_events');
    }

    async userProgress(): Promise<Collection<UserProgress>> {
        const db = await this.getDb();
        return db.collection<UserProgress>('user_progress');
    }

    async problemHistory(): Promise<Collection<ProblemHistory>> {
        const db = await this.getDb();
        return db.collection<ProblemHistory>('problem_history');
    }

    async youtubeSessions(): Promise<Collection<YouTubeSession>> {
        const db = await this.getDb();
        return db.collection<YouTubeSession>('youtube_sessions');
    }

    async analyticsAggregates(): Promise<Collection<AnalyticsAggregate>> {
        const db = await this.getDb();
        return db.collection<AnalyticsAggregate>('analytics_aggregates');
    }

    // ============================================
    // CONVENIENCE METHODS
    // ============================================

    /**
     * Log an activity event
     */
    async logEvent(event: Omit<ActivityEvent, '_id' | 'created_at' | 'expires_at'>): Promise<void> {
        const collection = await this.activityEvents();
        const now = new Date();
        const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

        await collection.insertOne({
            ...event,
            created_at: now,
            expires_at: oneYearFromNow,
        });
    }

    /**
     * Get or create user progress for a problem
     */
    async getOrCreateProgress(userId: string, problemSlug: string): Promise<UserProgress> {
        const collection = await this.userProgress();

        const existing = await collection.findOne({ user_id: userId, problem_slug: problemSlug });
        if (existing) return existing;

        const newProgress: UserProgress = {
            user_id: userId,
            problem_slug: problemSlug,
            status: 'started',
            practice_count: 1,
            compile_count: 0,
            solve_attempts: 0,
            total_time_spent: 0,
            last_session_time: 0,
            drafts: {},
            started_at: new Date(),
            last_activity: new Date(),
            version: 1,
        };

        await collection.insertOne(newProgress);
        return newProgress;
    }

    /**
     * Increment progress counters
     */
    async incrementProgress(
        userId: string,
        problemSlug: string,
        field: 'practice_count' | 'compile_count' | 'solve_attempts'
    ): Promise<void> {
        const collection = await this.userProgress();
        await collection.updateOne(
            { user_id: userId, problem_slug: problemSlug },
            {
                $inc: { [field]: 1 },
                $set: { last_activity: new Date() },
            },
            { upsert: true }
        );
    }

    /**
     * Log problem history entry
     */
    async logProblemHistory(entry: Omit<ProblemHistory, '_id' | 'created_at'>): Promise<ObjectId> {
        const collection = await this.problemHistory();
        const result = await collection.insertOne({
            ...entry,
            created_at: new Date(),
        });
        return result.insertedId;
    }

    /**
     * Sync YouTube video position
     */
    async syncYoutubeSession(
        userId: string,
        videoId: string,
        position: number,
        duration: number
    ): Promise<void> {
        const collection = await this.youtubeSessions();
        const now = new Date();

        await collection.updateOne(
            { user_id: userId, video_id: videoId },
            {
                $set: {
                    current_time: position,
                    duration: duration,
                    last_played_at: now,
                    completed: position >= duration * 0.95 // Mark as completed if > 95% watched
                },
                $inc: { total_watch_time: 10 }, // Assuming 10s sync intervals
                $setOnInsert: { created_at: now, play_count: 1 }
            },
            { upsert: true }
        );
    }

    /**
     * Get YouTube session for continuity
     */
    async getYoutubeSession(userId: string, videoId: string): Promise<{ last_position: number } | null> {
        const collection = await this.youtubeSessions();
        const session = await collection.findOne({ user_id: userId, video_id: videoId });
        if (!session) return null;
        return { last_position: session.current_time };
    }

    /**
     * Disconnect from MongoDB
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
            console.log('[MongoDB] Disconnected');
        }
    }
}

// Export singleton instance
export const mongoDBService = new MongoDBService();
export default mongoDBService;
