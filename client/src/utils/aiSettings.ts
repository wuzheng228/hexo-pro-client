export interface AISettings {
    url: string;
    apiKey: string;
    model: string;
    enableThinking: boolean;
    maxTokens: number;
    temperature: number;
    topP: number;
}

const DEFAULT_AI_SETTINGS: AISettings = {
    url: '',
    apiKey: '',
    model: '',
    enableThinking: false,
    maxTokens: 4000,
    temperature: 0.7,
    topP: 0.9,
};

const STORAGE_KEY = 'hexoProAISettings';

export function getAISettings(): AISettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error('Failed to parse AI settings:', error);
    }
    return DEFAULT_AI_SETTINGS;
}

export function saveAISettings(settings: Partial<AISettings>): void {
    try {
        const currentSettings = getAISettings();
        const newSettings = { ...currentSettings, ...settings };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
        console.error('Failed to save AI settings:', error);
    }
}

export function isAISConfigured(): boolean {
    const settings = getAISettings();
    return !!(settings.url && settings.apiKey && settings.model);
}

export function clearAISettings(): void {
    localStorage.removeItem(STORAGE_KEY);
}
