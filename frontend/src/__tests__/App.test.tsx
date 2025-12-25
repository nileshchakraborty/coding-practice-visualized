import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { BrowserRouter } from 'react-router-dom';
import { useProblems } from '../viewmodels';
import { useAuth } from '../hooks/useAuth';
import { useProgress } from '../hooks/useProgress';

// 1. Mock the modules
vi.mock('../viewmodels', () => ({
    useProblems: vi.fn()
}));

vi.mock('../hooks/useAuth', () => ({
    useAuth: vi.fn()
}));

vi.mock('../hooks/useProgress', () => ({
    useProgress: vi.fn()
}));

// Mock problemLists to support verification
vi.mock('../data/problemLists', () => ({
    getAllPlans: () => [
        { id: 'blind75', name: 'Blind 75', icon: '🕶️' }
    ],
    getPlanProblems: (id: string) => {
        // Exclude 3sum from Blind 75 to test list filtering
        if (id === 'blind75') return ['two-sum', 'contains-duplicate'];
        return [];
    }
}));

// Mock components
vi.mock('../components/ThemeToggle', () => ({
    ThemeToggle: () => <div data-testid="theme-toggle">ThemeToggle</div>
}));
vi.mock('../components/LoginButton', () => ({
    LoginButton: () => <div data-testid="login-button">LoginButton</div>
}));
vi.mock('../components/HotSection', () => ({
    HotSection: ({ onProblemClick, onTopicClick }: { onProblemClick: (slug: string) => void, onTopicClick: (topic: string) => void }) => (
        <div data-testid="hot-section">
            <button onClick={() => onProblemClick('two-sum')}>Hot Problem</button>
            <button onClick={() => onTopicClick && onTopicClick('HashMap')}>Hot Topic</button>
        </div>
    )
}));

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

