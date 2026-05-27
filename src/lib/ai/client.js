import Anthropic from '@anthropic-ai/sdk';

let _client = null;
export function getAnthropic() {
    if (_client) return _client;
    const key = process.env.KIE_API_KEY;
    if (!key) throw new Error('KIE_API_KEY not set');
    _client = new Anthropic({
        baseURL: 'https://api.kie.ai/claude',
        authToken: key,
    });
    return _client;
}

export function getModel() {
    return process.env.LLM_MODEL || 'claude-sonnet-4-6';
}
