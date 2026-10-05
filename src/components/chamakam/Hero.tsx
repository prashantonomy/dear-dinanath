"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { room } from "@/lib/chamakam/data";
import { lineSyllables } from "@/lib/chamakam/svara";
import { phrase, tone, type Playback } from "@/lib/chamakam/tone";
import type { Syl } from "@/lib/chamakam/types";
import { prefersReducedMotion, useLab } from "./lab-context";

// The opening verse and the first two lines of anuvāka 1: how the Chamakam
// actually begins, ridden on its own pitch signal.
const LINES = [room(0).lines[0], room(1).lines[0], room(1).lines[1]];
const SEQ: Syl[] = LINES.flatMap(lineSyllables);
const LINE_ENDS = new Set(
  LINES.map((_, i) => LINES.slice(0, i + 1).reduce((n, l) => n + lineSyllables(l).length, 0) - 1),
);
/** Vertical offset in steps: dip below, level on the axis, lift above. */
const OFF = [1, 0, -1, -1] as const;
const COPIES = 3;
const DRIFT = 22; // px per second while idle

export default function Hero() {
  const { practise } = useLab();
  const stage = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const playback = useRef<Playback | null>(null);
  const active = useRef(-1);
  const stageStill = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [still, setStill] = useState(false);

  // The animation loop: drift while idle, follow the voice while playing.
  useEffect(() => {
    const el = stage.current;
    const tr = track.current;
    if (!el || !tr) return;
    const reduce = prefersReducedMotion();
    const n = SEQ.length;
    let els: HTMLElement[] = [];
    let centers: number[] = [];
    let W = 0;
    let x = 0;
    let lit = -1;
    let raf = 0;
    let last = 0;
    let visible = true;

    const measure = () => {
      els = Array.from(tr.querySelectorAll<HTMLElement>("[data-i]"));
      centers = els.map((e) => e.offsetLeft + e.offsetWidth / 2);
      W = centers[n] - centers[0];
      const P = el.clientWidth / 2;
      if (!x) x = P - centers[n];
    };

    const light = (i: number) => {
      if (i === lit) return;
      if (lit >= 0) els[lit]?.removeAttribute("data-on");
      if (i >= 0) els[i]?.setAttribute("data-on", "");
      lit = i;
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      const P = el.clientWidth / 2;
      if (active.current >= 0) {
        const target = P - centers[n + active.current];
        x = reduce ? target : x + (target - x) * (1 - Math.exp(-dt * 9));
      } else if (!reduce && !stageStill.current) {
        x -= DRIFT * dt;
        if (x < P - centers[2 * n]) x += W;
      }
      tr.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      // light the syllable nearest the playhead
      const at = P - x;
      let lo = 0;
      let hi = centers.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (centers[mid] < at) lo = mid + 1;
        else hi = mid;
      }
      const best = lo > 0 && at - centers[lo - 1] < centers[lo] - at ? lo - 1 : lo;
      light(best);
      if (visible) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      last = 0;
      raf = requestAnimationFrame(frame);
    };

    measure();
    start();
    const ro = new ResizeObserver(() => {
      x = 0;
      measure();
    });
    ro.observe(el);
    void document.fonts?.ready.then(() => {
      x = 0;
      measure();
    });
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else cancelAnimationFrame(raf);
    });
    io.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    stageStill.current = still;
  }, [still]);

  const stop = useCallback(() => {
    playback.current?.stop();
    playback.current = null;
  }, []);

  const play = useCallback(async () => {
    if (playback.current) return stop();
    setPlaying(true);
    const pb = tone().play(phrase(SEQ, "steady", LINE_ENDS), (ref) => {
      if (ref >= 0) active.current = ref;
    });
    playback.current = pb;
    await pb.done;
    if (playback.current === pb) playback.current = null;
    active.current = -1;
    setPlaying(false);
  }, [stop]);

  useEffect(() => stop, [stop]);

  return (
    <section className="ck-hero" aria-labelledby="ck-title">
      <div className="ck-wrap ck-hero__head">
        <h1 id="ck-title" className="ck-h1">
          Chamakam
        </h1>
        <div className="ck-hero__sub">
          <p className="ck-lede">
            Learn it word for word and pitch for pitch. Most of the Chamakam is pattern: once you can see
            the patterns, surprisingly little is left to memorise.
          </p>
          <p className="ck-hero__src">
            <span className="ck-deva" lang="sa">
              चमकप्रश्नः
            </span>
            <span className="ck-read">Taittirīya Saṃhitā 4.7, eleven anuvākas</span>
          </p>
        </div>
      </div>

      <div className="ck-stream" ref={stage}>
        <div className="ck-stream__lanes" aria-hidden="true">
          <span data-lane="lift">
            <i>lift</i>
          </span>
          <span data-lane="level">
            <i>level</i>
          </span>
          <span data-lane="dip">
            <i>dip</i>
          </span>
        </div>
        <div className="ck-stream__head" aria-hidden="true" />
        <div className="ck-stream__mask">
        <div className="ck-stream__track" ref={track} aria-hidden="true">
          {Array.from({ length: COPIES }, (_, c) =>
            SEQ.map((s, i) => {
              const prev = i > 0 ? SEQ[i - 1] : SEQ[SEQ.length - 1];
              const d = OFF[prev.lv] - OFF[s.lv];
              return (
                <span
                  key={`${c}-${i}`}
                  data-i={c * SEQ.length + i}
                  className="ck-st"
                  data-lv={s.lv}
                  data-role={s.role}
                  data-gap={LINE_ENDS.has(i) || undefined}
                  style={
                    {
                      "--off": OFF[s.lv],
                      "--ct": Math.min(0, d),
                      "--cs": Math.abs(d),
                    } as React.CSSProperties
                  }
                >
                  {s.d}
                </span>
              );
            }),
          )}
        </div>
        </div>
        <p className="ck-sr">
          The opening of the Chamakam, drawn as a melody: each syllable sits higher when it lifts (॑) and
          lower when it dips (॒).
        </p>
      </div>

      <div className="ck-wrap ck-hero__foot">
        <div className="ck-hero__actions">
          <button type="button" className="ck-btn" data-primary onClick={play} aria-pressed={playing}>
            {playing ? <StopIcon /> : <PlayIcon />}
            {playing ? "Stop" : "Hear the opening"}
          </button>
          <button type="button" className="ck-btn" onClick={() => practise(1)}>
            Start practising
          </button>
        </div>
        <button
          type="button"
          className="ck-hero__still ck-read"
          onClick={() => setStill((v) => !v)}
          aria-pressed={still}
        >
          {still ? "Resume motion" : "Pause motion"}
        </button>
      </div>
    </section>
  );
}

export function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2.5 1.5v9l8-4.5z" fill="currentColor" />
    </svg>
  );
}

export function StopIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <rect x="2" y="2" width="8" height="8" rx="1" fill="currentColor" />
    </svg>
  );
}
