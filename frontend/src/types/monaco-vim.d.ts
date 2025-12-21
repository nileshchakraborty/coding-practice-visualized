import { editor } from 'monaco-editor';

declare module 'monaco-vim' {
    export interface VimMode {
        dispose(): void;
    }
    export function initVimMode(editor: editor.IStandaloneCodeEditor, statusbar: HTMLElement | null): VimMode;
}
