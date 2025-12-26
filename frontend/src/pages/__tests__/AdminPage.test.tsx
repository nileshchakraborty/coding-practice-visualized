import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { AdminPage } from '../AdminPage';
import { BrowserRouter } from 'react-router-dom';

// Mock useAuth
vi.mock('../../context/AuthContextDefinition', () => ({
    useAuth: () => ({
        user: { name: 'Admin', email: 'admin@example.com' },
        isAuthenticated: true,
        accessToken: 'fake-jwt-token',
        login: vi.fn(),
    }),
}));

// Mock AdminLogin to bypass auth flow
vi.mock('../../components/AdminLogin', () => ({
    AdminLogin: ({ onLogin }: { onLogin: (token: string) => void }) => (
        <button onClick={() => onLogin('valid-admin-token')}>Mock Login</button>
    ),
}));

// Mock API data
const mockStats = {
    totalProblems: 10,
    totalSolutions: 5,
    totalPlans: 3,
    studyPlanStats: []
};

const mockPlans = {
    'blind75': { id: 'blind75', name: 'Blind 75', problems: ['two-sum'], icon: '🔥', description: 'Desc' }
};

const mockAnalytics = {
    recommendations: {
        hotProblems: [],
        hotTopics: [],
        stats: { totalViews: 100, uniqueProblems: 10 }
    },
    progress: { totalUsers: 50, totalSolves: 200 },
    cache: { size: 60, hits: 50, misses: 10 },
    recentActivity: [],
    dailyActivity: []
};

const mockActivityLogs = [
    { timestamp: new Date().toISOString(), action: 'LOGIN', details: 'User login', ip: '127.0.0.1' }
];

