"use client";

import { useCallback, useSyncExternalStore } from "react";

const noop = () => () => {};

/** true after hydration on the client, false during SSR / hydration. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/** Current time (ms) ticking every `interval` ms; null during SSR. */
export function useNow(interval = 1000): number | null {
  const subscribe = useCallback(
    (cb: () => void) => {
      const id = setInterval(cb, interval);
      return () => clearInterval(id);
    },
    [interval],
  );
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / interval) * interval,
    () => null,
  );
}

let cachedTz: string | null = null;
/** Browser timezone id; null during SSR. */
export function useBrowserTimeZone(): string | null {
  return useSyncExternalStore(
    noop,
    () => (cachedTz ??= Intl.DateTimeFormat().resolvedOptions().timeZone),
    () => null,
  );
}

let cachedAvif: boolean | null = null;
/** Whether canvas can encode AVIF in this browser. */
export function useAvifSupport(): boolean {
  return useSyncExternalStore(
    noop,
    () => {
      if (cachedAvif == null) {
        const c = document.createElement("canvas");
        c.width = 1;
        c.height = 1;
        cachedAvif = c.toDataURL("image/avif").startsWith("data:image/avif");
      }
      return cachedAvif;
    },
    () => false,
  );
}
