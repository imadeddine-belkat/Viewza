import { useEffect, useState } from "react";

/**
 * Returns a value that updates only after `delay` ms have passed without changes.
 * Useful for search inputs: don't filter/refetch on every keystroke, only when
 * the user pauses typing.
 */
export function useDebounce<T>(value: T, delay: number = 150): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);

    return debounced;
}