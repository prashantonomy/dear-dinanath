"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * A small per-browser preference (cue level, script, tempo…). Starts from the
 * default on the server and on first paint, then picks up the stored value, so
 * the static HTML and the hydrated page always match.
 */
export function usePref<T extends string | boolean>(key: string, initial: T, allowed?: readonly T[]) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`dd-chamakam-${key}`);
      if (raw === null) return;
      const parsed = JSON.parse(raw) as T;
      if (typeof parsed !== typeof initial) return;
      if (allowed && !allowed.includes(parsed)) return;
      setValue(parsed);
    } catch {
      // unreadable storage: keep the default
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(`dd-chamakam-${key}`, JSON.stringify(next));
      } catch {
        // storage unavailable: the choice lasts for this visit only
      }
    },
    [key],
  );

  return [value, set] as const;
}
