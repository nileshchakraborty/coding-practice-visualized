import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SolutionModal from '../SolutionModal';
import React, { type ComponentProps } from 'react';



// Use vi.hoisted to ensure mock is created before file execution
const { mockUseAuth, mockPlaygroundRunCode } = vi.hoisted(() => {
    return {
        mockUseAuth: vi.fn(),
        mockPlaygroundRunCode: vi.fn()
    }
});

// Mock ResizeObserver
vi.stubGlobal('ResizeObserver', class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
});

// Mock getBoundingClientRect
Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
        width: 1000,
        height: 1000,
        top: 0,
        left: 0,
        bottom: 1000,
        right: 1000,
        x: 0,
        y: 0,
        toJSON: () => { }
    })
});

// Mock dependencies with correct relative paths (../../)
vi.mock('../SmartVisualizer', () => ({
    default: () => <div>SmartVisualizer Mock</div>
}));

vi.mock('../TutorChat', () => ({
    default: () => <div>TutorChat Mock</div>
}));

vi.mock('../AuthUnlockModal', () => ({
    AuthUnlockModal: ({ isOpen, featureName, onLogin }: { isOpen: boolean; featureName: string; onLogin: () => void }) => isOpen ? (
        <div data-testid="auth-modal">
            AuthUnlockMock: {featureName}
            <button onClick={onLogin}>Mock Login</button>
        </div>
    ) : null
}));

vi.mock('../EditorSettingsModal', () => ({
    EditorSettingsModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => isOpen ? (
        <div data-testid="settings-modal">
            EditorSettingsModal Mock
            <button onClick={onClose}>Close Settings</button>
        </div>
    ) : null
}));

// Robust Monaco Mock
vi.mock('@monaco-editor/react', () => ({
    default: function MockMonacoEditor({ onMount, onChange, value }: { onMount: (editor: unknown, monaco: unknown) => void, onChange: (value: string | undefined, ev: unknown) => void, value: string }) {
        React.useEffect(() => {
            if (onMount) {
                onMount(
                    {
                        focus: vi.fn(),
                        getPosition: vi.fn(),
                        setPosition: vi.fn(),
                        revealLine: vi.fn(),
                        deltaDecorations: vi.fn().mockReturnValue([]),
                        getModel: vi.fn().mockReturnValue({
                            getValue: vi.fn().mockReturnValue(''),
                            getLineCount: vi.fn().mockReturnValue(10),
                            updateOptions: vi.fn(),
                        }),
                        addAction: vi.fn(),
                        onKeyDown: vi.fn(),
                        dispose: vi.fn(),
                    },
                    {
                        KeyMod: { CtrlCmd: 2048 },
                        KeyCode: { Enter: 3 },
                        editor: {
                            setTheme: vi.fn()
                        }
                    }
                );
            }
        }, [onMount]);

        return (
            <textarea
                data-testid="monaco-mock"
                onChange={(e) => onChange && onChange(e.target.value, e)}
                value={value}
            />
        );
    }
}));

vi.mock('monaco-vim', () => ({
    initVimMode: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    VimMode: { Vim: { noremap: vi.fn() } }
}));

const mockLogin = vi.fn();
// Use the hoisted mock
vi.mock('../../hooks/useAuth', () => ({
    useAuth: mockUseAuth
}));

const mockSaveDraft = vi.fn();
const mockClearDraft = vi.fn();
const mockRunCode = vi.fn();

vi.mock('../../viewmodels', () => ({
    useSolution: () => ({
        solution: mockSolution,
        loading: false,
        error: null,
        submitSolution: vi.fn(),
        likeSolution: vi.fn(),
        dislikeSolution: vi.fn(),
        starSolution: vi.fn()
    }),
    usePlayground: () => ({
        output: null,
        error: null,
        isRunning: false,
        runCode: mockRunCode
    }),
    useTutor: () => ({
        messages: [],
        isLoading: false,
        sendMessage: vi.fn(),
        clearChat: vi.fn()
    }),
    useEditorSettings: () => ({
        settings: { fontSize: 14, theme: 'vs-dark', minimap: false },
        updateSetting: vi.fn()
    })
}));

