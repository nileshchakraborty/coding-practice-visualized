import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthUnlockModal } from '../AuthUnlockModal';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({ login: vi.fn(), isAuthenticated: false })
}));

describe('AuthUnlockModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        featureName: 'AI Tutor',
        onLogin: vi.fn()
    };

    it('renders correctly', () => {
        render(
            <BrowserRouter>
                <AuthUnlockModal {...defaultProps} />
            </BrowserRouter>
        );
        expect(screen.getByRole('heading', { name: /Unlock/i })).toBeInTheDocument();
        expect(screen.getByText(/Unlimited Code Execution/i)).toBeInTheDocument();
        expect(screen.getByText(/Personalized AI Tutor Assistance/i)).toBeInTheDocument();
        expect(screen.getByText(/Sign In with Google/i)).toBeInTheDocument();
    });

    it('does not render if not open', () => {
        render(
            <BrowserRouter>
                <AuthUnlockModal {...defaultProps} isOpen={false} />
            </BrowserRouter>
        );
        expect(screen.queryByRole('heading', { name: /Unlock/i })).not.toBeInTheDocument();
    });
});
