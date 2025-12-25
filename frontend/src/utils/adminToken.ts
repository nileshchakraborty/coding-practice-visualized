/**
 * Admin Token Generator
 * 
 * Security: This function is only accessible via browser console
 * after logging in with Google OAuth. The token is generated from
 * the user's Google ID + timestamp + secret, making it unique per session.
 * 
 * Usage (in browser console):
 *   window.generateAdminToken()
 * 
 * This will only work if:
 * 1. User is logged in via Google
 * 2. Running on localhost
 */

// Simple hash function for token generation
const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    // Convert to hex and pad
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return hex;
};

// Generate a secure admin token
const generateToken = (userId: string): string => {
    const timestamp = Date.now();
    const secret = 'CODENIUM_ADMIN_2024';
    const combined = `${userId}-${timestamp}-${secret}`;

    // Create a longer hash by hashing multiple times
    const hash1 = simpleHash(combined);
    const hash2 = simpleHash(combined + hash1);
    const hash3 = simpleHash(hash1 + hash2 + timestamp.toString());

    return `admin_${hash1}${hash2}${hash3}_${timestamp}`;
};

// Store the current valid token (in memory only, not persisted)
let currentAdminToken: string | null = null;

/**
 * Generate admin token from console
 * Must be called after Google login
 */
export const generateAdminToken = (): string | null => {
    // Check if running on localhost
    const isLocalhost = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

    if (!isLocalhost) {
        console.error('❌ Admin token generation only available on localhost');
        return null;
    }

    // Try to get user info from localStorage (set by Google OAuth)
    const userDataStr = localStorage.getItem('codenium_user');
    if (!userDataStr) {
        console.error('❌ You must be logged in to generate an admin token');
        console.log('💡 Please sign in with Google first, then try again');
        return null;
    }

    try {
        const userData = JSON.parse(userDataStr);
        const userId = userData.id || userData.sub;

        if (!userId) {
            console.error('❌ Invalid user data. Please log out and log in again.');
            return null;
        }

        // Generate token
        const token = generateToken(userId);
        currentAdminToken = token;

        console.log('✅ Admin token generated successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🔑 Token: ${token}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Copy this token and paste it at /access-admin');
        console.log('⏰ This token expires when you close the browser tab');

        return token;
    } catch (e) {
        console.error('❌ Failed to parse user data:', e);
        return null;
    }
};

/**
 * Validate an admin token
 */
export const validateAdminToken = (token: string): boolean => {
    if (!currentAdminToken) {
        return false;
    }
    return token === currentAdminToken;
};

/**
 * Get current admin token (for API calls)
 */
export const getAdminToken = (): string | null => {
    return currentAdminToken;
};

/**
 * Clear admin session
 */
export const clearAdminSession = (): void => {
    currentAdminToken = null;
    console.log('🔒 Admin session cleared');
};

/**
 * Check if admin session is active
 */
export const isAdminSessionActive = (): boolean => {
    return currentAdminToken !== null;
};

// Attach to window for console access
if (typeof window !== 'undefined') {
    (window as unknown as { generateAdminToken: typeof generateAdminToken }).generateAdminToken = generateAdminToken;
    (window as unknown as { clearAdminSession: typeof clearAdminSession }).clearAdminSession = clearAdminSession;
}

export default {
    generateAdminToken,
    validateAdminToken,
    getAdminToken,
    clearAdminSession,
    isAdminSessionActive
};
