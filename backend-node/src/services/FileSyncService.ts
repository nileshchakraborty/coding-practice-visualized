import fs from 'fs';
import path from 'path';
import { supabase } from '../repositories/SupabaseClient';

/**
 * FileSyncService
 * 
 * Handles synchronization between Database (Supabase) and Local File System.
 * Ensures that we have a local JSON backup of critical data.
 */
class FileSyncService {
    async syncStatsToFile(statsData: any): Promise<void> {
        try {
            const filePath = path.resolve(__dirname, '../../../data/stats.json');
            // Ensure directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            fs.writeFileSync(filePath, JSON.stringify(statsData, null, 4));
            // console.log('Synced stats to local file');
        } catch (error) {
            console.error('Failed to sync stats to file:', error);
        }
    }

    async syncProblemsToFile(problems: any[]): Promise<void> {
        // Placeholder for problems sync logic
        try {
            const filePath = path.resolve(__dirname, '../../../data/problems.json');
            fs.writeFileSync(filePath, JSON.stringify(problems, null, 4));
        } catch (error) {
            console.error('Failed to sync problems to file:', error);
        }
    }
}

export const fileSyncService = new FileSyncService();
