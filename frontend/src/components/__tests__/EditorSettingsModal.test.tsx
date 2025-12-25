import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorSettingsModal } from '../EditorSettingsModal';

describe('EditorSettingsModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        settings: {
            fontSize: 14,
            theme: 'vs-dark' as const,
            keybinding: 'standard' as const,
            tabSize: 4,
            minimap: true,
            wordWrap: 'on' as const,
            lineNumbers: 'on' as const,
            formatOnType: true
        },
        onUpdate: vi.fn()
    };

    it('renders when open', () => {
        render(<EditorSettingsModal {...defaultProps} />);
        expect(screen.getByText('Editor Settings')).toBeInTheDocument();
        expect(screen.getByText('Font Size')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(<EditorSettingsModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Editor Settings')).not.toBeInTheDocument();
    });

    it('updates font size', () => {
        render(<EditorSettingsModal {...defaultProps} />);
        const input = screen.getByDisplayValue('14');
        fireEvent.change(input, { target: { value: '16' } });
        expect(defaultProps.onUpdate).toHaveBeenCalledWith('fontSize', 16);
    });

    it('closes on close button click', () => {
        render(<EditorSettingsModal {...defaultProps} />);
        // Assuming X button is accessible via its icon or position
        const buttons = screen.getAllByRole('button');
        // The modal usually has a close button at top right
        if (buttons[0]) {
            fireEvent.click(buttons[0]);
            expect(defaultProps.onClose).toHaveBeenCalled();
        }
    });
});
