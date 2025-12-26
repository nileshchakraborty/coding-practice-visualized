
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTopics() {
    console.log('🔍 Checking Topics Table...');

    // Check count
    const { count, error } = await supabase.from('topics').select('*', { count: 'exact', head: true });

    if (error) {
        console.error('❌ Error checking topics:', error.message);
        process.exit(1);
    }

    console.log(`✅ Found ${count} topics.`);

    // Check a sample
    const { data } = await supabase.from('topics').select('*').limit(3);
    console.log('Sample data:', data);

    if (count && count > 0) {
        console.log('🚀 Topics validation passed!');
    } else {
        console.error('⚠️ Table exists but is empty?');
    }
}

checkTopics();
