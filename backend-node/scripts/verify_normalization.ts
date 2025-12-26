
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyNormalization() {
    console.log('🔍 Verifying Normalization...');

    // Check for "1D DP" usage (Correct)
    const { count: countCorrect, error: err1 } = await supabase
        .from('problems')
        .select('*', { count: 'exact', head: true })
        .eq('category', '1D DP');

    // Check for "1D Dynamic Programming" usage (Incorrect)
    const { count: countIncorrect, error: err2 } = await supabase
        .from('problems')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'Dynamic Programming'); // Original alias

    console.log(`✅ '1D DP' count: ${countCorrect}`);
    console.log(`❌ 'Dynamic Programming' count: ${countIncorrect} (Should be 0 if fully normalized)`);

    // Check one sample problem
    const { data } = await supabase
        .from('problems')
        .select('slug, category')
        .eq('category', '1D DP')
        .limit(1);

    if (data && data.length > 0) {
        console.log(`Sample normalized problem: ${data[0].slug} -> ${data[0].category}`);
    }
}

verifyNormalization();
