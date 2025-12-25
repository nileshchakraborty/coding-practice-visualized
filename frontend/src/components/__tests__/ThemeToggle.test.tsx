import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';
import * as useThemeHook from '../../context/useTheme';

// Mock useTheme hook
vi.mock('../../context/useTheme', () => ({
    useTheme: vi.fn(),
}));

describe('ThemeToggle', () => {
    const mockToggleTheme = vi.fn();
    const mockSetTheme = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders toggle button in light mode', () => {
        vi.mocked(useThemeHook.useTheme).mockReturnValue({
            theme: 'light',
            toggleTheme: mockToggleTheme,
            setTheme: mockSetTheme,
        });

        render(<ThemeToggle />);
        expect(screen.getByRole('button')).toBeInTheDocument();
        // Should show moon icon in light mode
        expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
    });

    it('renders toggle button in dark mode', () => {
        vi.mocked(useThemeHook.useTheme).mockReturnValue({
            theme: 'dark',
            toggleTheme: mockToggleTheme,
            setTheme: mockSetTheme,
        });

        render(<ThemeToggle />);
        expect(screen.getByRole('button')).toBeInTheDocument();
        // Should show sun icon in dark mode
        expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
    });

    it('calls toggleTheme on click', () => {
        vi.mocked(useThemeHook.useTheme).mockReturnValue({
            theme: 'light',
            toggleTheme: mockToggleTheme,
            setTheme: mockSetTheme,
        });

        render(<ThemeToggle />);
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(mockToggleTheme).toHaveBeenCalled();
    });
});
