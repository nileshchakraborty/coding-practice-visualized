
import { Topic, TopicRepository } from '../../../domain/ports/TopicRepository';
import { supabase } from '../../../infrastructure/db/SupabaseClient';

export class SupabaseTopicRepository implements TopicRepository {

    async getAll(): Promise<Topic[]> {
        const { data, error } = await supabase
            .from('topics')
            .select('*')
            .order('name');

        if (error) {
            console.error('Failed to fetch topics:', error);
            throw new Error(error.message);
        }

        return data || [];
    }

    async upsert(topic: Partial<Topic>): Promise<Topic> {
        // If no slug, generate one from name
        if (!topic.slug && topic.name) {
            topic.slug = topic.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        }

        const { data, error } = await supabase
            .from('topics')
            .upsert(topic)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    async normalizeProblems(problemsTable: string = 'problems'): Promise<{ updated: number, errors: any[] }> {
        // 1. Fetch all topics
        const topics = await this.getAll();

        // 2. Fetch all problems
        // Note: For large datasets, this should be generic batched. 
        // For 250 problems, fetching all is fine.
        const { data: problems, error } = await supabase
            .from(problemsTable)
            .select('slug, category, title');

        if (error) throw error;

        let updatedCount = 0;
        const errors = [];

        // 3. Check each problem
        for (const problem of problems) {
            const currentCat = problem.category || 'General';

            // Find matching topic
            // Match by Name OR Alias (case insensitive)
            const match = topics.find(t =>
                t.name.toLowerCase() === currentCat.toLowerCase() ||
                (t.aliases && t.aliases.some(a => a.toLowerCase() === currentCat.toLowerCase()))
            );

            if (match && match.name !== currentCat) {
                // Update required
                console.log(`Normalizing "${problem.title}": ${currentCat} -> ${match.name}`);

                const { error: updateError } = await supabase
                    .from(problemsTable)
                    .update({ category: match.name })
                    .eq('slug', problem.slug);

                if (updateError) {
                    errors.push({ slug: problem.slug, error: updateError.message });
                } else {
                    updatedCount++;
                }
            }
        }

        return { updated: updatedCount, errors };
    }
}

export const topicRepository = new SupabaseTopicRepository();
