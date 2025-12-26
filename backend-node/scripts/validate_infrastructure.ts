
import { redisService } from '../src/services/RedisService';
import { supabase } from '../src/repositories/SupabaseClient';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

async function validateInfrastructure() {
    console.log('🔍 Validating Infrastructure...');
    console.log(`📂 Loaded .env from: ${envPath}`);

    let allPassed = true;

    // 1. Validate Redis
    try {
        console.log('Testing Redis (L2 Cache)...');
        // Simple write/read test
        const testKey = 'infra_test_key';
        await redisService.set(testKey, { status: 'ok' }, 10);
        const result = await redisService.get<{ status: string }>(testKey);

        if (result && result.status === 'ok') {
            console.log('✅ Redis is Connected and Writable');
        } else {
            console.error('❌ Redis Read/Write Failed');
            allPassed = false;
        }
    } catch (e) {
        console.error('❌ Redis Connection Error:', e);
        allPassed = false;
    }

    // 2. Validate Supabase
    try {
        console.log('Testing Supabase (L4 Storage)...');
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

        if (!url || !key) {
            console.error('❌ Supabase Credentials Missing in .env');
            allPassed = false;
        } else {
            // Test connection by fetching a simple query (e.g. count of problems)
            const { count, error } = await supabase
                .from('problems')
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.error('❌ Supabase Connection Failed:', error.message);
                allPassed = false;
            } else {
                console.log(`✅ Supabase Connected. Problem Count: ${count}`);
            }
        }
    } catch (e) {
        console.error('❌ Supabase Error:', e);
        allPassed = false;
    }

    if (allPassed) {
        console.log('🚀 Infrastructure Validation Passed!');
        process.exit(0);
    } else {
        console.error('🛑 Infrastructure Validation Failed');
        process.exit(1);
    }
}

validateInfrastructure();
