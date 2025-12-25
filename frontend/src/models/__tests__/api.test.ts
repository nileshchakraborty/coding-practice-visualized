import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SolutionsAPI, TutorAPI, PlaygroundAPI, ProblemsAPI } from '../api';

// Use vi.hoisted to avoid ReferenceError in mock factory
const { mockGet, mockPost } = vi.hoisted(() => {
    return {
        mockGet: vi.fn(),
        mockPost: vi.fn()
    };
});

vi.mock('axios', () => ({
    default: {
        create: () => ({
            get: mockGet,
            post: mockPost,
            interceptors: {
                request: { use: vi.fn() }
            }
        }),
        isAxiosError: (payload: unknown) => (payload as { isAxiosError?: boolean })?.isAxiosError
    }
}));

// Mock utils/auth
vi.mock('../../utils/auth', () => ({
    getAuthToken: () => 'fake-token'
}));

describe('API Models', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('ProblemsAPI', () => {
        it('getAll fetches problems', async () => {
            const mockData = { categories: [] };
            mockGet.mockResolvedValue({ data: mockData });

            const result = await ProblemsAPI.getAll();
            expect(result).toEqual(mockData);
            expect(mockGet).toHaveBeenCalledWith('/problems');
        });

        it('getBySlug finds problem', async () => {
            const mockData = {
                categories: [{
                    name: 'test',
                    problems: [{ slug: 'two-sum', title: 'Two Sum' }]
                }]
            };
            mockGet.mockResolvedValue({ data: mockData });

            const result = await ProblemsAPI.getBySlug('two-sum');
            expect(result).toEqual({ slug: 'two-sum', title: 'Two Sum' });
        });

        it('getBySlug returns null if not found', async () => {
            const mockData = { categories: [] };
            mockGet.mockResolvedValue({ data: mockData });

            const result = await ProblemsAPI.getBySlug('unknown');
            expect(result).toBeNull();
        });
    });

    describe('SolutionsAPI', () => {
        it('getBySlug returns data on success', async () => {
            const mockData = { slug: 'two-sum', title: 'Two Sum' };
            mockGet.mockResolvedValue({ data: mockData });

            const result = await SolutionsAPI.getBySlug('two-sum');
            expect(result).toEqual(mockData);
            expect(mockGet).toHaveBeenCalledWith('/solutions/two-sum');
        });

        it('getBySlug returns null on 404', async () => {
            const error = new Error('Not Found') as Error & { isAxiosError: boolean; response: { status: number } };
            error.isAxiosError = true;
            error.response = { status: 404 };
            mockGet.mockRejectedValue(error);

            const result = await SolutionsAPI.getBySlug('unknown');
            expect(result).toBeNull();
        });

        it('getBySlug throws on other error', async () => {
            const error = new Error('Server Error');
            mockGet.mockRejectedValue(error);

            await expect(SolutionsAPI.getBySlug('two-sum')).rejects.toThrow('Server Error');
        });

        it('generate returns success', async () => {
            mockPost.mockResolvedValue({ data: { success: true } });

            const result = await SolutionsAPI.generate('two-sum');
            expect(result).toEqual({ success: true });
            expect(mockPost).toHaveBeenCalledWith('/generate', { slug: 'two-sum' });
        });
    });

    describe('TutorAPI', () => {
        it('chat sends messages (legacy flow)', async () => {
            mockPost.mockResolvedValue({ data: { response: 'Hello' } });

            // Pass useJobQueue: false to test direct API call
            const result = await TutorAPI.chat('two-sum', 'Hi', [], { useJobQueue: false });

            expect(result).toEqual({ response: 'Hello' });
            expect(mockPost).toHaveBeenCalledWith('/ai/tutor', {
                slug: 'two-sum',
                message: 'Hi',
                history: []
            });
        });
    });

    describe('PlaygroundAPI', () => {
        it('runCode executes (legacy flow)', async () => {
            mockPost.mockResolvedValue({ data: { success: true, results: [] } });

            // Pass useJobQueue: false
            const result = await PlaygroundAPI.runCode('print(1)', 'two-sum', [], 'python', { useJobQueue: false });

            expect(result).toEqual({ success: true, results: [] });
            expect(mockPost).toHaveBeenCalledWith('/execute', {
                code: 'print(1)',
                slug: 'two-sum',
                testCases: [],
                language: 'python',
                referenceCode: undefined,
                constraints: undefined
            });
        });
    });
});
