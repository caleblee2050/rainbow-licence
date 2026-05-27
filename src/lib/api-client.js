async function jsonFetch(url, options = {}) {
    let res;
    try {
        res = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers ?? {}),
            },
            credentials: 'same-origin',
        });
    } catch {
        throw new Error('네트워크 연결을 확인해주세요');
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `${res.status}`);
    }
    return res.json();
}

export const api = {
    // 인증
    async deviceAnon({ deviceId, schoolCode, language }) {
        return jsonFetch('/api/auth/device-anon', { method: 'POST', body: JSON.stringify({ deviceId, schoolCode, language }) });
    },
    async sendMagicLink(email) {
        return jsonFetch('/api/auth/magic-link', { method: 'POST', body: JSON.stringify({ email }) });
    },
    async logout() {
        return jsonFetch('/api/auth/logout', { method: 'POST' });
    },
    async me() {
        return jsonFetch('/api/me');
    },
    // 자료
    async createSourceText({ licenceId, title, text }) {
        return jsonFetch('/api/sources', { method: 'POST', body: JSON.stringify({ licenceId, title, text }) });
    },
    async createSourcePdf({ licenceId, title, file }) {
        const form = new FormData();
        form.set('licenceId', licenceId);
        form.set('title', title);
        form.set('file', file);
        let res;
        try {
            res = await fetch('/api/sources', { method: 'POST', body: form, credentials: 'same-origin' });
        } catch {
            throw new Error('네트워크 연결을 확인해주세요');
        }
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(err.error || `${res.status}`);
        }
        return res.json();
    },
    async listSources(licenceId) {
        return jsonFetch(`/api/sources?licence_id=${encodeURIComponent(licenceId)}`);
    },
    async getSource(id) {
        return jsonFetch(`/api/sources/${id}`);
    },
    async processSource(id) {
        return jsonFetch(`/api/sources/${id}/process`, { method: 'POST' });
    },
    async retrySource(id) {
        return jsonFetch(`/api/sources/${id}/retry`, { method: 'POST' });
    },
    async deleteSource(id) {
        return jsonFetch(`/api/sources/${id}`, { method: 'DELETE' });
    },
    // 자격증 통합
    async userConcepts(licenceId) {
        return jsonFetch(`/api/licences/${encodeURIComponent(licenceId)}/concepts`);
    },
    async userProblems(licenceId) {
        return jsonFetch(`/api/licences/${encodeURIComponent(licenceId)}/problems`);
    },
};
