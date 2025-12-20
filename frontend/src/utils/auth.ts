/**
 * Auth utilities and types
 */

export interface User {
    email: string;
    name: string;
    picture: string;
    sub: string; // Google user ID
}

export interface GoogleTokenPayload {
    email: string;
    name: string;
    picture: string;
    sub: string;
    exp: number;
}

// Storage keys
export const TOKEN_KEY = 'codenium_auth_token';
export const USER_KEY = 'codenium_user';

// Get token for API calls
export const getAuthToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};
