import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Use Service Role Key if available (bypasses RLS). 
// Fallback to Anon Key (requires permissive RLS).
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
    console.warn('❌ No valid Supabase key found (checked SERVICE_ROLE, KEY, ANON_KEY). Seeding will likely fail.');
} else {
    // Basic heuristic check
    if (supabaseKey.startsWith('eyJ')) {
        const isServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY && supabaseKey === process.env.SUPABASE_SERVICE_ROLE_KEY;
        console.log(`🔑 Using Key: ${isServiceRole ? 'SERVICE_ROLE (Trusted)' : 'ANON/PUBLIC (Subject to RLS)'}`);
    }
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Seed script to populate Supabase tables from local JSON files.
 * Usage: npx ts-node backend-node/scripts/seed_supabase.ts
 */
async function seed() {
    console.log('🌱 Starting Supabase Seed...');

    // 1. Seed Problems
    try {
        const problemsPath = path.resolve(__dirname, '../../data/problems.json');
        if (fs.existsSync(problemsPath)) {
            const raw = fs.readFileSync(problemsPath, 'utf-8');
            const data = JSON.parse(raw);

            // Fix: problems are nested in categories
            let problems: any[] = [];
            if (data.categories && Array.isArray(data.categories)) {
                problems = data.categories.flatMap((cat: any) => cat.problems);
            } else if (data.problems && Array.isArray(data.problems)) {
                problems = data.problems; // fallback if format changes
            }

            console.log(`Processing ${problems.length} problems...`);

            for (const p of problems) {
                // Map to table structure
                const row = {
                    slug: p.slug,
                    title: p.title,
                    difficulty: p.difficulty,
                    category: p.category || p.subTopic || 'General',
                    data: p // Store full blob
                };

                const { error } = await supabase.from('problems').upsert(row);
                if (error) console.error(`Failed to insert problem ${p.slug}:`, error.message);
            }
            console.log('✅ Problems seeded.');
        } else {
            console.warn('⚠️ problems.json not found at', problemsPath);
        }
    } catch (e) {
        console.error('Problems seed error:', e);
    }

    // 2. Seed Solutions
    try {
        const solutionsPath = path.resolve(__dirname, '../../data/solutions.json');
        if (fs.existsSync(solutionsPath)) {
            const raw = fs.readFileSync(solutionsPath, 'utf-8');
            const data = JSON.parse(raw);

            // Fix: solutions is a map, slug is the key
            const entries = Object.entries(data.solutions || {});

            console.log(`Processing ${entries.length} solutions...`);

            for (const [slug, val] of entries) {
                const s = val as any;
                const row = {
                    slug: slug, // Use key as slug
                    code: s.code,
                    language: s.language || 'python', // Default if missing
                    data: { ...s, slug } // Inject slug into data if missing
                };
                const { error } = await supabase.from('solutions').upsert(row);
                if (error) console.error(`Failed to insert solution ${slug}:`, error.message);
            }
            console.log('✅ Solutions seeded.');
        } else {
            console.warn('⚠️ solutions.json not found at', solutionsPath);
        }
    } catch (e) {
        console.error('Solutions seed error:', e);
    }

    console.log('✨ Seed complete.');
}

seed();
