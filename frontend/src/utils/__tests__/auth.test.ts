import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAuthToken, TOKEN_KEY, USER_KEY } from '../auth';

describe('auth utils', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('getAuthToken returns null when no token stored', () => {
        expect(getAuthToken()).toBeNull();
    });

    it('getAuthToken returns token when stored', () => {
        localStorage.setItem(TOKEN_KEY, 'test-token-123');
        expect(getAuthToken()).toBe('test-token-123');
    });

    it('exports TOKEN_KEY constant', () => {
        expect(TOKEN_KEY).toBe('codenium_auth_token');
    });

    it('exports USER_KEY constant', () => {
        expect(USER_KEY).toBe('codenium_user');
    });
});
