import { describe, it, expect, vi } from 'vitest';

// We need to mock axios BEFORE importing api
const mockInterceptorsUse = vi.fn();
vi.mock('axios', () => ({
    default: {
        create: () => ({
            get: vi.fn(),
            post: vi.fn(),
            interceptors: {
                request: { use: mockInterceptorsUse }
            }
        }),
        isAxiosError: (payload: unknown) => (payload as { isAxiosError?: boolean })?.isAxiosError
    }
}));

// Mock utils/auth
vi.mock('../../utils/auth', () => ({
    getAuthToken: vi.fn()
}));

describe('API Interceptors', () => {
    it('adds Authorization header correctly', async () => {
        const { getAuthToken } = await import('../../utils/auth');
        // Import api to trigger interceptor registration
        await import('../api');

        // Get the interceptor function from the mock
        expect(mockInterceptorsUse).toHaveBeenCalled();
        const interceptor = mockInterceptorsUse.mock.calls[0][0];

        // Case 1: Token exists
        vi.mocked(getAuthToken).mockReturnValue('fake-token');
        const config1 = { headers: {} as Record<string, string> };
        interceptor(config1);
        expect(config1.headers.Authorization).toBe('Bearer fake-token');

        // Case 2: No token
        // Case 2: No token
        vi.mocked(getAuthToken).mockReturnValue(null);
        const config2 = { headers: {} as Record<string, string> };
        interceptor(config2);
        expect(config2.headers.Authorization).toBeUndefined();
    });
});