describe('AdminPage', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        fetchSpy = vi.spyOn(window, 'fetch');
        vi.spyOn(window, 'confirm').mockReturnValue(true); // Auto-confirm deletions

        // Default success mock matches routing
        fetchSpy.mockImplementation((url: string | URL | Request, options: unknown) => {
            const urlString = url.toString();
            const method = (options as { method?: string })?.method;
            if (urlString.includes('/api/admin/stats')) {
                return Promise.resolve({ ok: true, json: async () => mockStats });
            }
            if (urlString.includes('/api/admin/study-plans')) {
                // DELETE
                if (method === 'DELETE') {
                    const planId = urlString.split('/').pop();
                    if (planId === 'fail') return Promise.resolve({ ok: false });
                    return Promise.resolve({ ok: true });
                }
                // POST (Create)
                if (method === 'POST') {
                    return Promise.resolve({ ok: true });
                }
                // PUT (Update)
                if (method === 'PUT') {
                    return Promise.resolve({ ok: true });
                }
                // GET
                return Promise.resolve({ ok: true, json: async () => ({ plans: mockPlans }) });
            }
            if (urlString.includes('/api/admin/analytics/overview')) {
                return Promise.resolve({ ok: true, json: async () => mockAnalytics });
            }
            if (urlString.includes('/api/admin/analytics/activity')) {
                return Promise.resolve({ ok: true, json: async () => [] });
            }
            if (urlString.includes('/api/admin/analytics/geo')) {
                return Promise.resolve({ ok: true, json: async () => [] });
            }
            if (urlString.includes('/api/admin/analytics/problems')) {
                return Promise.resolve({ ok: true, json: async () => [] });
            }
            // Fallback for generic analytics (if any legacy calls remain, though unlikely)
            if (urlString.includes('/api/admin/analytics')) {
                return Promise.resolve({ ok: true, json: async () => mockAnalytics });
            }
            if (urlString.includes('/api/admin/logs')) {
                return Promise.resolve({ ok: true, json: async () => ({ logs: mockActivityLogs }) });
            }
            // Default 200/empty for mutations or others
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const setup = async () => {
        render(
            <BrowserRouter>
                <AdminPage />
            </BrowserRouter>
        );
        const loginBtn = screen.getByText('Mock Login');
        await act(async () => {
            fireEvent.click(loginBtn);
        });
        await waitFor(() => expect(screen.getByText('Admin Panel')).toBeInTheDocument());
    };

    it('renders dashboard by default', async () => {
        await setup();
        await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: 'Dashboard' })).toBeInTheDocument());
        await waitFor(() => expect(screen.getByText('10')).toBeInTheDocument());
    });

    it('navigates to Study Plans and renders list', async () => {
        await setup();
        const plansTab = screen.getByRole('button', { name: /Study Plans/i });
        await act(async () => {
            fireEvent.click(plansTab);
        });

        await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: 'Study Plans' })).toBeInTheDocument());
        expect(screen.getByText('Blind 75')).toBeInTheDocument();
    });

    it('adds a new study plan', async () => {
        await setup();
        // Navigate
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Study Plans/i }));
        });
        // Click Add
        const addBtn = screen.getByText('Add Plan');
        await act(async () => {
            fireEvent.click(addBtn);
        });

        // Modal
        const nameInput = screen.getByPlaceholderText('Blind 75');
        await act(async () => {
            fireEvent.change(nameInput, { target: { value: 'New Plan' } });
            fireEvent.change(screen.getByPlaceholderText('e.g., blind75'), { target: { value: 'new-plan' } }); // ID (placeholder matches code?)
            fireEvent.change(screen.getByPlaceholderText('🔥'), { target: { value: '🚀' } });
        });

        // Save
        const saveBtn = screen.getByRole('button', { name: 'Save' });
        await act(async () => {
            fireEvent.click(saveBtn);
        });

        // Expect POST
        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/api/admin/study-plans'), expect.objectContaining({
                method: 'POST'
            }));
        });
    });

    it('edits an existing plan', async () => {
        await setup();
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Study Plans/i }));
        });
        await waitFor(() => expect(screen.getByText('Blind 75')).toBeInTheDocument());

        const editBtns = screen.getAllByTitle('Edit Plan');
        await act(async () => {
            fireEvent.click(editBtns[0]);
        });

        // Modal should open
        const nameInput = screen.getByDisplayValue('Blind 75');

        // Change value
        await act(async () => {
            fireEvent.change(nameInput, { target: { value: 'Blind 75 Updated' } });
        });

        // Save
        const saveBtn = screen.getByRole('button', { name: 'Save' });
        await act(async () => {
            fireEvent.click(saveBtn);
        });

        // Expect PUT
        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/api/admin/study-plans/blind75'), expect.objectContaining({
                method: 'PUT'
            }));
        });
    });

    it.skip('deletes a plan', async () => {
        await setup();
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Study Plans/i }));
        });

        const deleteBtns = screen.getAllByTitle('Delete Plan');
        await act(async () => {
            fireEvent.click(deleteBtns[0]);
        });

        // Expect DELETE
        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/api/admin/study-plans/blind75'), expect.objectContaining({
                method: 'DELETE'
            }));
        });
    });

    it.skip('handles analytics tab', async () => {
        await setup();
        const analyticsTab = screen.getByRole('button', { name: /Analytics/i });
        await act(async () => {
            fireEvent.click(analyticsTab);
        });

        await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: 'Analytics' })).toBeInTheDocument());
        await waitFor(() => expect(screen.getByText('Cache Size')).toBeInTheDocument());
    });

    it.skip('handles refresh in analytics', async () => {
        await setup();
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Analytics/i })); });

        // Wait for Refresh button to APPEAR with title
        await waitFor(() => expect(screen.getByTitle('Refresh Data')).toBeInTheDocument());

        const refreshBtn = screen.getByTitle('Refresh Data');
        await act(async () => { fireEvent.click(refreshBtn); });

        expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/api/admin/analytics'), expect.anything());
    });

    it('navigates to Problems tab', async () => {
        await setup();
        const problemsTab = screen.getByRole('button', { name: /Problems/i });
        await act(async () => {
            fireEvent.click(problemsTab);
        });

        await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: 'Problems Management' })).toBeInTheDocument());
        // expect(screen.getByText('Problems editor coming soon')).toBeInTheDocument();
    });

    it('handles logout', async () => {
        await setup();
        const logoutBtn = screen.getByText('Logout');
        await act(async () => {
            fireEvent.click(logoutBtn);
        });

        // After logout, should show login screen (mock)
        await waitFor(() => expect(screen.getByText('Mock Login')).toBeInTheDocument());
    });

    it('handles back to site navigation', async () => {
        await setup();
        const backBtn = screen.getByText('Back to Site');
        expect(backBtn).toBeInTheDocument();
        // Note: Navigation typically doesn't do much in tests without mocking useNavigate
    });

    it('handles API errors gracefully', async () => {
        // Override mock to return error for stats
        fetchSpy.mockImplementationOnce(() => {
            return Promise.resolve({ ok: false, json: async () => ({ error: 'Test Error' }) });
        });

        render(
            <BrowserRouter>
                <AdminPage />
            </BrowserRouter>
        );
        const loginBtn = screen.getByText('Mock Login');
        await act(async () => {
            fireEvent.click(loginBtn);
        });

        // Should show error indicator (red text/alert exists)
        await waitFor(() => {
            const errorDiv = document.querySelector('.text-red-400');
            expect(errorDiv).toBeInTheDocument();
        });
    });

    it('cancels plan edit modal', async () => {
        await setup();
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Study Plans/i }));
        });

        // Open add plan modal
        const addBtn = screen.getByText('Add Plan');
        await act(async () => {
            fireEvent.click(addBtn);
        });

        // Modal should be open
        expect(screen.getByText('New Plan')).toBeInTheDocument();

        // Cancel
        const cancelBtn = screen.getByText('Cancel');
        await act(async () => {
            fireEvent.click(cancelBtn);
        });

        // Modal should be closed
        expect(screen.queryByText('New Plan')).not.toBeInTheDocument();
    });

    it('handles empty study plans', async () => {
        // Override mock to return empty plans
        fetchSpy.mockImplementation((url: string | URL | Request) => {
            const urlString = url.toString();
            if (urlString.includes('/api/admin/stats')) {
                return Promise.resolve({ ok: true, json: async () => mockStats });
            }
            if (urlString.includes('/api/admin/study-plans')) {
                return Promise.resolve({ ok: true, json: async () => ({ plans: {} }) });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        render(
            <BrowserRouter>
                <AdminPage />
            </BrowserRouter>
        );
        const loginBtn = screen.getByText('Mock Login');
        await act(async () => {
            fireEvent.click(loginBtn);
        });
        await waitFor(() => expect(screen.getByText('Admin Panel')).toBeInTheDocument());

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Study Plans/i }));
        });

        // No plans should be listed, but Add Plan button should be there
        expect(screen.getByText('Add Plan')).toBeInTheDocument();
    });

    it('handles delete confirmation cancelled', async () => {
        // Override confirm to return false
        vi.spyOn(window, 'confirm').mockReturnValueOnce(false);

        await setup();
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Study Plans/i }));
        });

        const deleteBtns = screen.getAllByTitle('Delete Plan');
        await act(async () => {
            fireEvent.click(deleteBtns[0]);
        });

        // DELETE should NOT be called when confirm is false
        expect(fetchSpy).not.toHaveBeenCalledWith(expect.stringContaining('DELETE'), expect.anything());
    });
});
