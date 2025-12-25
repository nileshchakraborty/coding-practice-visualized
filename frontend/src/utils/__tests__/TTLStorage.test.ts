import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TTLStorage, TTL } from '../TTLStorage';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        key: vi.fn((i: number) => Object.keys(store)[i] || null),
        get length() {
            return Object.keys(store).length;
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('TTLStorage', () => {
    let storage: TTLStorage;
    const PREFIX = 'test_';

    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
        storage = new TTLStorage(PREFIX);
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('sets item correctly', () => {
        storage.set('key', 'value');
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            expect.stringContaining(PREFIX + 'key'),
            expect.stringContaining('value')
        );
    });

    it('gets item correctly if not expired', () => {
        storage.set('key', 'value');
        const retrieved = storage.get('key');
        expect(retrieved).toBe('value');
    });

    it('returns null if item expired', () => {
        storage.set('key', 'value', TTL.MINUTE);
        vi.advanceTimersByTime(TTL.MINUTE + 1);
        const retrieved = storage.get('key');
        expect(retrieved).toBeNull();
    });

    it('removes item if expired on get', () => {
        storage.set('key', 'value', TTL.MINUTE);
        vi.advanceTimersByTime(TTL.MINUTE + 1);
        storage.get('key');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith(PREFIX + 'key');
    });

    it('cleanup removes expired items', () => {
        storage.set('valid', 'value', TTL.HOUR);
        storage.set('expired', 'value', TTL.MINUTE);

        vi.advanceTimersByTime(TTL.MINUTE + 1);

        const cleaned = storage.cleanup();
        expect(cleaned).toBe(1);
        expect(storage.get('valid')).toBe('value');
        expect(storage.get('expired')).toBeNull();
    });

    it('touch updates timestamp', () => {
        storage.set('key', 'value', TTL.MINUTE);
        vi.advanceTimersByTime(TTL.MINUTE / 2);

        const success = storage.touch('key');
        expect(success).toBe(true);

        // Should be valid for another minute from now
        vi.advanceTimersByTime(TTL.MINUTE / 2 + 100);
        // Total time elapsed: Minute + 100ms. 
        // Without touch, it would benefit expired. With touch, it has ~Half minute left.

        expect(storage.get('key')).toBe('value');
    });

    it('touch supports updates with new TTL', () => {
        storage.set('key', 'value', TTL.MINUTE);
        const success = storage.touch('key', TTL.HOUR);
        expect(success).toBe(true);
        expect(storage.getRemainingTTL('key')).toBeGreaterThan(TTL.MINUTE);
    });

    it('has checks existence and expiration', () => {
        storage.set('valid', 'val');
        expect(storage.has('valid')).toBe(true);
        expect(storage.has('missing')).toBe(false);

        storage.set('expired', 'val', TTL.MINUTE);
        vi.advanceTimersByTime(TTL.MINUTE + 1);
        expect(storage.has('expired')).toBe(false); // get() returns null
    });

    it('getRemainingTTL returns correct values', () => {
        storage.set('key', 'value', 1000);
        expect(storage.getRemainingTTL('key')).toBeGreaterThan(900);

        vi.advanceTimersByTime(1500);
        expect(storage.getRemainingTTL('key')).toBe(0); // Expired
        expect(storage.getRemainingTTL('missing')).toBe(0);
    });

    // --- Error Handling & Branches ---

    it('handles JSON parse error in get', () => {
        localStorageMock.setItem(PREFIX + 'corrupt', '{invalid');
        expect(storage.get('corrupt')).toBeNull();
    });

    it('handles JSON parse error in getRemainingTTL', () => {
        localStorageMock.setItem(PREFIX + 'corrupt', '{invalid');
        expect(storage.getRemainingTTL('corrupt')).toBe(0);
    });

    it('handles localStorage errors in set', () => {
        vi.spyOn(localStorageMock, 'setItem').mockImplementationOnce(() => {
            throw new Error('Quota exceeded');
        });
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        storage.set('key', 'value');
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('touch returns false if item missing (or expired and removed by get)', () => {
        expect(storage.touch('missing')).toBe(false);
    });

    it('touch returns false if raw item missing from storage but get passed (race condition simulation)', () => {
        // Mock get to return value, but then getItem for raw to return null
        // This is hard to simulate with current implementation because get calls getItem.
        // If we manually manipulate store?
        storage.set('key', 'val');

        // We can spy on localStorage.getItem to return valid first (for this.get)
        // and null second (for this.touch raw check).

        vi.spyOn(localStorageMock, 'getItem')
            .mockReturnValueOnce(JSON.stringify({ value: 'val', timestamp: Date.now(), ttl: 1000 })) // For this.get
            .mockReturnValueOnce(null); // For raw check in touch

        expect(storage.touch('key')).toBe(false);
    });

    it('touch handles parse error', () => {
        storage.set('key', 'val');
        vi.spyOn(localStorageMock, 'getItem')
            .mockReturnValueOnce(JSON.stringify({ value: 'val', timestamp: Date.now(), ttl: 1000 })) // For this.get
            // Return valid raw but fail JSON.parse inside try block? 
            // JSON.parse is called on raw.
            // If raw is valid string, JSON.parse works.
            // To make JSON.parse fail in touch block:
            // raw must be "{invalid".
            .mockReturnValueOnce('{invalid');

        expect(storage.touch('key')).toBe(false);
    });

    it('cleanup handles parse errors and skips non-prefix items', () => {
        localStorageMock.setItem(PREFIX + 'corrupt', '{invalid');
        localStorageMock.setItem('other_prefix_key', JSON.stringify({ value: 'v', timestamp: 0, ttl: 100 })); // Should be ignored

        const cleaned = storage.cleanup();
        // Corrupt item might trigger catch block and be skipped aka not counted as cleaned
        expect(cleaned).toBe(0);
        // And other prefix key remains
        expect(localStorageMock.getItem('other_prefix_key')).not.toBeNull();
    });
});
