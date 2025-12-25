import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import SmartVisualizer from '../SmartVisualizer';
import type { Solution } from '../../types';

vi.mock('../visualizers', () => ({
    TreeVisualizer: () => <div data-testid="tree-viz">TreeVisualizer</div>,
    LinkedListVisualizer: () => <div data-testid="list-viz">LinkedListVisualizer</div>,
    MatrixVisualizer: () => <div data-testid="matrix-viz">MatrixVisualizer</div>,
    GraphVisualizer: () => <div data-testid="graph-viz">GraphVisualizer</div>
}));

// Mock framer-motion
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual,
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        motion: {
            div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
            span: ({ children, ...props }: React.ComponentProps<'span'>) => <span {...props}>{children}</span>,
            line: (props: React.SVGProps<SVGLineElement>) => <line data-testid="motion-line" {...props} />,
            circle: (props: React.SVGProps<SVGCircleElement>) => <circle data-testid="motion-circle" {...props} />
        }
    };
});

// Mock HTMLElement.scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.scrollTo = vi.fn();

describe('SmartVisualizer', () => {
    const mockSolution = {
        id: '1',
        slug: 'two-sum',
        title: 'Two Sum',
        difficulty: 'Easy',
        category: 'Array',
        problemStatement: '...',
        initialState: [2, 7, 11, 15],
        visualizationType: 'array',
        steps: [
            { arrayState: [2, 7, 11, 15], indices: [0], description: 'Check 2' },
            { arrayState: [2, 7, 11, 15], indices: [0, 1], description: 'Found 9', color: 'success' }
        ]
    };

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('renders initial state', () => {
        const { container } = render(<SmartVisualizer solution={mockSolution as unknown as Solution} />);
        const items = container.querySelectorAll('[data-array-idx]');
        expect(items).toHaveLength(4);
        expect(screen.getByText('Step')).toBeInTheDocument();
    });

    it('navigates next and prev', async () => {
        render(<SmartVisualizer solution={mockSolution as unknown as Solution} />);
        const buttons = screen.getAllByRole('button');
        const prevBtn = buttons[1];
        const nextBtn = buttons[3];

        fireEvent.click(nextBtn);
        await act(async () => { });
        expect(screen.getByText(/Check 2/i)).toBeInTheDocument();

        fireEvent.click(nextBtn);
        await act(async () => { });
        expect(screen.getByText(/Found 9/i)).toBeInTheDocument();

        fireEvent.click(prevBtn);
        await act(async () => { });
        expect(screen.getByText(/Check 2/i)).toBeInTheDocument();
    });

    it('replays animation', async () => {
        render(<SmartVisualizer solution={mockSolution as unknown as Solution} />);
        const buttons = screen.getAllByRole('button');
        const replayBtn = buttons[0];
        const nextBtn = buttons[3];

        fireEvent.click(nextBtn);
        await act(async () => { });

        fireEvent.click(replayBtn);
        await act(async () => { });
        expect(screen.queryByText(/Check 2/i)).not.toBeInTheDocument();
    });

    it('auto plays animation and handles pause', async () => {
        render(<SmartVisualizer solution={mockSolution as unknown as Solution} />);
        const playBtn = screen.getAllByRole('button')[2];

        await act(async () => {
            fireEvent.click(playBtn);
        });

        await act(async () => {
            vi.advanceTimersByTime(1100);
        });
        expect(screen.getByText(/Check 2/i)).toBeInTheDocument();

        // Pause
        await act(async () => {
            fireEvent.click(playBtn);
        });

        await act(async () => {
            vi.advanceTimersByTime(5000);
        });
        // Should STILL be at Check 2
        expect(screen.getByText(/Check 2/i)).toBeInTheDocument();
    });

    it('changes speed', async () => {
        render(<SmartVisualizer solution={mockSolution as unknown as Solution} />);
        const speed2x = screen.getByText('2x');

        await act(async () => {
            fireEvent.click(speed2x);
        });

        const playBtn = screen.getAllByRole('button')[2];
        await act(async () => {
            fireEvent.click(playBtn);
        });

        await act(async () => {
            vi.advanceTimersByTime(600);
        });
        expect(screen.getByText(/Check 2/i)).toBeInTheDocument();
    });

    it('supports visualizer types (calling internal builders)', () => {
        // Tree with nulls to test buildTreeFromArray branches
        const treeSol = {
            ...mockSolution,
            visualizationType: 'tree',
            initialState: [1, null, 2, 3]
        };
        const { unmount: u1 } = render(<SmartVisualizer solution={treeSol as unknown as Solution} />);
        expect(screen.getByTestId('tree-viz')).toBeInTheDocument();
        u1();

        const listSol = { ...mockSolution, visualizationType: 'linkedlist' };
        const { unmount: u2 } = render(<SmartVisualizer solution={listSol as unknown as Solution} />);
        expect(screen.getByTestId('list-viz')).toBeInTheDocument();
        u2();

        const matrixSol = { ...mockSolution, visualizationType: 'matrix' };
        const { unmount: u3 } = render(<SmartVisualizer solution={matrixSol as unknown as Solution} />);
        expect(screen.getByTestId('matrix-viz')).toBeInTheDocument();
        u3();

        const graphSol = { ...mockSolution, visualizationType: 'graph' };
        const { unmount: u4 } = render(<SmartVisualizer solution={graphSol as unknown as Solution} />);
        expect(screen.getByTestId('graph-viz')).toBeInTheDocument();
        u4();
    });

    it('handles legacy visual field parsing', async () => {
        const legacySol = {
            ...mockSolution,
            steps: [{ visual: 'nums: [99, 88]', description: 'legacy' }]
        };
        render(<SmartVisualizer solution={legacySol as unknown as Solution} />);
        const nextBtn = screen.getAllByRole('button')[3];
        fireEvent.click(nextBtn);
        await act(async () => { });

        // Should parse [99, 88] and render 99
        // Wait, parse logic checks definition equality?
        // Logic: if parsed matches length of initialState.
        // initialState [2,7,11,15] (len 4).
        // [99, 88] (len 2). Won't trigger.
        // Must match length.

        const legacySolMatching = {
            ...mockSolution,
            steps: [{ visual: 'nums: [1, 2, 3, 4]', description: 'legacy' }]
        };
        const { unmount } = render(<SmartVisualizer solution={legacySolMatching as unknown as Solution} />);
        const nextBtn2 = screen.getAllByRole('button')[3];
        fireEvent.click(nextBtn2);
        await act(async () => { });

        expect(screen.getAllByText('1')[0]).toBeInTheDocument();
        unmount();
    });

    it('handles keyboard shortcuts', async () => {
        render(<SmartVisualizer solution={mockSolution as unknown as Solution} />);

        // ArrowRight -> Next
        fireEvent.keyDown(window, { code: 'ArrowRight' });
        await act(async () => { });
        expect(screen.getByText(/Check 2/i)).toBeInTheDocument();

        // ArrowLeft -> Prev
        fireEvent.keyDown(window, { code: 'ArrowLeft' });
        await act(async () => { }); // Back to 0
        expect(screen.queryByText(/Check 2/i)).not.toBeInTheDocument();

        // Space -> Play
        fireEvent.keyDown(window, { code: 'Space' });
        await act(async () => {
            vi.advanceTimersByTime(1100);
        });
        expect(screen.getByText(/Check 2/i)).toBeInTheDocument();

        // KeyR -> Replay (Reset)
        fireEvent.keyDown(window, { code: 'KeyR' });
        await act(async () => { });
        expect(screen.queryByText(/Check 2/i)).not.toBeInTheDocument();
    });

    it('ignores keyboard in inputs', () => {
        render(
            <div>
                <input data-testid="input" />
                <SmartVisualizer solution={mockSolution as unknown as Solution} />
            </div>
        );
        const input = screen.getByTestId('input');
        input.focus(); // Emulate focus usually works with fireEvent on element

        fireEvent.keyDown(input, { code: 'ArrowRight' });
        // Should NOT advance
        expect(screen.queryByText(/Check 2/i)).not.toBeInTheDocument();
    });

    it('handles scrubber click', async () => {
        render(<SmartVisualizer solution={mockSolution as unknown as Solution} />);
        const scrubber = screen.getByTitle('Click to seek');

        // Mock getBoundingClientRect
        scrubber.getBoundingClientRect = () => ({
            left: 0, top: 0, width: 100, height: 10, bottom: 10, right: 100, x: 0, y: 0, toJSON: () => { }
        });

        // Click at 50% (x=50) -> step 1 (of 2)
        fireEvent.click(scrubber, { clientX: 50 });
        await act(async () => { });

        expect(screen.getByText(/Check 2/i)).toBeInTheDocument();
    });
});
