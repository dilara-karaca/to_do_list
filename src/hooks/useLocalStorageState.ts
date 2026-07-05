import { useEffect, useState } from 'react';

export function useLocalStorageState<T>(storageKey: string, fallbackValue: T) {
    const [value, setValue] = useState<T>(fallbackValue);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored !== null) {
                setValue(JSON.parse(stored) as T);
            }
        } catch {
            setValue(fallbackValue);
        } finally {
            setIsReady(true);
        }
    }, [fallbackValue, storageKey]);

    useEffect(() => {
        if (!isReady) {
            return;
        }

        localStorage.setItem(storageKey, JSON.stringify(value));
    }, [isReady, storageKey, value]);

    return [value, setValue, isReady] as const;
}