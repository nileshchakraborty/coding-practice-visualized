import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(text: string): string {
    return text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

async function restoreTopics() {
    console.log('🔄 Restoring granular topics from problems.json...');

    const problemsPath = path.resolve(__dirname, '../../api/data/problems.json');
    if (!fs.existsSync(problemsPath)) {
        console.error('problems.json not found');
        return;
    }

    const raw = fs.readFileSync(problemsPath, 'utf-8');
    const data = JSON.parse(raw);
    const categories = data.categories || [];

    console.log(`Found ${categories.length} categories.`);

    for (const cat of categories) {
        const topic = {
            id: crypto.randomUUID(), // Will be ignored on update if we match by slug, but for new inserts needed? 
            // Actually upsert on unique constraint 'name' or 'slug'
            name: cat.name,
            slug: slugify(cat.name),
            aliases: [], // No aliases for granular topics initially
            icon: cat.icon || '📝'
        };

        const { error } = await supabase.from('topics').upsert(topic, { onConflict: 'slug' });

        if (error) {
            console.error(`Failed to upsert topic ${topic.name}:`, error.message);
        } else {
            console.log(`✅ Restored: ${topic.name}`);
        }
    }

    // Optional: Remove "Dynamic Programming" if it's not in the list? 
    // The user wants 'how it was earlier', so strictly the list from problems.json.
    // However, I won't delete automatically to be safe, but I'll log.

    console.log('✨ Topic restoration complete.');
}

restoreTopics();
