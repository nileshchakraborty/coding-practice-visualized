import { statsRepository } from '../src/repositories/StatsRepository';
import { redisService } from '../src/services/RedisService';
import { supabase } from '../src/repositories/SupabaseClient';

/**
 * Smoke Tests for Resilience
 * 
 * Verifies that the system continues to function even when layers are manually "broken".
 * Note: Real breaking requires stopping containers, but we can simulate call failures via mocks or just observing logs if we disconnect.
 * 
 * Since we can't easily stop Redis/DB from this script in a unit test fashion without Docker access, 
 * this script assumes environment might be flaky or allows manual verification.
 * 
 * Ideally, we'd mock the wrappers to throw errors.
 */

async function resilienceTest() {
    console.log('🔥 Starting Resilience Smoke Test...');

    // 1. Initial Load (Happy Path)
    console.log('\n--- Test 1: Happy Path Load ---');
    const start = Date.now();
    const stats = await statsRepository.loadStats();
    console.log(`[PASS] Loaded stats in ${Date.now() - start}ms. Items: ${stats.hotProblems.length}`);

    // 2. Write Operation
    console.log('\n--- Test 2: Write Operation ---');
    const updated = await statsRepository.updateProblemStats([{ slug: 'smoke-test', views: 1, solves: 0 }]);
    const found = updated.hotProblems.find(p => p.slug === 'smoke-test');
    if (found && found.views >= 1) console.log('[PASS] Write successful.');
    else console.error('[FAIL] Write failed.');

    console.log('\n--- Resilience Verification instructions ---');
    console.log('1. Stop Redis (docker stop redis)');
    console.log('2. Run this script again -> Should PASS using File/DB');
    console.log('3. Stop Supabase/Network -> Should PASS using File');
    console.log('4. Check "Hot Right Now" on frontend -> Should always load');

    // Clean up if needed (but we want to persist for manual check)
    // await statsRepository.updateProblemStats([{ slug: 'smoke-test', views: -100, solves: 0 }]);
    console.log('\n✅ Smoke Test Complete. Check logs for any CircuitBreaker errors if services were down.');
}

resilienceTest();
