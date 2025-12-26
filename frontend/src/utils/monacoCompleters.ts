import type { IDisposable, languages } from 'monaco-editor';

type Monaco = typeof import('monaco-editor');

/**
 * Registers custom completion providers for LeetCode environment
 * 
 * Note: Monaco's completion API fills in the 'range' property from the completion context,
 * but the TypeScript type requires it. We use type assertions since this works at runtime.
 */
export const registerCompleters = (monaco: Monaco): IDisposable[] => {
    const disposables: IDisposable[] = [];

    // Guard for test environments where monaco.languages may not be available
    if (!monaco?.languages?.registerCompletionItemProvider) {
        return disposables;
    }

    // Helper to create a completion item without specifying range (Monaco fills it)
    const createSuggestion = (
        label: string,
        kind: languages.CompletionItemKind,
        insertText: string,
        documentation: string,
        insertTextRules: languages.CompletionItemInsertTextRule
    ): languages.CompletionItem => ({
        label,
        kind,
        insertText,
        documentation,
        insertTextRules,
        range: undefined as unknown as languages.CompletionItem['range'], // Monaco fills this
    });

    // --- PYTHON SNIPPETS ---
    disposables.push(monaco.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: () => {
            const suggestions: languages.CompletionItem[] = [
                // Structures
                createSuggestion(
                    'ListNode',
                    monaco.languages.CompletionItemKind.Class,
                    'class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next',
                    'LeetCode Singly-Linked List Node',
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                ),
                createSuggestion(
                    'TreeNode',
                    monaco.languages.CompletionItemKind.Class,
                    'class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right',
                    'LeetCode Binary Tree Node',
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                ),
                // Common Patterns
                createSuggestion(
                    'fori',
                    monaco.languages.CompletionItemKind.Snippet,
                    'for i in range(${1:n}):\n    ${2:pass}',
                    'Standard range loop',
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                ),
                createSuggestion(
                    'defsol',
                    monaco.languages.CompletionItemKind.Snippet,
                    'class Solution:\n    def ${1:methodName}(self, ${2:args}):\n        ${3:pass}',
                    'Solution Class Template',
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                )
            ];
            return { suggestions };
        }
    }));

    // --- JAVASCRIPT / TYPESCRIPT SNIPPETS ---
    const jsTsProvider: languages.CompletionItemProvider = {
        provideCompletionItems: () => {
            const suggestions: languages.CompletionItem[] = [
                // Structures
                createSuggestion(
                    'ListNode',
                    monaco.languages.CompletionItemKind.Class,
                    'function ListNode(val, next) {\n    this.val = (val===undefined ? 0 : val)\n    this.next = (next===undefined ? null : next)\n}',
                    'LeetCode Singly-Linked List Node',
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                ),
                createSuggestion(
                    'TreeNode',
                    monaco.languages.CompletionItemKind.Class,
                    'function TreeNode(val, left, right) {\n    this.val = (val===undefined ? 0 : val)\n    this.left = (left===undefined ? null : left)\n    this.right = (right===undefined ? null : right)\n}',
                    'LeetCode Binary Tree Node',
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                ),
                // Snippets
                createSuggestion(
                    'clog',
                    monaco.languages.CompletionItemKind.Snippet,
                    'console.log(${1:item});',
                    'Console Log',
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                ),
                createSuggestion(
                    'fori',
                    monaco.languages.CompletionItemKind.Snippet,
                    'for (let i = 0; i < ${1:n}; i++) {\n    ${2}\n}',
                    'Standard For Loop',
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                )
            ];
            return { suggestions };
        }
    };

    disposables.push(monaco.languages.registerCompletionItemProvider('javascript', jsTsProvider));
    disposables.push(monaco.languages.registerCompletionItemProvider('typescript', jsTsProvider));

    return disposables;
};
