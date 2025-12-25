import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider } from '../AuthContext';
import { AuthContext } from '../AuthContextDefinition';
import React, { useContext } from 'react';
import * as authUtils from '../../utils/auth';

// Mock GoogleOAuthProvider and useGoogleLogin
const mockGoogleLogin = vi.fn();
vi.mock('@react-oauth/google', () => ({
    GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useGoogleLogin: (config: unknown) => {
        vi.stubGlobal('googleLoginConfig', config);
        return mockGoogleLogin;
    }
}));

const TestComponent = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('AuthContext required');
    const { isAuthenticated, user, login, logout, isLoading } = context;

    if (isLoading) return <div>Loading...</div>;
    return (
        <div>
            {isAuthenticated ? 'Authenticated' : 'Guest'}
            {user && <span data-testid="user-name">{user.name}</span>}
            <button onClick={login}>Login</button>
            <button onClick={logout}>Logout</button>
        </div>
    );
};

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id');
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks(); // Ensure spies are restored
    });

    it('renders loading initially then guest state', async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );
        await waitFor(() => expect(screen.getByText('Guest')).toBeInTheDocument());
    });

    it('restores session from localStorage', async () => {
        const user = { name: 'Test User', email: 'test@example.com' };
        localStorage.setItem(authUtils.USER_KEY, JSON.stringify(user));
        localStorage.setItem(authUtils.TOKEN_KEY, 'token123');
        localStorage.setItem('codenium_token_expiry', String(Date.now() + 10000));

        render(<AuthProvider><TestComponent /></AuthProvider>);

        await waitFor(() => expect(screen.getByText('Authenticated')).toBeInTheDocument());
    });

    it('handles legacy session (no expiry)', async () => {
        const user = { name: 'Legacy User' };
        localStorage.setItem(authUtils.USER_KEY, JSON.stringify(user));
        localStorage.setItem(authUtils.TOKEN_KEY, 'token123');
        // No expiry set

        render(<AuthProvider><TestComponent /></AuthProvider>);

        await waitFor(() => expect(screen.getByText('Authenticated')).toBeInTheDocument());
    });

    it('clears expired session', async () => {
        const user = { name: 'Test User' };
        localStorage.setItem(authUtils.USER_KEY, JSON.stringify(user));
        localStorage.setItem(authUtils.TOKEN_KEY, 'token123');
        localStorage.setItem('codenium_token_expiry', String(Date.now() - 10000)); // Expired

        render(<AuthProvider><TestComponent /></AuthProvider>);

        await waitFor(() => expect(screen.getByText('Guest')).toBeInTheDocument());
        expect(localStorage.getItem(authUtils.TOKEN_KEY)).toBeNull();
    });

    it('handles session restore error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const storageSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('Storage Error');
        });

        render(<AuthProvider><TestComponent /></AuthProvider>);

        await waitFor(() => expect(screen.getByText('Guest')).toBeInTheDocument());
        expect(consoleSpy).toHaveBeenCalledWith('Error restoring auth session:', expect.any(Error));

        // Manually restore anyway, though afterEach handles it now
        storageSpy.mockRestore();
        consoleSpy.mockRestore();
    });

    it('handles login success', async () => {
        render(<AuthProvider><TestComponent /></AuthProvider>);
        await waitFor(() => expect(screen.getByText('Guest')).toBeInTheDocument());

        const loginBtn = screen.getByText('Login');
        act(() => loginBtn.click());

        const config = (window as unknown as { googleLoginConfig: { onSuccess: (res: { access_token: string }) => void } }).googleLoginConfig;

        vi.mocked(fetch).mockResolvedValue({
            json: async () => ({
                email: 'new@example.com', name: 'New User', picture: 'pic.jpg', sub: '123'
            })
        } as Response);

        await act(async () => {
            await config.onSuccess({ access_token: 'new-token' });
        });

        await waitFor(() => expect(screen.getByText('Authenticated')).toBeInTheDocument());
    });

    it('handles user info fetch error during login', async () => {
        render(<AuthProvider><TestComponent /></AuthProvider>);
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const loginBtn = screen.getByText('Login');
        act(() => loginBtn.click());
        const config = (window as unknown as { googleLoginConfig: { onSuccess: (res: { access_token: string }) => void } }).googleLoginConfig;

        vi.mocked(fetch).mockRejectedValue(new Error('Network Error'));

        await act(async () => {
            await config.onSuccess({ access_token: 'token' });
        });

        expect(consoleSpy).toHaveBeenCalledWith('Error fetching user info:', expect.any(Error));
        expect(screen.getByText('Guest')).toBeInTheDocument();

        consoleSpy.mockRestore();
    });

    it('handles login failure callback', async () => {
        render(<AuthProvider><TestComponent /></AuthProvider>);
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const loginBtn = screen.getByText('Login');
        act(() => loginBtn.click()); // Ensure hook is setup

        act(() => {
            (window as unknown as { googleLoginConfig: { onError: (err: string) => void } }).googleLoginConfig.onError('Login Failed');
        });

        expect(consoleSpy).toHaveBeenCalledWith('Google login failed:', 'Login Failed');
        consoleSpy.mockRestore();
    });

    it('handles logout', async () => {
        const user = { name: 'Test User' };
        localStorage.setItem(authUtils.USER_KEY, JSON.stringify(user));
        localStorage.setItem(authUtils.TOKEN_KEY, 'token123');
        localStorage.setItem('codenium_token_expiry', String(Date.now() + 10000));

        render(<AuthProvider><TestComponent /></AuthProvider>);
        await waitFor(() => expect(screen.getByText('Authenticated')).toBeInTheDocument());

        const logoutBtn = screen.getByText('Logout');
        act(() => logoutBtn.click());

        await waitFor(() => expect(screen.getByText('Guest')).toBeInTheDocument());
        expect(localStorage.getItem(authUtils.TOKEN_KEY)).toBeNull();
    });

    it('handles malformed user data in localStorage', async () => {
        localStorage.setItem(authUtils.USER_KEY, 'invalid-json');
        localStorage.setItem(authUtils.TOKEN_KEY, 'token123');

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        render(<AuthProvider><TestComponent /></AuthProvider>);

        await waitFor(() => expect(screen.getByText('Guest')).toBeInTheDocument());

        consoleSpy.mockRestore();
    });

    it('handles token without user data', async () => {
        localStorage.setItem(authUtils.TOKEN_KEY, 'token123');
        localStorage.setItem('codenium_token_expiry', String(Date.now() + 10000));
        // No user data

        render(<AuthProvider><TestComponent /></AuthProvider>);

        await waitFor(() => expect(screen.getByText('Guest')).toBeInTheDocument());
    });

    it('returns accessToken from context', async () => {
        const user = { name: 'Test User', email: 'test@example.com' };
        localStorage.setItem(authUtils.USER_KEY, JSON.stringify(user));
        localStorage.setItem(authUtils.TOKEN_KEY, 'test-access-token');
        localStorage.setItem('codenium_token_expiry', String(Date.now() + 10000));

        const TokenTest = () => {
            const context = useContext(AuthContext);
            if (!context) return null;
            return <div data-testid="token">{context.accessToken}</div>;
        };

        render(<AuthProvider><TokenTest /></AuthProvider>);

        await waitFor(() => {
            expect(screen.getByTestId('token')).toHaveTextContent('test-access-token');
        });
    });

    it('provides mock login when client ID is missing', async () => {
        vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');

        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });

        const LoginTest = () => {
            const context = useContext(AuthContext);
            if (!context) return null;
            return (
                <div>
                    <span data-testid="authenticated">{context.isAuthenticated ? 'yes' : 'no'}</span>
                    <button onClick={context.login}>Login</button>
                </div>
            );
        };

        render(<AuthProvider><LoginTest /></AuthProvider>);

        await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
        });

        // Click login - should show alert
        const loginBtn = screen.getByText('Login');
        loginBtn.click();

        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Google OAuth is not configured'));

        alertSpy.mockRestore();
    });
});
