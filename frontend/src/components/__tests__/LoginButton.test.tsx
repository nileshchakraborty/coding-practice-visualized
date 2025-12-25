import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginButton } from '../LoginButton';
import * as useAuthHook from '../../hooks/useAuth';
import { SyncService } from '../../services/SyncService';

// Mock SyncService
vi.mock('../../services/SyncService', () => ({
    SyncService: {
        resetStats: vi.fn(),
        resetAll: vi.fn(),
        saveLocalProgress: vi.fn()
    }
}));

// Mock useAuth
vi.mock('../../hooks/useAuth', () => ({
    useAuth: vi.fn()
}));

const mockUser = {
    name: 'Test User',
    email: 'test@example.com',
    picture: 'https://example.com/pic.jpg'
};

describe('LoginButton', () => {
    const mockLogin = vi.fn();
    const mockLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const setup = (isAuthenticated = false, isLoading = false) => {
        (useAuthHook.useAuth as Mock).mockReturnValue({
            user: isAuthenticated ? mockUser : null,
            isAuthenticated,
            isLoading,
            login: mockLogin,
            logout: mockLogout
        });
        render(<LoginButton />);
    };

    it('renders loading state', () => {
        setup(false, true);
        // Should show pulse div (checking by class or just absence of button text)
        expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
        const pulse = document.querySelector('.animate-pulse');
        expect(pulse).toBeInTheDocument();
    });

    it('renders login button when logged out and handles click', () => {
        setup(false, false);
        const btn = screen.getByText('Sign In');
        expect(btn).toBeInTheDocument();

        fireEvent.click(btn);
        expect(mockLogin).toHaveBeenCalled();
    });

    it('renders user avatar when authenticated', () => {
        setup(true, false);
        expect(screen.getByAltText('Test User')).toBeInTheDocument();
        expect(screen.getByText('Test')).toBeInTheDocument(); // First name
    });

    it('renders fallback avatar if no picture', () => {
        (useAuthHook.useAuth as Mock).mockReturnValue({
            user: { ...mockUser, picture: null },
            isAuthenticated: true,
            isLoading: false,
            login: mockLogin,
            logout: mockLogout
        });
        render(<LoginButton />);
        // Fallback is a div with gradient - harder to query directly, but we can check picture is absent
        expect(screen.queryByAltText('Test User')).not.toBeInTheDocument();
        expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('toggles dropdown on click', () => {
        setup(true, false);
        const avatarBtn = screen.getByAltText('Test User').parentElement!;

        // Open
        fireEvent.click(avatarBtn);
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();

        // Close (by clicking again)
        fireEvent.click(avatarBtn);
        expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', async () => {
        setup(true, false);
        fireEvent.click(screen.getByAltText('Test User').parentElement!);
        expect(screen.getByText('test@example.com')).toBeInTheDocument();

        // Click document body
        fireEvent.mouseDown(document.body);
        await waitFor(() => expect(screen.queryByText('test@example.com')).not.toBeInTheDocument());
    });

    it('handles interactions in dropdown (Reset Stats)', () => {
        setup(true, false);
        fireEvent.click(screen.getByAltText('Test User').parentElement!);

        // Click Reset Stats
        fireEvent.click(screen.getByText('Reset Stats'));

        // Should show confirmation
        expect(screen.getByText('Reset solved count?')).toBeInTheDocument();

        // Confirm
        fireEvent.click(screen.getByText('Yes, Reset'));

        expect(SyncService.resetStats).toHaveBeenCalled();
    });

    it('handles interactions in dropdown (Logout)', () => {
        setup(true, false);
        fireEvent.click(screen.getByAltText('Test User').parentElement!);

        const logoutBtn = screen.getByText('Sign Out');
        fireEvent.click(logoutBtn);
        expect(mockLogout).toHaveBeenCalled();
    });

    it('cancels reset stats confirmation', () => {
        setup(true, false);
        fireEvent.click(screen.getByAltText('Test User').parentElement!);

        // Click Reset Stats
        fireEvent.click(screen.getByText('Reset Stats'));
        expect(screen.getByText('Reset solved count?')).toBeInTheDocument();

        // Cancel
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.queryByText('Reset solved count?')).not.toBeInTheDocument();
        expect(SyncService.resetStats).not.toHaveBeenCalled();
    });
});
