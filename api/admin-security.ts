/**
 * Admin Security Module
 * 
 * Provides secure admin authentication for both local and production environments:
 * - Email allowlist verification
 * - TOTP (Time-based One-Time Password) support
 * - Session binding with expiration
 * - Activity logging
 */

import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../src/infrastructure/db/SupabaseClient';

// ============================================
// Configuration
// ============================================

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'CODENIUM_ADMIN_SECRET_2024';
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',')
    .map(e => e.trim().toLowerCase()) || [];
const TOTP_ISSUER = 'Codenium Admin';

// Session storage (in-memory for now, persists across requests in same instance)
interface AdminSession {
    googleId: string;
    email: string;
    createdAt: number;
    expiresAt: number;
    totpVerified: boolean;
    userAgent: string;
    clientIp: string;           // IP address for session binding
    fingerprint: string;        // Hash of UA + IP for anti-hijacking
    lastActivity: number;
}

const adminSessions = new Map<string, AdminSession>();

// TOTP secrets storage (should be in env or KV in production)
interface TotpRecord {
    secret: string;
    email: string;
    verified: boolean;
    createdAt: number;
}

const totpSecrets = new Map<string, TotpRecord>();
let secretsLoaded = false;

async function ensureSecretsLoaded() {
    if (secretsLoaded) return;
    if (!supabase) {
        secretsLoaded = true;
        return;
    }

    try {
        const { data } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'admin_totp_secrets')
            .single();

        if (data?.value) {
            // Merge with existing
            Object.entries(data.value).forEach(([email, record]) => {
                totpSecrets.set(email, record as TotpRecord);
            });
        }
        secretsLoaded = true;
    } catch (error) {
        console.error('Failed to load TOTP secrets:', error);
    }
}

