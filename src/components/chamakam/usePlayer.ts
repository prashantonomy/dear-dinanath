"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { phrase, tone, type Playback, type Tempo } from "@/lib/chamakam/tone";
import type { Syl } from "@/lib/chamakam/types";

/**
 * Plays syllables through the shared tone engine and tracks the one sounding.
 * Starting any playback anywhere on the page stops the previous one; each
 * player clears its own state when its phrase ends or is cut off.
 */
export function usePlayer() {
  const [active, setActive] = useState<Syl | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const current = useRef<{ key: string; pb: Playback } | null>(null);

  const stop = useCallback(() => {
    current.current?.pb.stop();
  }, []);

  const play = useCallback(
    async (key: string, syls: Syl[], opts: { tempo?: Tempo; rests?: Set<number> } = {}) => {
      const wasSame = current.current?.key === key;
      current.current?.pb.stop();
      if (wasSame) return false;
      const pb = tone().play(phrase(syls, opts.tempo ?? "steady", opts.rests), (ref) =>
        setActive(ref >= 0 ? syls[ref] : null),
      );
      const mine = { key, pb };
      current.current = mine;
      setPlaying(key);
      const ran = await pb.done;
      if (current.current === mine) {
        current.current = null;
        setPlaying(null);
        setActive(null);
      }
      return ran;
    },
    [],
  );

  useEffect(() => () => current.current?.pb.stop(), []);

  return { active, playing, play, stop };
}
