#!/usr/bin/env npx ts-node
/**
 * Admin Access Grant Script
 * 
 * Generates a JWE token tied to a Google session for admin access.
 * 
 * Usage:
 *   npx ts-node scripts/grant-admin.ts <google-session-id>
 * 
 * The session ID can be found in your browser after logging in:
 *   1. Open DevTools (F12)
 *   2. Go to Application > Local Storage > your site
 *   3. Find 'codenium_user' and copy the 'id' or 'sub' field
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'CODENIUM_ADMIN_SECRET_2024';
const SESSION_FILE = path.join(__dirname, '..', '.admin-session');

interface AdminSession {
    googleId: string;
    jweToken: string;
    createdAt: number;
    expiresAt: number;
}

/**
 * Generate a JWE-like token (simplified for Node.js without jose library)
 * In production, use the 'jose' library for proper JWE
 */
function generateJWE(googleId: string): string {
    const timestamp = Date.now();
    const expiresAt = timestamp + (24 * 60 * 60 * 1000); // 24 hours

    const payload = JSON.stringify({
        sub: googleId,
        iat: timestamp,
        exp: expiresAt,
        type: 'admin_grant'
    });

    // Create encrypted token (AES-256-GCM)
    const key = crypto.scryptSync(ADMIN_SECRET, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(payload, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Combine: iv.authTag.encrypted
    const token = `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted}`;

    return token;
}

/**
 * Verify a JWE token
 */
export function verifyJWE(token: string): { valid: boolean; payload?: { sub: string; exp: number } } {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return { valid: false };

        const [ivB64, authTagB64, encrypted] = parts;
        const iv = Buffer.from(ivB64, 'base64');
        const authTag = Buffer.from(authTagB64, 'base64');

        const key = crypto.scryptSync(ADMIN_SECRET, 'salt', 32);
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        const payload = JSON.parse(decrypted);

        // Check expiration
        if (payload.exp < Date.now()) {
            return { valid: false };
        }

        return { valid: true, payload };
    } catch (e) {
        return { valid: false };
    }
}

/**
 * Main script
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
╔════════════════════════════════════════════════════════════╗
║                   ADMIN ACCESS GRANT                       ║
╠════════════════════════════════════════════════════════════╣
║ Usage: npx ts-node scripts/grant-admin.ts <google-id>      ║
║                                                            ║
║ To find your Google ID:                                    ║
║   1. Log in to the site with Google                        ║
║   2. Open browser DevTools (F12)                           ║
║   3. Go to Application > Local Storage                     ║
║   4. Find 'codenium_user' and copy the 'id' field          ║
╚════════════════════════════════════════════════════════════╝
    `);
        process.exit(1);
    }

    const googleId = args[0];

    console.log('\\n🔐 Generating admin access token...\\n');

    // Generate JWE token
    const jweToken = generateJWE(googleId);

    // Save session
    const session: AdminSession = {
        googleId,
        jweToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    };

    fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));

    console.log('✅ Admin token generated successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 JWE Token:\\n${jweToken}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\\n⏰ Expires: ${new Date(session.expiresAt).toLocaleString()}`);
    console.log(`\\n📡 To activate admin access, run this curl command:\\n`);
    console.log(`curl -X POST http://localhost:3001/api/admin/activate \\\\`);
    console.log(`  -H "Content-Type: application/json" \\\\`);
    console.log(`  -d '{"token": "${jweToken}", "googleId": "${googleId}"}'`);
    console.log(`\\n🔒 Session saved to: .admin-session (gitignored)`);
}

main().catch(console.error);
