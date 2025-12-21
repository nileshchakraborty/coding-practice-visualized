/**
 * AuthContext - Google OAuth Authentication
 * Provides authentication state and methods throughout the app
 */
import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import {
    type User,
    TOKEN_KEY,
    USER_KEY
} from '../utils/auth';

import { AuthContext } from './AuthContextDefinition';

// Inner provider (needs to be inside GoogleOAuthProvider)
const AuthProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        try {
            const savedUser = localStorage.getItem(USER_KEY);
            const savedToken = localStorage.getItem(TOKEN_KEY);
            const tokenExpiry = localStorage.getItem('codenium_token_expiry');

            if (savedUser && savedToken) {
                // Check if token is expired (default 1 hour from Google)
                if (tokenExpiry && parseInt(tokenExpiry, 10) > Date.now()) {
                    setUser(JSON.parse(savedUser));
                } else if (!tokenExpiry) {
                    // Legacy: no expiry stored, assume valid for now
                    setUser(JSON.parse(savedUser));
                } else {
                    // Token expired, clear storage
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem(USER_KEY);
                    localStorage.removeItem('codenium_token_expiry');
                }
            }
        } catch (error) {
            console.error('Error restoring auth session:', error);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem('codenium_token_expiry');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse: { access_token: string }) => {
            try {
                // Get user info from Google
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const userInfo = await userInfoResponse.json();

                const userData: User = {
                    email: userInfo.email,
                    name: userInfo.name,
                    picture: userInfo.picture,
                    sub: userInfo.sub
                };

                // Store token and user (access tokens expire in 1 hour)
                localStorage.setItem(TOKEN_KEY, tokenResponse.access_token);
                localStorage.setItem(USER_KEY, JSON.stringify(userData));
                localStorage.setItem('codenium_token_expiry', String(Date.now() + 3600 * 1000));
                setUser(userData);
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        },
        onError: (error: unknown) => {
            console.error('Google login failed:', error);
        }
    });

    const login = useCallback(() => {
        googleLogin();
    }, [googleLogin]);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Main provider with Google OAuth wrapper
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

    if (!clientId) {
        console.warn('VITE_GOOGLE_CLIENT_ID is not set. Auth will be disabled.');
        // Provide a mock context when no client ID - show alert to user
        return (
            <AuthContext.Provider value={{
                user: null,
                isAuthenticated: false,
                isLoading: false,
                login: () => {
                    alert('Google OAuth is not configured.\n\nTo enable login:\n1. Create a Google OAuth Client ID at console.cloud.google.com/apis/credentials\n2. Add VITE_GOOGLE_CLIENT_ID to your .env file\n3. Restart the development server');
                },
                logout: () => { }
            }}>
                {children}
            </AuthContext.Provider>
        );
    }

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <AuthProviderInner>{children}</AuthProviderInner>
        </GoogleOAuthProvider>
    );
};
