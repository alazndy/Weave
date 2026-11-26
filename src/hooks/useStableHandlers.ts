import { useRef, useState } from 'react';

type Handlers = Record<string, (...args: never[]) => unknown>;

/**
 * Returns functions whose identity never changes but which always run the latest version.
 * Needed for memoized children: they skip re-renders, so a plain closure passed to them goes stale
 * (old zoom level, old document) while still being wired to their DOM events.
 * Only for event handlers; do not call the result during render.
 */
export function useStableHandlers<T extends Handlers>(handlers: T): T {
    const latest = useRef(handlers);
    latest.current = handlers;
    const [stable] = useState(() => Object.fromEntries(
        Object.keys(handlers).map(key => [key, (...args: never[]) => latest.current[key](...args)])
    ) as T);
    return stable;
}
