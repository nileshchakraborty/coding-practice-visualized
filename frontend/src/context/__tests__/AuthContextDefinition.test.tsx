import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth, AuthContext } from '../AuthContextDefinition';
import React from 'react';

describe('useAuth', () => {
    it('throws error when used outside AuthProvider', () => {
        // Suppress console.error since React logs errors when they happen in render
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');

        consoleSpy.mockRestore();
    });

    it('returns context data when used within AuthProvider', () => {
        const mockContext = {
            user: { name: 'Test User', email: 'test@example.com', picture: '', sub: '123' },
            isAuthenticated: true,
            accessToken: 'token',
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        };

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthContext.Provider value={mockContext}>
                {children}
            </AuthContext.Provider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });
        expect(result.current).toEqual(mockContext);
    });
});
