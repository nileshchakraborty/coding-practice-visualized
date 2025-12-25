import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ProblemPage from '../../components/ProblemPage';
import { BrowserRouter } from 'react-router-dom';
import { SolutionsAPI } from '../../models/api';
// Use explicit mocks for hooks to allow per-test overrides
import { useAuth } from '../../hooks/useAuth';
import { useProgress } from '../../hooks/useProgress';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ slug: 'two-sum' }),
        useNavigate: () => mockNavigate,
    };
});

// Mock hooks
vi.mock('../../hooks/useAuth', () => ({
    useAuth: vi.fn()
}));

vi.mock('../../hooks/useProgress', () => ({
    useProgress: vi.fn()
}));

vi.mock('../../context/useSettings', () => ({
    useSettings: () => ({ settings: { vimMode: false } })
}));

// Mock API
vi.mock('../../models/api', () => ({
    SolutionsAPI: {
        getBySlug: vi.fn()
    },
    TutorAPI: {
        chat: vi.fn()
    }
    // PlaygroundAPI might be imported by sub-components or solution modal
}));

// Mock sub-component
vi.mock('../../components/SolutionModal', () => ({
    default: ({ problemStatus }: { problemStatus?: string | null }) => <div data-testid="solution-modal">Solution Modal {problemStatus}</div>
}));

describe('ProblemPage', () => {
    // Default mock implementations
    const mockMarkAttempted = vi.fn();
    const mockIsSolved = vi.fn().mockReturnValue(false);
    const mockIsAttempted = vi.fn().mockReturnValue(false);

    beforeEach(() => {
        vi.clearAllMocks();

        // Default Auth: Authenticated
        (useAuth as Mock).mockReturnValue({
            user: { name: 'Test User' },
            isAuthenticated: true
        });

        // Default Progress
        (useProgress as Mock).mockReturnValue({
            isSolved: mockIsSolved,
            isAttempted: mockIsAttempted,
            markAttempted: mockMarkAttempted,
        });

        // Default API: Success
        (SolutionsAPI.getBySlug as Mock).mockResolvedValue({
            slug: 'two-sum',
            title: 'Two Sum',
            problemStatement: 'Statement',
            examples: [],
            constraints: []
        });
    });

    it('renders loading state initially', () => {
        // Delay resolution
        (SolutionsAPI.getBySlug as Mock).mockReturnValue(new Promise(() => { }));
        render(
            <BrowserRouter>
                <ProblemPage />
            </BrowserRouter>
        );
        expect(screen.getByText('Loading problem...')).toBeInTheDocument();
    });

    it('renders problem page (SolutionModal) on success', async () => {
        render(
            <BrowserRouter>
                <ProblemPage />
            </BrowserRouter>
        );
        await waitFor(() => {
            expect(screen.getByTestId('solution-modal')).toBeInTheDocument();
        });

        // Check markAttempted called if authenticated
        expect(mockMarkAttempted).toHaveBeenCalledWith('two-sum');
    });

    it('handles problem not found (null data)', async () => {
        (SolutionsAPI.getBySlug as Mock).mockResolvedValue(null);

        render(
            <BrowserRouter>
                <ProblemPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Problem not found')).toBeInTheDocument();
        });
        expect(screen.getByText('Go Back')).toBeInTheDocument();
    });

    it('handles API error', async () => {
        (SolutionsAPI.getBySlug as Mock).mockRejectedValue(new Error('API Fail'));

        render(
            <BrowserRouter>
                <ProblemPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Failed to load problem')).toBeInTheDocument();
        });
    });

    it('navigates back on error button click', async () => {
        (SolutionsAPI.getBySlug as Mock).mockResolvedValue(null);
        render(
            <BrowserRouter>
                <ProblemPage />
            </BrowserRouter>
        );
        await waitFor(() => expect(screen.getByText('Go Back')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Go Back'));
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('does not mark attempted if unauthenticated', async () => {
        (useAuth as Mock).mockReturnValue({ isAuthenticated: false });

        render(
            <BrowserRouter>
                <ProblemPage />
            </BrowserRouter>
        );
        await waitFor(() => screen.getByTestId('solution-modal'));

        expect(mockMarkAttempted).not.toHaveBeenCalled();
    });

    it('computes status: solved', async () => {
        mockIsSolved.mockReturnValue(true);
        render(
            <BrowserRouter>
                <ProblemPage />
            </BrowserRouter>
        );
        await waitFor(() => {
            expect(screen.getByTestId('solution-modal')).toHaveTextContent('Solution Modal solved');
        });
    });

    it('computes status: in-progress', async () => {
        mockIsSolved.mockReturnValue(false);
        mockIsAttempted.mockReturnValue(true);
        render(
            <BrowserRouter>
                <ProblemPage />
            </BrowserRouter>
        );
        await waitFor(() => {
            expect(screen.getByTestId('solution-modal')).toHaveTextContent('Solution Modal in-progress');
        });
    });
});
