/**
 * Performance utilities for Intelligent Health Platform
 * 
 * Provides memoization, debouncing, throttling, and lazy loading helpers.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Debounce a function to limit how often it can be called.
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return function (...args: Parameters<T>) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, wait);
    };
}

/**
 * Throttle a function to limit how often it can be called.
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return function (...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/**
 * Memoize a function to cache results based on arguments.
 */
export function memoize<T extends (...args: any[]) => any>(
    func: T,
    maxCacheSize: number = 100
): T {
    const cache = new Map<string, ReturnType<T>>();

    return ((...args: Parameters<T>): ReturnType<T> => {
        const key = JSON.stringify(args);

        if (cache.has(key)) {
            return cache.get(key)!;
        }

        const result = func(...args);

        // Limit cache size
        if (cache.size >= maxCacheSize) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }

        cache.set(key, result);
        return result;
    }) as T;
}

/**
 * Hook for debounced values - useful for search inputs.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

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

/**
 * Hook for debounced callbacks.
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    return useCallback(
        debounce((...args: Parameters<T>) => callbackRef.current(...args), delay) as T,
        [delay]
    ) as T;
}

/**
 * Hook for throttled callbacks.
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
    callback: T,
    limit: number
): T {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    return useCallback(
        throttle((...args: Parameters<T>) => callbackRef.current(...args), limit) as T,
        [limit]
    ) as T;
}

/**
 * Hook for lazy loading data with caching.
 */
export function useLazyLoad<T>(
    fetchFn: () => Promise<T>,
    deps: any[] = []
): { data: T | null; loading: boolean; error: Error | null; refetch: () => void } {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchFn();
            setData(result);
        } catch (e) {
            setError(e instanceof Error ? e : new Error('Unknown error'));
        } finally {
            setLoading(false);
        }
    }, deps);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { data, loading, error, refetch: fetch };
}

/**
 * Hook for intersection observer - lazy load on scroll.
 */
export function useIntersectionObserver(
    options: IntersectionObserverInit = {}
): [React.RefObject<HTMLDivElement>, boolean] {
    const ref = useRef<HTMLDivElement>(null);
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        }, options);

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [options.root, options.rootMargin, options.threshold]);

    return [ref, isIntersecting];
}

/**
 * Format bytes to human readable string.
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format duration in milliseconds to human readable string.
 */
export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Performance timing utility.
 */
export const perf = {
    marks: new Map<string, number>(),

    start(name: string) {
        this.marks.set(name, performance.now());
    },

    end(name: string): number {
        const start = this.marks.get(name);
        if (!start) return 0;
        const duration = performance.now() - start;
        this.marks.delete(name);
        console.debug(`[Perf] ${name}: ${formatDuration(duration)}`);
        return duration;
    },

    measure<T>(name: string, fn: () => T): T {
        this.start(name);
        const result = fn();
        this.end(name);
        return result;
    },

    async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
        this.start(name);
        const result = await fn();
        this.end(name);
        return result;
    }
};

/**
 * Request idle callback polyfill.
 */
export const requestIdleCallback =
    window.requestIdleCallback ||
    ((cb: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void) => {
        const start = Date.now();
        return setTimeout(() => {
            cb({
                didTimeout: false,
                timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
            });
        }, 1);
    });

/**
 * Cancel idle callback polyfill.
 */
export const cancelIdleCallback =
    window.cancelIdleCallback ||
    ((id: number) => clearTimeout(id));

/**
 * Queue low-priority work to run when browser is idle.
 */
export function runWhenIdle(callback: () => void, timeout: number = 5000): void {
    requestIdleCallback(() => callback(), { timeout });
}
