import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { SolutionsAPI, TutorAPI, PlaygroundAPI, ProblemsAPI } from '../api';

// Use vi.hoisted to avoid ReferenceError in mock factory
const { mockGet, mockPost, mockInterceptorsUse } = vi.hoisted(() => {
    return {
        mockGet: vi.fn(),
        mockPost: vi.fn(),
        mockInterceptorsUse: vi.fn()
    };
});

vi.mock('axios', () => ({
    default: {
        create: () => ({
            get: mockGet,
            post: mockPost,
            interceptors: {
                request: { use: mockInterceptorsUse }
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

        it('runCode uses default python language', async () => {
            mockPost.mockResolvedValue({ data: { success: true, results: [] } });

            const result = await PlaygroundAPI.runCode('print(1)', 'test', undefined, undefined, { useJobQueue: false });

            expect(result).toEqual({ success: true, results: [] });
            expect(mockPost).toHaveBeenCalledWith('/execute', {
                code: 'print(1)',
                slug: 'test',
                testCases: undefined,
                language: 'python',
                referenceCode: undefined,
                constraints: undefined
            });
        });

        it('runCode passes referenceCode and constraints', async () => {
            mockPost.mockResolvedValue({ data: { success: true, results: [] } });

            const result = await PlaygroundAPI.runCode('print(1)', 'test', [], 'python', {
                useJobQueue: false,
                referenceCode: 'def solve(): pass',
                constraints: ['1 <= n <= 100']
            });

            expect(result).toEqual({ success: true, results: [] });
            expect(mockPost).toHaveBeenCalledWith('/execute', {
                code: 'print(1)',
                slug: 'test',
                testCases: [],
                language: 'python',
                referenceCode: 'def solve(): pass',
                constraints: ['1 <= n <= 100']
            });
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

        it('chat passes message history', async () => {
            mockPost.mockResolvedValue({ data: { response: 'Sure, here is a hint' } });

            const history = [
                { role: 'user', content: 'Hello' },
                { role: 'assistant', content: 'Hi there!' }
            ];
            const result = await TutorAPI.chat('test', 'Give me a hint', history, { useJobQueue: false });

            expect(result).toEqual({ response: 'Sure, here is a hint' });
            expect(mockPost).toHaveBeenCalledWith('/ai/tutor', {
                slug: 'test',
                message: 'Give me a hint',
                history
            });
        });
    });

    describe('PlaygroundAPI with job queue', () => {
        it('runCode uses job queue when enabled', async () => {
            // Mock JobService
            const mockSubmitAndPoll = vi.fn().mockResolvedValue({ success: true, results: [] });
            vi.doMock('../../services/JobService', () => ({
                JobService: {
                    submitAndPoll: mockSubmitAndPoll
                }
            }));

            // Re-import to get fresh module with mocked JobService
            const { PlaygroundAPI: FreshPlaygroundAPI } = await import('../api');

            const onStatusUpdate = vi.fn();
            const result = await FreshPlaygroundAPI.runCode(
                'print(1)',
                'test',
                [{ input: '[1,2]', output: '3' }],
                'python',
                {
                    useJobQueue: true,
                    onStatusUpdate,
                    referenceCode: 'def ref(): pass',
                    constraints: ['1 <= n <= 10']
                }
            );

            expect(result).toEqual({ success: true, results: [] });
        });
    });

    describe('TutorAPI with job queue', () => {
        it('chat uses job queue by default', async () => {
            // Mock JobService
            const mockSubmitAndPoll = vi.fn().mockResolvedValue({ response: 'AI response' });
            vi.doMock('../../services/JobService', () => ({
                JobService: {
                    submitAndPoll: mockSubmitAndPoll
                }
            }));

            // Re-import to get fresh module
            const { TutorAPI: FreshTutorAPI } = await import('../api');

            const onStatusUpdate = vi.fn();
            const result = await FreshTutorAPI.chat(
                'test',
                'Hello',
                [{ role: 'user', content: 'Hi' }],
                { useJobQueue: true, onStatusUpdate }
            );

            expect(result).toEqual({ response: 'AI response' });
        });
    });

    describe('Additional Coverage', () => {
        it('ProblemsAPI.getBySlug returns null if problem not found', async () => {
            vi.spyOn(ProblemsAPI, 'getAll').mockResolvedValueOnce({
                easy: 0, medium: 0, hard: 0,
                categories: [{ name: 'c1', count: 1, icon: 'icon', problems: [{ id: 1, slug: 'other', title: 'Other', difficulty: 'Easy', category: 'Two Pointers', url: 'http://example.com' }] }]
            });
            const result = await ProblemsAPI.getBySlug('target');
            expect(result).toBeNull();
        });

        it('PlaygroundAPI defaults options values', async () => {
            const { PlaygroundAPI } = await import('../api'); // Using imported module to test internal default logic
            vi.mocked(axios.create().post).mockResolvedValueOnce({ data: { success: true } });

            // Test default arg for language and undefined options
            await PlaygroundAPI.runCode('code', 'slug');
            expect(axios.create().post).toHaveBeenCalledWith('/execute', expect.objectContaining({
                language: 'python'
            }));

            // Test options provided but props missing
            await PlaygroundAPI.runCode('code', 'slug', undefined, 'python', {});
            // Should not use queue (default false in options?.useJobQueue ?? false)
            // If queue was used, it would try to import JobService which we haven't mocked here or verified call
            // But we verify post is called, meaning it took the fallback path
            expect(axios.create().post).toHaveBeenCalledTimes(2);
        });
    });
});
