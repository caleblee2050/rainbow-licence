import Anthropic from '@anthropic-ai/sdk';

let _client = null;
export function getAnthropic() {
    if (_client) return _client;
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('ANTHROPIC_API_KEY not set');
    _client = new Anthropic({ apiKey: key });
    return _client;
}

export function getModel() {
    return process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
}
