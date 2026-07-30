import { useState, useEffect } from 'react';
/**
 * Хук для debounce значения
 * @param value - Значение для debounce
 * @param delay - Задержка в миллисекундах (по умолчанию 300мс)
 * @returns Debounced значение
 */
export function useDebounce(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}