async function saveTotpSecrets() {
    if (!supabase) return;
    try {
        const jsonObject = Object.fromEntries(totpSecrets);
        await supabase.from('site_settings').upsert({
            key: 'admin_totp_secrets',
            value: jsonObject,
            updated_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('Failed to save TOTP secrets:', error);
    }
}

// Activity log
interface AdminActivity {
    timestamp: string;
    action: string;
    details: string;
    email?: string;
    ip: string;
}

const adminActivityLog: AdminActivity[] = [];
const MAX_LOG_SIZE = 1000;

// Rate limiting for admin
interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

// ============================================
// Helper Functions
// ============================================

export function generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

export function isEmailAllowed(email: string): boolean {
    return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Generate a session fingerprint from client characteristics
 * Used to detect token hijacking attempts
 */
function generateFingerprint(req: Request): string {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = getClientIp(req);
    // Create hash of client characteristics
    const data = `${userAgent}:${ip}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Extract client IP address from request
 */
function getClientIp(req: Request): string {
    // Handle proxied requests
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        const ips = (typeof forwardedFor === 'string' ? forwardedFor : forwardedFor[0]).split(',');
        return ips[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * Validate session fingerprint matches current request
 * Returns null if valid, error message if invalid
 */
export function validateSessionFingerprint(session: AdminSession, req: Request): string | null {
    const currentFingerprint = generateFingerprint(req);

    if (session.fingerprint !== currentFingerprint) {
        const currentIp = getClientIp(req);
        // Log the mismatch for security monitoring
        logActivity(
            'SESSION_FINGERPRINT_MISMATCH',
            `Possible token hijacking detected. Session IP: ${session.clientIp}, Request IP: ${currentIp}`,
            req,
            session.email
        );
        return 'Session fingerprint mismatch. Please re-authenticate.';
    }
    return null;
}

export function logActivity(action: string, details: string, req: Request, email?: string): void {
    const activity: AdminActivity = {
        timestamp: new Date().toISOString(),
        action,
        details,
        email,
        ip: req.ip || req.socket?.remoteAddress || 'unknown'
    };
    adminActivityLog.unshift(activity);
    if (adminActivityLog.length > MAX_LOG_SIZE) {
        adminActivityLog.pop();
    }
    console.log(`[ADMIN] ${action}: ${details}${email ? ` (${email})` : ''}`);
}

export function getActivityLogs(limit = 50): { logs: AdminActivity[], total: number } {
    return {
        logs: adminActivityLog.slice(0, Math.min(limit, 100)),
        total: adminActivityLog.length
    };
}

function isLocalRequest(req: Request): boolean {
    const ip = req.ip || req.socket?.remoteAddress || '';
    const localIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    return localIps.some(local => ip.includes(local));
}

// ============================================
// JWE Token Functions (for local development)
// ============================================

export function verifyJWE(token: string): { valid: boolean; payload?: { sub: string; exp: number } } {
    try {
        if (!ADMIN_SECRET) return { valid: false };

        const parts = token.split('.');
        if (parts.length !== 3) return { valid: false };

        const [ivB64, authTagB64, encrypted] = parts;
        const iv = Buffer.from(ivB64, 'base64');
        const authTag = Buffer.from(authTagB64, 'base64');

        const key = crypto.scryptSync(ADMIN_SECRET!, 'salt', 32);
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        const payload = JSON.parse(decrypted);

        if (payload.exp < Date.now()) {
            return { valid: false };
        }

        return { valid: true, payload };
    } catch {
        return { valid: false };
    }
}

// ============================================
// TOTP Functions
// ============================================

export async function generateTotpSecret(email: string): Promise<{ secret: string; qrCodeUrl: string }> {
    await ensureSecretsLoaded();
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(email, TOTP_ISSUER, secret);

    // Store secret (unverified until first successful code entry)
    totpSecrets.set(email.toLowerCase(), {
        secret,
        email: email.toLowerCase(),
        verified: false,
        createdAt: Date.now()
    });

    await saveTotpSecrets();

    return { secret, qrCodeUrl: otpauth };
}

export async function getTotpQRCode(email: string): Promise<string | null> {
    await ensureSecretsLoaded();
    const record = totpSecrets.get(email.toLowerCase());
    if (!record) return null;

    const otpauth = authenticator.keyuri(email, TOTP_ISSUER, record.secret);
    try {
        return await QRCode.toDataURL(otpauth);
    } catch {
        return null;
    }
}

export async function verifyTotpCode(email: string, code: string): Promise<boolean> {
    await ensureSecretsLoaded();
    const record = totpSecrets.get(email.toLowerCase());
    if (!record) return false;

    const isValid = authenticator.verify({ token: code, secret: record.secret });

    if (isValid && !record.verified) {
        // Mark as verified on first successful code
        record.verified = true;
        totpSecrets.set(email.toLowerCase(), record);
        await saveTotpSecrets();
    }

    return isValid;
}

export async function isTotpSetup(email: string): Promise<boolean> {
    await ensureSecretsLoaded();
    const record = totpSecrets.get(email.toLowerCase());
    return record?.verified ?? false;
}

export async function requiresTotpSetup(email: string): Promise<boolean> {
    await ensureSecretsLoaded();
    const record = totpSecrets.get(email.toLowerCase());
    return !record || !record.verified;
}

// ============================================
// Session Management
// ============================================

export function createSession(
    token: string,
    googleId: string,
    email: string,
    req: Request,
    totpVerified: boolean = false
): AdminSession {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const clientIp = getClientIp(req);
    const fingerprint = generateFingerprint(req);

    const session: AdminSession = {
        googleId,
        email: email.toLowerCase(),
        createdAt: Date.now(),
        expiresAt: Date.now() + (4 * 60 * 60 * 1000), // 4 hours
        totpVerified,
        userAgent,
        clientIp,
        fingerprint,
        lastActivity: Date.now()
    };

    adminSessions.set(token, session);
    return session;
}

export function getSession(token: string): AdminSession | null {
    const session = adminSessions.get(token);
    if (!session) return null;

    // Check expiration
    if (session.expiresAt < Date.now()) {
        adminSessions.delete(token);
        return null;
    }

    // Update last activity
    session.lastActivity = Date.now();
    adminSessions.set(token, session);

    return session;
}

export function deleteSession(token: string): boolean {
    return adminSessions.delete(token);
}

export function getSessionsForEmail(email: string): { token: string; session: AdminSession }[] {
    const sessions: { token: string; session: AdminSession }[] = [];
    adminSessions.forEach((session, token) => {
        if (session.email === email.toLowerCase()) {
            sessions.push({ token, session });
        }
    });
    return sessions;
}

// ============================================
// Express Middleware
// ============================================

/**
 * Rate limiter for admin endpoints
 */
export function adminRateLimiter(req: Request, res: Response, next: NextFunction): void {
    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();

    let entry = rateLimitMap.get(key);

    if (!entry || entry.resetAt < now) {
        entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
    }

    entry.count++;
    rateLimitMap.set(key, entry);

    if (entry.count > RATE_LIMIT_MAX) {
        logActivity('RATE_LIMIT', `Rate limit exceeded: ${key}`, req);
        res.status(429).json({
            error: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((entry.resetAt - now) / 1000)
        });
        return;
    }

    next();
}

/**
 * Verify Google OAuth token and extract user info
 */
export async function verifyGoogleSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({
            error: 'Google authentication required',
            code: 'GOOGLE_AUTH_REQUIRED'
        });
        return;
    }

    const token = authHeader.substring(7);

    try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!userInfoResponse.ok) {
            res.status(401).json({
                error: 'Invalid or expired Google token',
                code: 'GOOGLE_TOKEN_INVALID'
            });
            return;
        }

        const userInfo = await userInfoResponse.json();
        (req as any).googleUser = userInfo;
        next();
    } catch {
        res.status(401).json({
            error: 'Failed to verify Google session',
            code: 'GOOGLE_VERIFY_FAILED'
        });
    }
}

/**
 * Check if user's email is in the admin allowlist
 */
export function checkAdminAllowlist(req: Request, res: Response, next: NextFunction): void {
    const googleUser = (req as any).googleUser;

    if (!googleUser?.email) {
        res.status(401).json({
            error: 'Email not found in Google profile',
            code: 'EMAIL_MISSING'
        });
        return;
    }

    if (!isEmailAllowed(googleUser.email)) {
        logActivity('ACCESS_DENIED', `Unauthorized email: ${googleUser.email}`, req, googleUser.email);
        res.status(403).json({
            error: 'Your email is not authorized for admin access',
            code: 'EMAIL_NOT_ALLOWED'
        });
        return;
    }

    next();
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return null;
}

/**
 * Validate admin session token
 */
export function validateAdminSession(req: Request, res: Response, next: NextFunction): void {
    const token = extractBearerToken(req);

    if (!token) {
        res.status(401).json({
            error: 'Admin session required. Please provide Authorization: Bearer token.',
            code: 'SESSION_REQUIRED'
        });
        return;
    }

    const session = getSession(token);

    if (!session) {
        res.status(401).json({
            error: 'Invalid or expired session. Please re-authenticate.',
            code: 'SESSION_INVALID'
        });
        return;
    }

    // For production (non-localhost), require TOTP verification
    if (!isLocalRequest(req) && !session.totpVerified) {
        res.status(401).json({
            error: 'TOTP verification required',
            code: 'TOTP_REQUIRED'
        });
        return;
    }

    // Validate session fingerprint to prevent token hijacking
    const fingerprintError = validateSessionFingerprint(session, req);
    if (fingerprintError) {
        // Invalidate the potentially compromised session
        deleteSession(token);
        res.status(401).json({
            error: fingerprintError,
            code: 'SESSION_HIJACK_DETECTED'
        });
        return;
    }

    (req as any).adminSession = session;
    next();
}

/**
 * Hybrid middleware: localhost uses JWE, production uses Google OAuth + TOTP
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
    // For local development, allow JWE token flow
    if (isLocalRequest(req) || process.env.NODE_ENV === 'development') {
        const jweToken = extractBearerToken(req);
        if (jweToken) {
            // Check for existing session first
            const session = getSession(jweToken);
            if (session) {
                (req as any).adminSession = session;
                next();
                return;
            }
        }
    }

    // For production, require full validation
    validateAdminSession(req, res, next);
}

// Export all for use in main API
export {
    AdminSession,
    AdminActivity,
    adminSessions,
    totpSecrets,
    isLocalRequest
};
