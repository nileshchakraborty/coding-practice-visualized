import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminLogin } from '../AdminLogin';

// Mock dependencies
const mockLogin = vi.fn();
const mockOnLogin = vi.fn();

// Mock fetch
const fetchSpy = vi.spyOn(window, 'fetch');

describe('AdminLogin', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        mockLogin.mockReset();
        mockOnLogin.mockReset();
        fetchSpy.mockReset();
    });

    it('renders login prompt when not authenticated', async () => {
        // Mock checkSession
        fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ active: false })
        } as Response);

        render(
            <AdminLogin
                onLogin={mockOnLogin}
                login={mockLogin}
                googleToken={null}
                googleEmail={null}
            />
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
        });
    });

    it('auto-triggers Google Auth when token provided', async () => {
        // 1. checkSession (active: false)
        fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ active: false })
        } as Response);

        // 2. Google Auth API success
        fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: 'verified-admin-token', totpRequired: false })
        } as Response);

        render(
            <AdminLogin
                onLogin={mockOnLogin}
                login={mockLogin}
                googleToken="valid-google-token"
                googleEmail="admin@codenium.io"
            />
        );

        // Should see success message first
        await waitFor(() => {
            expect(screen.getByText('Admin access granted!')).toBeInTheDocument();
        });

        // Then check callback
        await waitFor(() => {
            expect(mockOnLogin).toHaveBeenCalledWith('verified-admin-token');
        });
    });

    it('handles Google Auth failure', async () => {
        // 1. checkSession
        fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ active: false })
        } as Response);

        // 2. Google Auth Failure
        fetchSpy.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Unauthorized email' })
        } as Response);

        render(
            <AdminLogin
                onLogin={mockOnLogin}
                login={mockLogin}
                googleToken="invalid-token"
                googleEmail="hacker@evil.com"
            />
        );

        await waitFor(() => {
            expect(screen.getByText(/Unauthorized email/i)).toBeInTheDocument();
        });
        expect(mockOnLogin).not.toHaveBeenCalled();
    });

    it('handles TOTP requirement flow (Setup Done)', async () => {
        // 1. checkSession
        fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ active: false })
        } as Response);

        // 2. Google Auth says TOTP needed AND setup is done
        fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                token: 'temp-token',
                totpRequired: true,
                totpSetup: true
            })
        } as Response);

        render(
            <AdminLogin
                onLogin={mockOnLogin}
                login={mockLogin}
                googleToken="valid-token"
            />
        );

        // Should switch to TOTP input
        await waitFor(() => {
            expect(screen.getByTestId('totp-input')).toBeInTheDocument();
        });
    });

    it('restores session from valid storage', async () => {
        sessionStorage.setItem('admin_token', 'stored-token');

        // Mock status check success
        fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ active: true, fullyAuthenticated: true })
        } as Response);

        render(
            <AdminLogin
                onLogin={mockOnLogin}
                login={mockLogin}
            />
        );

        await waitFor(() => {
            expect(mockOnLogin).toHaveBeenCalledWith('stored-token');
        });
    });

    it('clears invalid session on mount', async () => {
        sessionStorage.setItem('admin_token', 'bad-token');

        // Mock status check failure
        fetchSpy.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Invalid token' })
        } as Response);

        // Fallback for subsequent calls (if any)
        fetchSpy.mockResolvedValue({
            ok: true,
            json: async () => ({ active: false })
        } as Response);

        render(
            <AdminLogin
                onLogin={mockOnLogin}
                login={mockLogin}
            />
        );

        await waitFor(() => {
            expect(sessionStorage.getItem('admin_token')).toBeNull();
        });
    });
});
