import { useCallback } from 'react';
import { usePersonalization } from '@/hooks/usePersonalization';
import { useAuthStore } from '@/store/authStore';
/**
 * Сохраняет AI API-ключ: в zustand-стор персонализации (runtime) и в
 * localStorage (per-user, чтобы ключ не уходил на сервер в preferences).
 * `undefined` — ключ не менялся; пустая строка — удалить.
 */
export function useAiKeyPersistence() {
    const { setAiKey } = usePersonalization();
    const userId = useAuthStore((s) => s.user?.id);
    return useCallback((aiKey) => {
        if (aiKey === undefined)
            return;
        setAiKey(aiKey);
        if (aiKey) {
            localStorage.setItem(`ai_secure_key_${userId}`, aiKey);
        }
        else {
            localStorage.removeItem(`ai_secure_key_${userId}`);
        }
    }, [setAiKey, userId]);
}
/**
 * Убирает aiKey из preferences перед отправкой на сервер — ключ хранится
 * только локально (см. useAiKeyPersistence), сервер отдаёт лишь флаг hasAiKey.
 */
export function stripAiKey(prefs) {
    const safe = { ...prefs };
    delete safe.aiKey;
    return safe;
}
