import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTutor } from '../useTutor';
import { TutorAPI } from '../../models';

// Mock TutorAPI
vi.mock('../../models', () => ({
    TutorAPI: {
        chat: vi.fn(),
    },
}));

describe('useTutor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes with default state', () => {
        const { result } = renderHook(() => useTutor('two-sum'));
        expect(result.current.messages).toEqual([]);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.hasMessages).toBe(false);
        expect(result.current.lastMessage).toBeNull();
    });

    it('does not send message if slug or content is missing', async () => {
        const { result } = renderHook(() => useTutor(null)); // Null slug

        await act(async () => {
            await result.current.sendMessage('Hi');
        });
        expect(result.current.messages).toEqual([]); // No message added
        expect(TutorAPI.chat).not.toHaveBeenCalled();

        const { result: result2 } = renderHook(() => useTutor('two-sum'));
        await act(async () => {
            await result2.current.sendMessage(''); // Empty content
        });
        expect(result2.current.messages).toEqual([]);
    });

    it('sends message successfully and updates derived state', async () => {
        const mockResponse = { response: 'Hello user' };
        vi.mocked(TutorAPI.chat).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useTutor('two-sum'));

        await act(async () => {
            await result.current.sendMessage('Hi');
        });

        expect(result.current.messages).toHaveLength(2); // User + Assistant
        expect(result.current.messages[0]).toEqual({ role: 'user', content: 'Hi' });
        expect(result.current.messages[1]).toEqual({ role: 'assistant', content: 'Hello user' });

        expect(result.current.hasMessages).toBe(true);
        expect(result.current.lastMessage).toEqual({ role: 'assistant', content: 'Hello user' });

        expect(result.current.isLoading).toBe(false);
    });

    it('handles API error response object', async () => {
        vi.mocked(TutorAPI.chat).mockResolvedValue({ error: 'API Error', response: '' });

        const { result } = renderHook(() => useTutor('two-sum'));

        await act(async () => {
            await result.current.sendMessage('Hi');
        });

        // User message added
        expect(result.current.messages).toHaveLength(1);
        expect(result.current.error).toBe('API Error');
        expect(result.current.isLoading).toBe(false);
    });

    it('handles network throw error', async () => {
        vi.mocked(TutorAPI.chat).mockRejectedValue(new Error('Network Failed'));

        const { result } = renderHook(() => useTutor('two-sum'));

        await act(async () => {
            await result.current.sendMessage('Hi');
        });

        expect(result.current.error).toBe('Network Failed');
        expect(result.current.isLoading).toBe(false);
    });

    it('handles non-Error throw', async () => {
        vi.mocked(TutorAPI.chat).mockRejectedValue('String Error');

        const { result } = renderHook(() => useTutor('two-sum'));

        await act(async () => {
            await result.current.sendMessage('Hi');
        });

        expect(result.current.error).toBe('Failed to send message');
    });

    it('clears chat', async () => {
        const { result } = renderHook(() => useTutor('two-sum'));

        // Manually add message via sendMessage just to populate state
        vi.mocked(TutorAPI.chat).mockResolvedValue({ response: 'ok' });
        await act(async () => {
            await result.current.sendMessage('test');
        });
        expect(result.current.messages).toHaveLength(2);

        act(() => {
            result.current.clearChat();
        });

        expect(result.current.messages).toEqual([]);
        expect(result.current.error).toBeNull();
    });

    it('handles response with no content (no error but empty response)', async () => {
        // API returns success but with null/undefined/empty response
        vi.mocked(TutorAPI.chat).mockResolvedValue({ response: '' });

        const { result } = renderHook(() => useTutor('two-sum'));

        await act(async () => {
            await result.current.sendMessage('Hi');
        });

        // User message added but no assistant message since response was empty
        expect(result.current.messages).toHaveLength(1);
        expect(result.current.messages[0]).toEqual({ role: 'user', content: 'Hi' });
        expect(result.current.error).toBeNull();
    });
});