vi.mock('../../context/useTheme', () => ({
    useTheme: () => ({ theme: 'dark' })
}));

vi.mock('../../hooks/useProgress', () => ({
    useProgress: () => ({
        markSolved: vi.fn(),
        saveDraft: mockSaveDraft,
        getDraft: vi.fn(),
        clearDraft: mockClearDraft,
        isSolved: vi.fn().mockReturnValue(false),
        sync: vi.fn()
    })
}));

vi.mock('../../hooks/useEditorSettings', () => ({
    useEditorSettings: () => ({
        settings: { fontSize: 14, theme: 'vs-dark', keybinding: 'vim' },
        updateSetting: vi.fn()
    })
}));

vi.mock('../../models/api', () => ({
    PlaygroundAPI: {
        runCode: mockPlaygroundRunCode
    }
}));

const mockBrowserExecute = vi.fn().mockResolvedValue({ success: true, results: [], logs: 'js logs' });
vi.mock('../../utils/BrowserJSRunner', () => ({
    browserJSRunner: {
        execute: (...args: unknown[]) => mockBrowserExecute(...args)
    }
}));

vi.mock('../../utils/ComplexityAnalyzer', () => ({
    ComplexityAnalyzer: {
        analyze: vi.fn().mockReturnValue({ time: 'O(n)', space: 'O(1)', explanation: ['Linear time'] })
    }
}));

vi.mock('../ui/resizable', () => ({
    ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => <div data-testid="desktop-layout">{children}</div>,
    ResizablePanel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ResizableHandle: () => <div>Handle</div>
}));

vi.mock('../../utils/ConstraintValidator', () => ({
    ConstraintValidator: {
        validate: vi.fn().mockReturnValue({ valid: true, errors: [] })
    }
}));

const mockSolution = {
    slug: 'two-sum',
    title: 'Two Sum',
    problemStatement: 'Problem Statement',
    description: 'Problem Description',
    code: 'def twoSum(nums, target): pass',
    examples: [{ input: '[2,7,11,15], 9', output: '[0,1]' }],
    approaches: [
        { name: 'bruteforce' as const, label: 'Brute Force', timeComplexity: 'O(n^2)', spaceComplexity: 'O(1)', intuition: ['Loop twice'], code: 'def brute(): pass' },
        { name: 'optimal' as const, label: 'Optimal', timeComplexity: 'O(n)', spaceComplexity: 'O(n)', intuition: ['Use hash map'], code: 'def optimal(): pass' }
    ],
    videoId: 'video-id',
    hints: ['Hint 1', 'Hint 2'],
    relatedProblems: [],
    constraints: ['2 <= nums.length <= 10^4'],
    initialCode: 'def twoSum(nums, target): pass',
    implementations: {
        python: { code: 'def', initialCode: 'def twoSum(nums, target): pass' },
        javascript: { code: 'function', initialCode: 'function twoSum(nums, target) {}' },
        java: { code: 'public int', initialCode: 'public int twoSum(int nums, int target) { return 0; }' },
        cpp: { code: 'int', initialCode: 'int twoSum(int nums, int target) { return 0; }' },
        go: { code: 'func', initialCode: 'func twoSum(nums int, target int) int { return 0 }' },
        rust: { code: 'pub fn', initialCode: 'pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> { vec![] }' }
    },
    oneliner: 'One liner summary',
    bruteForceTimeComplexity: 'O(n^2)',
    bruteForceSpaceComplexity: 'O(1)',
    bruteForceIntuition: ['Intuition'],
    pattern: 'Two Pointers',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    intuition: ['Use hash map'],
    keyInsight: 'Hash map lookups are O(1)'
};

