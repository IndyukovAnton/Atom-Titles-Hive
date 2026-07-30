import axios from './client';
import { config } from '../config';
import { useAuthStore } from '../store/authStore';
const getAuthToken = () => {
    const fromStore = useAuthStore.getState().token;
    if (fromStore)
        return fromStore;
    const storage = localStorage.getItem('seen-auth-storage');
    if (!storage)
        return null;
    try {
        const parsed = JSON.parse(storage);
        return parsed?.state?.token ?? null;
    }
    catch {
        return null;
    }
};
const STALL_TIMEOUT_MS = 90_000;
/**
 * Streams AI recommendations via SSE. Caller passes an AbortSignal to cancel
 * mid-stream (kills CLI / aborts API request server-side).
 *
 * Встроенный stall-watchdog: если за STALL_TIMEOUT_MS не пришло ни одного
 * байта (включая keepalive-пинги сервера) — соединение считается мёртвым
 * (типично при тихом обрыве сети/VPN, когда TCP не шлёт FIN) и запрос
 * прерывается с понятной ошибкой вместо бесконечного ожидания.
 */
export async function* streamAiRecommendations(payload, signal) {
    const baseUrl = config.getApiUrl();
    const token = getAuthToken();
    const internal = new AbortController();
    const onExternalAbort = () => internal.abort();
    signal.addEventListener('abort', onExternalAbort);
    let stalled = false;
    let stallTimer = null;
    const resetStallTimer = () => {
        if (stallTimer)
            clearTimeout(stallTimer);
        stallTimer = setTimeout(() => {
            stalled = true;
            internal.abort();
        }, STALL_TIMEOUT_MS);
    };
    try {
        resetStallTimer();
        const response = await fetch(`${baseUrl}/recommendations/ai`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'text/event-stream',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(payload),
            signal: internal.signal,
        });
        if (!response.ok || !response.body) {
            let message = `Stream request failed (HTTP ${response.status})`;
            try {
                const text = await response.text();
                if (text)
                    message = text;
            }
            catch {
                // ignore
            }
            throw new Error(message);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        while (true) {
            const { value, done } = await reader.read();
            if (done)
                break;
            resetStallTimer();
            buffer += decoder.decode(value, { stream: true });
            let blockEnd;
            while ((blockEnd = buffer.indexOf('\n\n')) >= 0) {
                const block = buffer.slice(0, blockEnd);
                buffer = buffer.slice(blockEnd + 2);
                const event = parseSseBlock(block);
                if (event)
                    yield event;
            }
        }
    }
    catch (err) {
        if (stalled) {
            throw new Error('Соединение с сервером потеряно: нет данных более 90 секунд. Проверьте сеть (VPN/прокси) и попробуйте снова.');
        }
        throw err;
    }
    finally {
        if (stallTimer)
            clearTimeout(stallTimer);
        signal.removeEventListener('abort', onExternalAbort);
    }
}
function parseSseBlock(raw) {
    const lines = raw.split(/\r?\n/);
    let evtName = '';
    const dataParts = [];
    for (const line of lines) {
        if (line.startsWith('event: '))
            evtName = line.slice(7).trim();
        else if (line.startsWith('data: '))
            dataParts.push(line.slice(6));
    }
    if (!evtName || dataParts.length === 0)
        return null;
    let parsed;
    try {
        parsed = JSON.parse(dataParts.join('\n'));
    }
    catch {
        return null;
    }
    if (!parsed || typeof parsed !== 'object')
        return null;
    return { kind: evtName, ...parsed };
}
export const recommendationsApi = {
    getTopRated: async (limit = 10) => {
        const response = await axios.get(`/recommendations/top-rated?limit=${limit}`);
        return response.data;
    },
    getByGenres: async () => {
        const response = await axios.get('/recommendations/genres');
        return response.data;
    },
    getCliStatus: async () => {
        const response = await axios.get('/recommendations/ai/cli-status');
        return response.data;
    },
    getCodexCliStatus: async () => {
        const response = await axios.get('/recommendations/ai/codex-cli-status');
        return response.data;
    },
};
