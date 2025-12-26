/**
 * ProblemHistoryService - Tracks all problem CRUD operations with rollback support
 * 
 * Features:
 * - Logs every create/update/delete to MongoDB
 * - Maintains local solutions.json as source of truth
 * - Provides diff generation for UI display
 * - Supports one-click rollback to any previous state
 */
import { ObjectId } from 'mongodb';
import mongoDBService, {
    ProblemData,
    ProblemHistory,
    ProblemHistoryChange
} from '../database/MongoDBService';
import localFileSyncService from './LocalFileSyncService';

// ============================================
// DIFF UTILITIES
// ============================================

/**
 * Generate human-readable changes between two problem states
 */
function generateChanges(
    previous: ProblemData | null,
    current: ProblemData | null
): ProblemHistoryChange[] {
    const changes: ProblemHistoryChange[] = [];

    if (!previous && current) {
        // Create - show key fields
        changes.push({ field: 'title', old_value: null, new_value: current.title });
        changes.push({ field: 'difficulty', old_value: null, new_value: current.difficulty });
        changes.push({ field: 'pattern', old_value: null, new_value: current.pattern });
        return changes;
    }

    if (previous && !current) {
        // Delete - show what was removed
        changes.push({ field: 'title', old_value: previous.title, new_value: null });
        changes.push({ field: 'difficulty', old_value: previous.difficulty, new_value: null });
        return changes;
    }

    if (!previous || !current) return changes;

    // Update - compare fields
    const fieldsToCompare: (keyof ProblemData)[] = [
        'title', 'difficulty', 'pattern', 'description', 'problemStatement',
        'code', 'initialCode', 'timeComplexity', 'spaceComplexity',
        'oneliner', 'keyInsight', 'videoId'
    ];

    for (const field of fieldsToCompare) {
        const oldVal = previous[field];
        const newVal = current[field];

        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes.push({
                field,
                old_value: oldVal != null ? String(oldVal).substring(0, 200) : null,
                new_value: newVal != null ? String(newVal).substring(0, 200) : null,
            });
        }
    }

    // Check array fields
    const arrayFields: (keyof ProblemData)[] = ['hints', 'constraints', 'intuition', 'relatedProblems'];
    for (const field of arrayFields) {
        const oldArr = previous[field] as string[] | undefined;
        const newArr = current[field] as string[] | undefined;

        if (JSON.stringify(oldArr) !== JSON.stringify(newArr)) {
            changes.push({
                field,
                old_value: oldArr ? `[${oldArr.length} items]` : null,
                new_value: newArr ? `[${newArr.length} items]` : null,
            });
        }
    }

    return changes;
}

// ============================================
// PROBLEM HISTORY SERVICE
// ============================================

class ProblemHistoryService {
    /**
     * Log a problem creation
     */
    async logCreate(slug: string, problem: ProblemData, changedBy: string): Promise<ObjectId> {
        // Update local file first (source of truth)
        localFileSyncService.upsertProblem(slug, problem);

        // Log to MongoDB
        const historyId = await mongoDBService.logProblemHistory({
            problem_slug: slug,
            action: 'create',
            previous_data: null,
            current_data: problem,
            changes: generateChanges(null, problem),
            changed_by: changedBy,
            is_rollback: false,
        });

        console.log(`[ProblemHistory] Created: ${slug} by ${changedBy}`);
        return historyId;
    }

    /**
     * Log a problem update
     */
    async logUpdate(
        slug: string,
        previousData: ProblemData,
        newData: ProblemData,
        changedBy: string
    ): Promise<ObjectId> {
        // Update local file first
        localFileSyncService.upsertProblem(slug, newData);

        // Log to MongoDB
        const historyId = await mongoDBService.logProblemHistory({
            problem_slug: slug,
            action: 'update',
            previous_data: previousData,
            current_data: newData,
            changes: generateChanges(previousData, newData),
            changed_by: changedBy,
            is_rollback: false,
        });

        console.log(`[ProblemHistory] Updated: ${slug} by ${changedBy}`);
        return historyId;
    }

