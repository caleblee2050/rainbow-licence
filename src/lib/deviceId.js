const KEY = 'rl_device_id';

export function getOrCreateDeviceId() {
    if (typeof window === 'undefined') return null;
    let id = localStorage.getItem(KEY);
    if (!id) {
        id = `dev-${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
        localStorage.setItem(KEY, id);
    }
    return id;
}
