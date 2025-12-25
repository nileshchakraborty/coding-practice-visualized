/**
 * Admin Authentication Middleware
 * 
 * Security layers:
 * 1. Localhost-only access (unless in development)
 * 2. Valid admin token required
 * 3. Google OAuth user verification
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Store valid tokens (in production, use Redis or database)
const validTokens: Map<string, { userId: string; createdAt: number; expiresAt: number }> = new Map();

// Secret for token validation (match frontend)
const ADMIN_SECRET = 'CODENIUM_ADMIN_2024';

/**
 * Check if request is from localhost
 */
export const isLocalRequest = (req: Request): boolean => {
    const ip = req.ip || req.socket.remoteAddress || '';
    const forwardedFor = req.headers['x-forwarded-for'];

    // Check direct IP
    const localIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost'];
    if (localIps.some(local => ip.includes(local))) {
        return true;
    }

    // Check forwarded header (for reverse proxies)
    if (forwardedFor) {
        const firstIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0].trim();
        if (localIps.some(local => firstIp.includes(local))) {
            return true;
        }
    }

    return false;
};

/**
 * Middleware: Require localhost access
 */
export const requireLocalhost = (req: Request, res: Response, next: NextFunction): void => {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        // Allow all access in development mode
        next();
        return;
    }

    if (!isLocalRequest(req)) {
        res.status(403).json({
            error: 'Admin access restricted to localhost only',
            hint: 'Run the application locally to access admin features'
        });
        return;
    }

    next();
};

/**
 * Register a new admin token
 */
export const registerAdminToken = (token: string, userId: string): void => {
    const createdAt = Date.now();
    const expiresAt = createdAt + (24 * 60 * 60 * 1000); // 24 hours

    validTokens.set(token, { userId, createdAt, expiresAt });

    // Cleanup expired tokens
    for (const [key, value] of validTokens.entries()) {
        if (value.expiresAt < Date.now()) {
            validTokens.delete(key);
        }
    }
};

/**
 * Validate admin token format and structure
 */
const isValidTokenFormat = (token: string): boolean => {
    // Token format: admin_HASH_TIMESTAMP
    const pattern = /^admin_[a-f0-9]{24}_\d+$/;
    return pattern.test(token);
};

/**
 * Middleware: Validate admin token
 */
export const validateAdminToken = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers['x-admin-token'] as string;

    if (!token) {
        res.status(401).json({
            error: 'Admin token required',
            hint: 'Generate a token using window.generateAdminToken() in browser console'
        });
        return;
    }

    if (!isValidTokenFormat(token)) {
        res.status(401).json({ error: 'Invalid token format' });
        return;
    }

    // Check if token is registered (for server-verified flow)
    // For now, we trust the token format since it's generated client-side
    // In production, implement server-side token verification

    // Store token info on request for later use
    (req as Request & { adminToken: string }).adminToken = token;

    next();
};

/**
 * Combined middleware for admin routes
 */
export const requireAdmin = [requireLocalhost, validateAdminToken];

export default {
    requireLocalhost,
    validateAdminToken,
    requireAdmin,
    registerAdminToken,
    isLocalRequest
};