    /**
     * Log a problem deletion (soft delete - keeps history)
     */
    async logDelete(slug: string, previousData: ProblemData, changedBy: string): Promise<ObjectId> {
        // Remove from local file
        localFileSyncService.deleteProblem(slug);

        // Log to MongoDB
        const historyId = await mongoDBService.logProblemHistory({
            problem_slug: slug,
            action: 'delete',
            previous_data: previousData,
            current_data: null,
            changes: generateChanges(previousData, null),
            changed_by: changedBy,
            is_rollback: false,
        });

        console.log(`[ProblemHistory] Deleted: ${slug} by ${changedBy}`);
        return historyId;
    }

    /**
     * Get history for a specific problem
     */
    async getHistoryForProblem(slug: string, limit = 50): Promise<ProblemHistory[]> {
        const collection = await mongoDBService.problemHistory();
        return collection
            .find({ problem_slug: slug })
            .sort({ created_at: -1 })
            .limit(limit)
            .toArray();
    }

    /**
     * Get all history entries (for admin dashboard)
     */
    async getAllHistory(limit = 100, skip = 0): Promise<{ entries: ProblemHistory[]; total: number }> {
        const collection = await mongoDBService.problemHistory();

        const [entries, total] = await Promise.all([
            collection
                .find({})
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            collection.countDocuments()
        ]);

        return { entries, total };
    }

    /**
     * Get a specific history entry by ID
     */
    async getHistoryEntry(historyId: string): Promise<ProblemHistory | null> {
        const collection = await mongoDBService.problemHistory();
        return collection.findOne({ _id: new ObjectId(historyId) });
    }

    /**
     * Rollback to a previous state
     * Returns the new history entry ID
     */
    async rollback(historyId: string, changedBy: string): Promise<ObjectId> {
        const collection = await mongoDBService.problemHistory();
        const historyEntry = await collection.findOne({ _id: new ObjectId(historyId) });

        if (!historyEntry) {
            throw new Error('History entry not found');
        }

        const slug = historyEntry.problem_slug;

        // Determine what to restore based on action type
        let dataToRestore: ProblemData | null = null;

        if (historyEntry.action === 'delete') {
            // Restoring a deleted problem - use previous_data
            dataToRestore = historyEntry.previous_data;
        } else if (historyEntry.action === 'update') {
            // Rolling back an update - use previous_data
            dataToRestore = historyEntry.previous_data;
        } else if (historyEntry.action === 'create') {
            // Rolling back a create - delete the problem
            dataToRestore = null;
        }

        // Get current state before rollback
        const currentData = localFileSyncService.getProblem(slug);

        // Perform the rollback
        if (dataToRestore) {
            localFileSyncService.upsertProblem(slug, dataToRestore);
        } else {
            localFileSyncService.deleteProblem(slug);
        }

        // Log the rollback as a new history entry
        const rollbackHistoryId = await mongoDBService.logProblemHistory({
            problem_slug: slug,
            action: 'restore',
            previous_data: currentData,
            current_data: dataToRestore,
            changes: generateChanges(currentData, dataToRestore),
            changed_by: changedBy,
            is_rollback: true,
            rollback_from: new ObjectId(historyId),
        });

        console.log(`[ProblemHistory] Rollback: ${slug} to entry ${historyId} by ${changedBy}`);
        return rollbackHistoryId;
    }

    /**
     * Get summary statistics
     */
    async getStats(): Promise<{
        totalEntries: number;
        creates: number;
        updates: number;
        deletes: number;
        rollbacks: number;
        recentActivity: ProblemHistory[];
    }> {
        const collection = await mongoDBService.problemHistory();

        const [totalEntries, creates, updates, deletes, rollbacks, recentActivity] = await Promise.all([
            collection.countDocuments(),
            collection.countDocuments({ action: 'create' }),
            collection.countDocuments({ action: 'update' }),
            collection.countDocuments({ action: 'delete' }),
            collection.countDocuments({ is_rollback: true }),
            collection.find({}).sort({ created_at: -1 }).limit(10).toArray(),
        ]);

        return { totalEntries, creates, updates, deletes, rollbacks, recentActivity };
    }
}

// Export singleton
export const problemHistoryService = new ProblemHistoryService();
export default problemHistoryService;
