import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TutorChat from '../TutorChat';
import { TutorAPI } from '../../models/api';
import { act } from 'react';

// Mock dependencies
vi.mock('../../models/api', () => ({
    TutorAPI: {
        chat: vi.fn()
    }
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('TutorChat', () => {
    const defaultProps = {
        slug: 'two-sum',
        problemTitle: 'Two Sum',
        messages: [],
        setMessages: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders empty chat correctly', () => {
        render(<TutorChat {...defaultProps} />);
        expect(screen.getByPlaceholderText('Ask a question...')).toBeInTheDocument();
        // Disclaimer footer
        expect(screen.getByText(/AI can be inaccurate/i)).toBeInTheDocument();
    });

    it('renders messages', () => {
        const messages = [
            { role: 'user' as const, content: 'Hi bot' },
            { role: 'assistant' as const, content: 'Hello user' }
        ];
        render(<TutorChat {...defaultProps} messages={messages} />);
        expect(screen.getByText('Hi bot')).toBeInTheDocument();
        expect(screen.getByText('Hello user')).toBeInTheDocument();
    });

    it('sends message successfully', async () => {
        const setMessages = vi.fn();
        // Helper to simulate setMessages behavior for simple state updates
        let currentMessages: { role: 'user' | 'assistant'; content: string }[] = [];
        setMessages.mockImplementation((action) => {
            if (typeof action === 'function') {
                currentMessages = action(currentMessages);
            } else {
                currentMessages = action;
            }
        });

        const mockResponse = { response: 'Sure, I can help.' };
        (TutorAPI.chat as Mock).mockResolvedValue(mockResponse);

        render(<TutorChat {...defaultProps} setMessages={setMessages} />);

        const input = screen.getByPlaceholderText('Ask a question...');
        const button = screen.getByRole('button');

        fireEvent.change(input, { target: { value: 'How do I solve this?' } });
        expect(button).not.toBeDisabled();

        await act(async () => {
            fireEvent.click(button);
        });

        // Verify API call
        expect(TutorAPI.chat).toHaveBeenCalledWith('two-sum', 'How do I solve this?', []);

        // Verify optimistic update (user message) and response (bot)
        // Note: Logic in component calls setMessages(prev => ...) twice.
        // Once for user msg, once for response.
        expect(setMessages).toHaveBeenCalledTimes(2);
    });

    it('handles API error', async () => {
        const setMessages = vi.fn();
        const mockResponse = { error: 'Service Unavailable' };
        (TutorAPI.chat as Mock).mockResolvedValue(mockResponse);

        render(<TutorChat {...defaultProps} setMessages={setMessages} />);

        const input = screen.getByPlaceholderText('Ask a question...');
        fireEvent.change(input, { target: { value: 'Help' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button'));
        });

        expect(setMessages).toHaveBeenCalledTimes(2);
        // We can't easily check the content of the second call without a real state implementation mock,
        // but verifying it's called twice implies flow completion.
    });

    it('handles network throw', async () => {
        const setMessages = vi.fn();
        (TutorAPI.chat as Mock).mockRejectedValue(new Error('Network Fail'));

        render(<TutorChat {...defaultProps} setMessages={setMessages} />);

        const input = screen.getByPlaceholderText('Ask a question...');
        fireEvent.change(input, { target: { value: 'Help' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button'));
        });

        expect(setMessages).toHaveBeenCalledTimes(2); // User msg + Error msg
    });

    it('handles enter key', async () => {
        render(<TutorChat {...defaultProps} />);
        const input = screen.getByPlaceholderText('Ask a question...');
        fireEvent.change(input, { target: { value: 'Enter key test' } });

        // Mock handleSendMessage internal via spy? 
        // Easier to just check API call again.
        (TutorAPI.chat as Mock).mockResolvedValue({});

        await act(async () => {
            fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
        });

        expect(TutorAPI.chat).toHaveBeenCalled();
    });

    it('does not send empty message', async () => {
        render(<TutorChat {...defaultProps} />);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();

        await act(async () => {
            fireEvent.click(button);
        });

        expect(TutorAPI.chat).not.toHaveBeenCalled();
    });

    it('renders code blocks', () => {
        const messages = [
            { role: 'assistant' as const, content: 'Here is code:\n```python\nprint("hello")\n```' }
        ];
        // SyntaxHighlighter might be hard to test for specific class names without deep diving
        // But we expect the text content to be there.
        render(<TutorChat {...defaultProps} messages={messages} />);
        // Syntax highlighter splits text into spans, so getByText full string fails.
        // Check for presence of 'print' and 'hello' separately or use container query.
        expect(screen.getByText(/print/)).toBeInTheDocument();
        expect(screen.getByText(/"hello"/)).toBeInTheDocument();
    });

    it('handles Shift+Enter to add newline', () => {
        render(<TutorChat {...defaultProps} />);
        const input = screen.getByPlaceholderText('Ask a question...');
        fireEvent.change(input, { target: { value: 'Line 1' } });

        // Shift+Enter should not submit
        fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
        expect(TutorAPI.chat).not.toHaveBeenCalled();
    });

    it('disables input while loading', async () => {
        const setMessages = vi.fn();
        let resolveChat: (value: unknown) => void;
        (TutorAPI.chat as Mock).mockImplementation(() => new Promise(r => { resolveChat = r; }));

        render(<TutorChat {...defaultProps} setMessages={setMessages} />);
        const input = screen.getByPlaceholderText('Ask a question...');
        const button = screen.getByRole('button');

        fireEvent.change(input, { target: { value: 'Test loading' } });

        await act(async () => {
            fireEvent.click(button);
        });

        // Button should show loading state
        expect(button).toBeDisabled();

        // Complete the request
        await act(async () => {
            resolveChat!({ response: 'Done' });
        });
    });

    it('renders multiple message types', () => {
        const messages = [
            { role: 'user' as const, content: 'Question 1' },
            { role: 'assistant' as const, content: 'Answer 1' },
            { role: 'user' as const, content: 'Question 2' },
            { role: 'assistant' as const, content: 'Answer 2' }
        ];
        render(<TutorChat {...defaultProps} messages={messages} />);
        expect(screen.getByText('Question 1')).toBeInTheDocument();
        expect(screen.getByText('Answer 1')).toBeInTheDocument();
        expect(screen.getByText('Question 2')).toBeInTheDocument();
        expect(screen.getByText('Answer 2')).toBeInTheDocument();
    });

    it('prevents sending while already loading', async () => {
        const setMessages = vi.fn();
        let resolveChat: (value: unknown) => void;
        (TutorAPI.chat as Mock).mockImplementation(() => new Promise(r => { resolveChat = r; }));

        render(<TutorChat {...defaultProps} setMessages={setMessages} />);
        const input = screen.getByPlaceholderText('Ask a question...');
        const button = screen.getByRole('button');

        fireEvent.change(input, { target: { value: 'First message' } });

        // Start first request
        await act(async () => {
            fireEvent.click(button);
        });

        // Try to send another while loading
        fireEvent.change(input, { target: { value: 'Second message' } });
        await act(async () => {
            fireEvent.click(button);
        });

        // Should only have called once (first message)
        expect(TutorAPI.chat).toHaveBeenCalledTimes(1);

        await act(async () => {
            resolveChat!({ response: 'Done' });
        });
    });

    it('renders code block without language specifier', () => {
        const messages = [
            { role: 'assistant' as const, content: 'Code:\n```\nsome code here\n```' }
        ];
        render(<TutorChat {...defaultProps} messages={messages} />);
        // Should render the code even without language
        expect(screen.getByText(/some code here/)).toBeInTheDocument();
    });

    it('handles response with error message', async () => {
        const setMessages = vi.fn();
        // API returns error in response object
        (TutorAPI.chat as Mock).mockResolvedValue({ error: 'Rate limit exceeded' });

        render(<TutorChat {...defaultProps} setMessages={setMessages} />);
        const input = screen.getByPlaceholderText('Ask a question...');

        fireEvent.change(input, { target: { value: 'Test error' } });
        await act(async () => {
            fireEvent.click(screen.getByRole('button'));
        });

        // setMessages should be called twice (user msg + error msg)
        expect(setMessages).toHaveBeenCalledTimes(2);
    });
});