describe('SolutionModal', () => {
    const minProps: ComponentProps<typeof SolutionModal> = {
        isOpen: true,
        onClose: vi.fn(),
        solution: mockSolution,
        slug: 'two-sum',
        problemStatus: 'in-progress'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue({ isAuthenticated: true, login: mockLogin });
        mockPlaygroundRunCode.mockResolvedValue({ success: true, results: [], logs: 'test logs' });

        // Comprehensive mock for speechSynthesis
        const mockSpeech = {
            cancel: vi.fn(),
            speak: vi.fn(),
            getVoices: vi.fn().mockReturnValue([]),
            paused: false,
            pending: false,
            speaking: false,
            onvoiceschanged: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        };

        vi.stubGlobal('speechSynthesis', mockSpeech);
        try {
            Object.defineProperty(window, 'speechSynthesis', {
                value: mockSpeech,
                configurable: true,
                writable: true
            });
        } catch {
            // Some environments might already have it or throw on defineProperty
            Object.assign(window, { speechSynthesis: mockSpeech });
        }

        vi.stubGlobal('SpeechSynthesisUtterance', class {
            constructor(public text: string) { }
        });

        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
        fireEvent(window, new Event('resize'));
    });

    it('renders modal content', () => {
        render(<SolutionModal {...minProps} />);
        expect(screen.getByText('Problem Description')).toBeInTheDocument();
        expect(screen.getByText('Problem Statement')).toBeInTheDocument();
        expect(screen.getByTestId('monaco-mock')).toBeInTheDocument();
    });

    it('switches tabs', () => {
        render(<SolutionModal {...minProps} />);
        const explainTab = screen.getByText(/Explain/i);
        fireEvent.click(explainTab);
        expect(screen.getAllByText(/Brute Force/i).length).toBeGreaterThan(0);

        const tutorTab = screen.getByText(/Tutor/i);
        fireEvent.click(tutorTab);
        expect(screen.getByText('TutorChat Mock')).toBeInTheDocument();
    });

    it('toggles approaches in Explanation tab', () => {
        render(<SolutionModal {...minProps} />);
        fireEvent.click(screen.getByText(/Explain/i));
        const bfBtn = screen.getByText('Brute Force', { selector: 'button' });
        fireEvent.click(bfBtn);
        expect(screen.getAllByText(/Brute Force/i).length).toBeGreaterThan(0);
    });

    it('runs code via button', async () => {
        render(<SolutionModal {...minProps} />);
        const runBtn = screen.getByText(/Run Code/i);
        fireEvent.click(runBtn);
        await waitFor(() => {
            expect(screen.queryByText('Running...')).not.toBeInTheDocument();
        });
    });

    it('handles run code failure', async () => {
        mockPlaygroundRunCode.mockResolvedValueOnce({ success: false, error: 'Compilation Error' });

        render(<SolutionModal {...minProps} />);
        const runBtn = screen.getByText(/Run Code/i);
        fireEvent.click(runBtn);
        await waitFor(() => {
            expect(screen.queryByText('Running...')).not.toBeInTheDocument();
        });
    });

    it('opens and confirms reset code', async () => {
        render(<SolutionModal {...minProps} />);
        fireEvent.click(screen.getByTitle('Reset Code'));
        expect(screen.getByText('Reset Code?')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Reset Code', { selector: 'button' }));
        expect(screen.queryByText('Reset Code?')).not.toBeInTheDocument();
        expect(mockClearDraft).toHaveBeenCalledWith('two-sum');
    });

    it('opens and closes settings modal', () => {
        render(<SolutionModal {...minProps} />);
        fireEvent.click(screen.getByTitle('Editor Settings'));
        expect(screen.getByText('EditorSettingsModal Mock')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Close Settings'));
        expect(screen.queryByTestId('settings-modal')).not.toBeInTheDocument();
    });

    it('saves draft on code change (debounced)', async () => {
        vi.useFakeTimers();
        render(<SolutionModal {...minProps} />);
        fireEvent.change(screen.getByTestId('monaco-mock'), { target: { value: 'new code' } });
        act(() => { vi.advanceTimersByTime(11000); });
        expect(mockSaveDraft).toHaveBeenCalled();
        vi.useRealTimers();
    });

    it('executes JavaScript on client side', async () => {
        render(<SolutionModal {...minProps} />);
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'javascript' } });
        fireEvent.click(screen.getByText(/Run Code/i));
        await waitFor(() => { expect(mockBrowserExecute).toHaveBeenCalled(); });
    });

    it('prompts for auth when running code while unauthenticated', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: false, login: mockLogin });
        render(<SolutionModal {...minProps} />);
        fireEvent.click(screen.getByText('Run Code'));
        expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
    });

    it('cancels reset code', () => {
        render(<SolutionModal {...minProps} />);
        fireEvent.click(screen.getByTitle('Reset Code'));
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.queryByText('Reset Code?')).not.toBeInTheDocument();
    });

    it('handles mobile tab navigation', () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
        fireEvent(window, new Event('resize'));
        render(<SolutionModal {...minProps} />);

        // Buttons: 0=Close, 1=Problem, 2=Explanation, 3=Playground, 4=Tutor
        const allButtons = screen.getAllByRole('button');

        // Problem (default)
        fireEvent.click(allButtons[1]);
        expect(screen.getByText('Problem Description')).toBeInTheDocument();

        // Explanation
        fireEvent.click(allButtons[2]);
        expect(screen.getAllByText(/Brute Force/i).length).toBeGreaterThan(0);

        // Playground
        fireEvent.click(allButtons[3]);
        expect(screen.getByTestId('monaco-mock')).toBeInTheDocument();

        // Tutor
        fireEvent.click(allButtons[4]);
        expect(screen.getByText('TutorChat Mock')).toBeInTheDocument();

        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    });

    it('reveals hints progressively', () => {
        render(<SolutionModal {...minProps} />);
        fireEvent.click(screen.getByText(/Show Hint 1/i));
        expect(screen.getByText('Hint 1')).toBeInTheDocument();
    });

    it('shows visualizer when solution has visualization data', () => {
        const solutionWithViz = {
            ...mockSolution,
            visualizationType: 'array' as const,
            animationSteps: [{ type: 'highlight' as const, indices: [0] }]
        };
        render(<SolutionModal {...minProps} solution={solutionWithViz} />);
        fireEvent.click(screen.getByText(/Explain/i));
        expect(screen.getByText('🎬 Visualization')).toBeInTheDocument();
    });

    it('displays complexity analysis in editor', async () => {
        vi.useFakeTimers();
        render(<SolutionModal {...minProps} />);
        fireEvent.change(screen.getByTestId('monaco-mock'), { target: { value: 'for i in range(n): pass' } });
        await act(async () => { vi.advanceTimersByTime(1100); });
        expect(screen.getAllByText('O(n)').length).toBeGreaterThan(0);
        vi.useRealTimers();
    });

    it('shows key insight when available', () => {
        render(<SolutionModal {...minProps} />);
        fireEvent.click(screen.getByText(/Explain/i));
        expect(screen.getByText('Hash map lookups are O(1)')).toBeInTheDocument();
    });

    it('handles solution without key insight', () => {
        render(<SolutionModal {...minProps} solution={{ ...mockSolution, keyInsight: '' }} />);
        fireEvent.click(screen.getByText(/Explain/i));
        expect(screen.queryByText('💡 Key Insight')).not.toBeInTheDocument();
    });

    it('switches to logs tab on failed test results', async () => {
        mockPlaygroundRunCode.mockResolvedValueOnce({
            success: true,
            results: [{ passed: false, input: 'in', expected: 'ex', actual: 'ac' }],
            logs: 'test execution failed'
        });
        render(<SolutionModal {...minProps} />);
        fireEvent.click(screen.getByText(/Run Code/i));
        await waitFor(() => {
            expect(screen.getByText('Debug Log')).toHaveClass('text-amber-600');
        });
    });

    it('switches to logs tab on execution exception', async () => {
        mockPlaygroundRunCode.mockRejectedValueOnce(new Error('Server Crash'));
        render(<SolutionModal {...minProps} />);
        fireEvent.click(screen.getByText(/Run Code/i));
        await waitFor(() => {
            expect(screen.getByText('Debug Log')).toHaveClass('text-amber-600');
        });
    });

    it('handles custom test case solo run toggle', async () => {
        render(<SolutionModal {...minProps} />);

        // 1. Enable custom case
        fireEvent.click(screen.getByText(/Custom Case/i));
        const input = screen.getByPlaceholderText(/Enter input here/i);
        fireEvent.change(input, { target: { value: 'test input' } });

        // 2. Toggle Run Custom Only (now visible)
        fireEvent.click(screen.getByText(/Run Custom Only/i));
        fireEvent.click(screen.getByText(/Run Code/i));
        await waitFor(() => {
            expect(mockPlaygroundRunCode).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                [{ input: 'test input', output: '' }], // Custom case used
                'python',
                expect.anything()
            );
        });
    });

    it('clears custom test case', () => {
        render(<SolutionModal {...minProps} />);
        fireEvent.click(screen.getByText(/Custom Case/i));
        fireEvent.change(screen.getByPlaceholderText(/Enter input here/i), { target: { value: 'custom' } });
        fireEvent.click(screen.getByText(/Clear Custom Case/i));
        expect(screen.queryByPlaceholderText(/Enter input here/i)).not.toBeInTheDocument();
        expect(screen.getByText('Case 1', { selector: 'button' })).toBeInTheDocument();
    });

    it.skip('displays failed test results summary and cards', async () => {
        mockPlaygroundRunCode.mockResolvedValueOnce({
            success: true,
            results: [
                { passed: true, input: 'input1', expected: 'exp1', actual: 'act1' },
                { passed: false, input: 'input2', expected: 'exp2', actual: 'act2' }
            ],
            logs: ''
        });
        render(<SolutionModal {...minProps} />);
        fireEvent.click(screen.getByText(/Run Code/i));

        await waitFor(() => {
            expect(screen.getByText('Debug Log')).toHaveClass('text-amber-600');
        });

        // Switch back to results
        const resultTabBtn = screen.getByRole('button', { name: /Test Result/i });
        fireEvent.click(resultTabBtn);

        await waitFor(() => {
            const btn = screen.getByRole('button', { name: /Test Result/i });
            expect(btn).toHaveClass('border-emerald-500'); // Ensure tab is active
            expect(screen.getByText('Some Tests Failed')).toBeInTheDocument();
            expect(screen.getByText('1 of 2 cases passed')).toBeInTheDocument();
            expect(screen.getByText('PASSED')).toBeInTheDocument();
            expect(screen.getByText('FAILED')).toBeInTheDocument();
            expect(screen.getByText('input1')).toBeInTheDocument();
        });
    });

    it('covers tab switches in desktop', () => {
        render(<SolutionModal {...minProps} />);
        fireEvent.click(screen.getByText('Problem', { selector: 'button' }));
        expect(screen.getByText('Problem Description')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Tutor', { selector: 'button' }));
        expect(screen.getByText('TutorChat Mock')).toBeInTheDocument();
    });

    describe('Code Template Conversion', () => {
        const languages = [
            { lang: 'java', expected: 'public int twoSum(int nums, int target)' },
            { lang: 'cpp', expected: 'int twoSum(int nums, int target)' },
            { lang: 'go', expected: 'func twoSum(nums int, target int) int' },
            { lang: 'rust', expected: 'pub fn two_sum' },
        ];

        languages.forEach(({ lang, expected }) => {
            it(`converts python template to ${lang}`, () => {
                render(<SolutionModal {...minProps} />);
                const select = screen.getByRole('combobox');
                fireEvent.change(select, { target: { value: lang } });

                // Monaco mock displays value
                const editor = screen.getByTestId('monaco-mock') as HTMLTextAreaElement;
                expect(editor.value).toContain(expected);
            });
        });

        it('handles auth unlock flow', () => {
            mockUseAuth.mockReturnValue({ isAuthenticated: false, login: mockLogin });
            render(<SolutionModal {...minProps} />);
            fireEvent.click(screen.getByText('Run Code')); // Triggers auth modal
            expect(screen.getByTestId('auth-modal')).toBeInTheDocument();

            fireEvent.click(screen.getByText('Mock Login'));
            expect(mockLogin).toHaveBeenCalled();
            expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();
        });
    });
});
