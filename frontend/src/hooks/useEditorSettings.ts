import { useState } from 'react';

export interface EditorSettings {
    fontSize: number;
    tabSize: number;
    theme: 'vs-dark' | 'light' | 'monokai' | 'github-dark';
    keybinding: 'standard' | 'vim';
}

const DEFAULT_SETTINGS: EditorSettings = {
    fontSize: 14,
    tabSize: 4,
    theme: 'vs-dark',
    keybinding: 'standard'
};

export function useEditorSettings() {
    const [settings, setSettings] = useState<EditorSettings>(() => {
        try {
            const saved = localStorage.getItem('codenium_editor_settings');
            return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
        } catch (e) {
            return DEFAULT_SETTINGS;
        }
    });

    const updateSetting = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
        setSettings(prev => {
            const newSettings = { ...prev, [key]: value };
            localStorage.setItem('codenium_editor_settings', JSON.stringify(newSettings));
            return newSettings;
        });
    };

    return { settings, updateSetting };
}
