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
});
