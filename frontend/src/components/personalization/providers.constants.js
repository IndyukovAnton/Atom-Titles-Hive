/**
 * Список «запасных» AI-провайдеров. Рекомендации сейчас работают через
 * Claude / Codex — эти настройки задел на будущие интеграции.
 * Используется табом «Провайдеры» в настройках.
 */
export const GENERIC_AI_PROVIDERS = [
    { id: 'openai', name: 'OpenAI (GPT)' },
    { id: 'anthropic', name: 'Anthropic (Claude API)' },
    { id: 'google', name: 'Google (Gemini)' },
    { id: 'cohere', name: 'Cohere' },
    { id: 'local', name: 'Local LLM' },
];