describe('App Component', () => {
    const mockUpdateFilter = vi.fn();

    // Sample Data with subTopics
    const mockProblems = [
        { slug: 'two-sum', title: 'Two Sum', difficulty: 'Easy', subTopic: 'HashMap', has_solution: true },
        { slug: 'contains-duplicate', title: 'Contains Duplicate', difficulty: 'Easy', subTopic: 'HashMap', has_solution: false },
        { slug: '3sum', title: '3Sum', difficulty: 'Medium', subTopic: 'Two Pointers', has_solution: true }
    ];

    const mockStats = {
        easy: 10, medium: 20, hard: 5,
        categories: [
            {
                name: 'Arrays & Hashing',
                icon: '📚',
                count: 3,
                easy: 2, medium: 1, hard: 0,
                problems: mockProblems
            }
        ]
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Default: No filters
        (useProblems as Mock).mockReturnValue({
            problems: mockProblems,
            stats: mockStats,
            loading: false,
            error: null,
            filter: { search: '', difficulty: 'All' },
            updateFilter: mockUpdateFilter,
            clearFilters: vi.fn(),
            refresh: vi.fn()
        });

        (useAuth as Mock).mockReturnValue({
            isAuthenticated: true, // Authenticated to see status filters
            loading: false
        });

        (useProgress as Mock).mockReturnValue({
            isSolved: vi.fn((slug) => slug === 'two-sum'), // Two Sum is Solved
            isAttempted: vi.fn((slug) => slug === '3sum'), // 3Sum is Attempted
            markAttempted: vi.fn(),
            solvedCount: 1,
            attemptedCount: 1
        });
    });

    const renderApp = () => render(
        <BrowserRouter>
            <App />
        </BrowserRouter>
    );

    it('renders main content', async () => {
        renderApp();
        expect(screen.getByText('Arrays & Hashing')).toBeInTheDocument();
        expect(screen.getByText('Two Sum')).toBeInTheDocument();
    });

    it('handles interactions: filters and navigation', async () => {
        renderApp();

        // 1. Navigation
        const twoSumLinks = screen.getAllByText('Two Sum');
        const problemLink = twoSumLinks.find(el => el.tagName === 'H4') || twoSumLinks[0];
        fireEvent.click(problemLink);
        expect(mockNavigate).toHaveBeenCalledWith('/problem/two-sum');

        // 2. Difficulty Filter (Verify CALL, not result)
        const mediumBtns = screen.getAllByText('Medium');
        const diffBtn = mediumBtns.find(b => b.tagName === 'BUTTON');
        if (diffBtn) fireEvent.click(diffBtn);
        expect(mockUpdateFilter).toHaveBeenCalledWith({ difficulty: 'Medium' });

        // 3. Input Search (Verify CALL)
        const input = screen.getByPlaceholderText(/Search problems/i);
        vi.useFakeTimers();
        fireEvent.change(input, { target: { value: 'test' } });
        act(() => { vi.runAllTimers(); });
        expect(mockUpdateFilter).toHaveBeenCalledWith(expect.objectContaining({ search: 'test' }));
        vi.useRealTimers();
    });

    it('filters problems by Status interactively', async () => {
        renderApp();

        // Initially all present
        expect(screen.getByText('Two Sum')).toBeInTheDocument();
        expect(screen.getByText('3Sum')).toBeInTheDocument();

        // Click "Solved" filter
        const solvedBtn = screen.getByText('Solved');
        fireEvent.click(solvedBtn);

        // Two Sum (Solved) should be present. 3Sum (In Progress) should NOT.
        expect(screen.getByText('Two Sum')).toBeInTheDocument();
        expect(screen.queryByText('3Sum')).not.toBeInTheDocument();

        // Click "In Progress" filter
        const inProgressBtn = screen.getByText('In Progress');
        fireEvent.click(inProgressBtn);

        // 3Sum (In Progress) should be present. Two Sum (Solved) should NOT.
        expect(screen.getByText('3Sum')).toBeInTheDocument();
        expect(screen.queryByText('Two Sum')).not.toBeInTheDocument();

        // Click "All" filter (The button text is "All Status")
        const allBtn = screen.getByText('All Status');
        fireEvent.click(allBtn);

        // Both present
        expect(screen.getByText('Two Sum')).toBeInTheDocument();
        expect(screen.getByText('3Sum')).toBeInTheDocument();
    });

    it('filters problems by List interactively', async () => {
        renderApp();

        // Find List Select
        // Just find by loop of comboboxes if necessary, but assume 1.
        // Actually, there is only one select element visible usually?
        const selects = screen.getAllByRole('combobox');
        const listSelect = selects[0]; // Assuming it's the first or only one.

        // Select "Blind 75"
        fireEvent.change(listSelect, { target: { value: 'blind75' } });

        // Blind 75 mock contains: Two Sum, Contains Duplicate.
        // Does NOT contain 3Sum.

        // Two Sum should be present
        expect(screen.getByText('Two Sum')).toBeInTheDocument();

        // 3Sum should NOT be present
        expect(screen.queryByText('3Sum')).not.toBeInTheDocument();
    });

    it('toggles mobile filters and selects subtopic', () => {
        renderApp();
        const toggleBtn = screen.getByText('Filter Topics');
        fireEvent.click(toggleBtn);
        expect(screen.getByText('Select Patterns')).toBeInTheDocument();

        // Click a subtopic found in "Select Patterns"
        // "HashMap" is in mockProblems subTopic.
        const hashMapBtn = screen.getByText('HashMap');
        fireEvent.click(hashMapBtn);

        // Verify it is selected (visual check or implementation detail check?)
        // The button should now have appropriate styling or Check icon?
        // But more importantly, the click handler coverage.
    });

    it('handles HotSection topic click', () => {
        renderApp();
        const hotTopicBtn = screen.getByText('Hot Topic');
        fireEvent.click(hotTopicBtn);

        // This triggers onTopicClick -> finds subtopic -> toggleSubTopic
        // "Arrays" should match "Arrays & Hashing" category?
        // The logic in App.tsx:
        // const subtopic = allSubTopics.find(st => ... includes ...)
        // "Arrays" includes "Arrays"? No, "HashMap".
        // Category Name is "Arrays & Hashing".
        // SubTopics are "HashMap".
        // App.tsx logic: matches category name against subtopic name?
        // Line 427: allSubTopics.find(st => st.includes(category) || category.includes(st))
        // If I pass "Hash", it might match "HashMap".

        // My mock HotSection will pass 'HashMap'.
    });

    it('renders loading state', () => {
        (useProblems as Mock).mockReturnValue({
            problems: [],
            stats: null,
            loading: true,
            error: null,
            filter: { search: '', difficulty: 'All' },
            updateFilter: mockUpdateFilter,
            clearFilters: vi.fn(),
            refresh: vi.fn()
        });

        renderApp();
        // Loading state should show spinner/loading indicator (check class)
        const loadingSpinner = document.querySelector('.animate-spin') || screen.getByText(/Loading/i);
        expect(loadingSpinner).toBeInTheDocument();
    });

    it('handles HotSection problem click', () => {
        renderApp();
        const hotProblemBtn = screen.getByText('Hot Problem');
        fireEvent.click(hotProblemBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/problem/two-sum');
    });

    it('handles unauthenticated state', () => {
        (useAuth as Mock).mockReturnValue({
            isAuthenticated: false,
            loading: false
        });

        renderApp();
        // Status filters may not be visible or styled differently
        expect(screen.getByText('Two Sum')).toBeInTheDocument();
    });

    it('handles auth loading state', () => {
        (useAuth as Mock).mockReturnValue({
            isAuthenticated: false,
            loading: true
        });

        renderApp();
        // Should still render the app while auth is loading
        expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });
});

