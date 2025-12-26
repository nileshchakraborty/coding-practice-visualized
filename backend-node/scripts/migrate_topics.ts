
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateTopics() {
    console.log('🌱 Starting Topics Migration...');

    // 1. Create Table (using SQL execution via rpc if available, or just create it if we can't... 
    // actually standard supabase-js doesn't support generic SQL execution without a function. 
    // We'll assume the user might need to run SQL manually OR we can try to use the REST API if we had admin rights, 
    // but typically we just upsert. However, to create a table we need SQL.
    // For this context, we'll try to insert into 'topics'. If it fails, we know we need to create it.
    // Since I cannot run DDL from here easily without a pre-existing RPC, I will print the SQL 
    // and attempt to seed assuming the table exists (or I'll use the 'postgres' connection if I had one, but I only have supabase-js).
    // WAIT: I can just assume the table needs to be created, but I can't create it via the JS client dynamically unless I have an RPC.

    // Correction: In this environment, I can't easily run DDL. 
    // However, I can try to use the `pg` driver if I had the connection string, but I only have the URL/Key.
    // I will output the SQL required and ask the user to run it OR I will try to use a Supabase RPC if one existed.
    // BUT looking at previous context, `seed_supabase.ts` just upserted into `problems`. 
    // Validating `validate_infrastructure.ts` checked `problems` table.
    // I will try to upsert into `topics`. If it fails saying relation doesn't exist, I'll notify the user.
    // Actually, I can try to use the Supabase "SQL Editor" via Browser? No, that's too complex.

    // Let's assume the table MIGHT not exist. The best I can do is:
    // 1. Log the SQL needed.
    // 2. Try to insert.

    const SQL = `
    CREATE TABLE IF NOT EXISTS topics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        aliases TEXT[] DEFAULT '{}',
        icon TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    `;

    console.log('⚠️ NOTE: Ensure the following SQL is run in your Supabase SQL Editor if the table does not exist:');
    console.log(SQL);
    console.log('----------------------------------------------------------------');

    // Initial Data
    const INITIAL_TOPICS = [
        { name: 'Array / String', slug: 'array-string', icon: '📝', aliases: ['Array', 'String', 'Arrays & Strings'] },
        { name: 'Two Pointers', slug: 'two-pointers', icon: '👆', aliases: ['Two Pointer'] },
        { name: 'Sliding Window', slug: 'sliding-window', icon: '🪟', aliases: [] },
        { name: 'Matrix', slug: 'matrix', icon: '🔢', aliases: ['2D Array'] },
        { name: 'Hashmap', slug: 'hashmap', icon: '🗂️', aliases: ['Hash Table', 'Dictionary'] },
        { name: 'Intervals', slug: 'intervals', icon: '⏰', aliases: [] },
        { name: 'Stack', slug: 'stack', icon: '📚', aliases: [] },
        { name: 'Linked List', slug: 'linked-list', icon: '🔗', aliases: ['List'] },
        { name: 'Binary Tree General', slug: 'binary-tree-general', icon: '🌳', aliases: ['Binary Tree'] },
        { name: 'Binary Tree BFS', slug: 'binary-tree-bfs', icon: '🌊', aliases: ['BFS'] },
        { name: 'Binary Search Tree', slug: 'binary-search-tree', icon: '🔍', aliases: ['BST'] },
        { name: 'Graph General', slug: 'graph-general', icon: '🕸️', aliases: ['Graph'] },
        { name: 'Graph BFS', slug: 'graph-bfs', icon: '📡', aliases: [] },
        { name: 'Trie', slug: 'trie', icon: '🌲', aliases: ['Prefix Tree'] },
        { name: 'Backtracking', slug: 'backtracking', icon: '🔙', aliases: [] },
        { name: 'Divide & Conquer', slug: 'divide-conquer', icon: '➗', aliases: [] },
        { name: 'Kadane\'s Algorithm', slug: 'kadanes-algorithm', icon: '📈', aliases: ['Kadane'] },
        { name: 'Binary Search', slug: 'binary-search', icon: '🔎', aliases: [] },
        { name: 'Heap / Priority Queue', slug: 'heap-priority-queue', icon: '🏔️', aliases: ['Heap', 'Priority Queue'] },
        { name: 'Bit Manipulation', slug: 'bit-manipulation', icon: '0️⃣', aliases: ['Bits'] },
        { name: 'Math', slug: 'math', icon: '🧮', aliases: [] },
        { name: '1D DP', slug: '1d-dp', icon: '📝', aliases: ['1D Dynamic Programming', 'Dynamic Programming'] },
        { name: 'Multidimensional DP', slug: 'multidimensional-dp', icon: '📊', aliases: ['2D DP', 'Matrix DP'] }
    ];

    console.log(`Processing ${INITIAL_TOPICS.length} topics...`);

    for (const topic of INITIAL_TOPICS) {
        const { error } = await supabase.from('topics').upsert(topic, { onConflict: 'slug' });

        if (error) {
            console.error(`❌ Failed to insert topic ${topic.name}:`, error.message);
            // If error is "relation \"topics\" does not exist", we know ddl is needed.
            if (error.message.includes('relation "topics" does not exist')) {
                console.error('🛑 CRITICAL: Table "topics" does not exist. Please run the SQL above.');
                process.exit(1);
            }
        } else {
            console.log(`✅ Upserted ${topic.name}`);
        }
    }

    console.log('✨ Topics migration complete.');
}

migrateTopics();
