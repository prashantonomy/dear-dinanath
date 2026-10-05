"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CK, CORE, CORE_STATS, CORE_SYLLABLES, fmt, itemSyllables } from "@/lib/chamakam/data";
import type { Syl } from "@/lib/chamakam/types";
import { prefersReducedMotion } from "./lab-context";
import SylText from "./SylText";

// Every item whose words come first and frame after: the slot and the frame.
const SLOTS = CORE.flatMap((a) => a.items)
  .map((id) => {
    const syls = itemSyllables(id);
    const k = syls.findIndex((s) => s.role !== "p");
    const clean = k > 0 && syls.slice(k).every((s) => s.role !== "p");
    return clean ? { id, word: syls.slice(0, k), frame: syls.slice(k) } : null;
  })
  .filter((x): x is { id: number; word: Syl[]; frame: Syl[] } => x !== null);

const FRAME_COUNT = CORE_STATS.refrain + CORE_STATS.fixed;
const PERCENT = Math.round((FRAME_COUNT / CORE_STATS.syllables) * 100);
const CA_ME = CK.items.filter(
  (it) => it.anuvaka >= 1 && it.anuvaka <= 11 && itemSyllables(it.id).some((s) => s.role === "r" && s.d.includes("च")),
).length;

/** Runs of payload / frame syllables, for the barcode. */
const RUNS = (() => {
  const runs: { x: number; w: number; frame: boolean }[] = [];
  CORE_SYLLABLES.forEach((s, i) => {
    const frame = s.role !== "p";
    const last = runs[runs.length - 1];
    if (last && last.frame === frame) last.w++;
    else runs.push({ x: i, w: 1, frame });
  });
  return runs;
})();

export default function Frame() {
  const [i, setI] = useState(0);
  const [running, setRunning] = useState(true);
  const [inView, setInView] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!running || !inView || prefersReducedMotion()) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % SLOTS.length), 1600);
    return () => window.clearInterval(t);
  }, [running, inView]);

  const slot = SLOTS[i];
  const item = CK.items[slot.id];
  const frameKey = useMemo(() => slot.frame.map((s) => s.d).join(""), [slot]);

  return (
    <section id="frame" className="ck-sec" aria-labelledby="ck-frame-title">
      <div className="ck-wrap ck-split">
        <div className="ck-stack">
          <h2 id="ck-frame-title" className="ck-h2">
            One sentence, said {CA_ME} times
          </h2>
          <p className="ck-p">
            Almost every line of the Chamakam is the same frame with one word swapped in: ___{" "}
            <span className="ck-deva">च मे</span>, “and ___ for me”. You never have to memorise the
            frame. You memorise what goes in the slot.
          </p>
          <p className="ck-p">
            Of the {fmt(CORE_STATS.syllables)} syllables in anuvākas 1 to 11,{" "}
            <strong>{FRAME_COUNT} ({PERCENT}%)</strong> are frame: <span className="ck-deva">च मे</span>{" "}
            and its two cousins, <span className="ck-deva">इन्द्र॑श्च मे</span> and{" "}
            <span className="ck-deva">य॒ज्ञेन॑ कल्पताम्</span>.
          </p>
        </div>

        <div className="ck-frame" ref={box}>
          <div className="ck-frame__slot" aria-live="off">
            <span className="ck-frame__word" key={slot.id}>
              <SylText syls={slot.word} />
            </span>
            <span className="ck-frame__rest" key={frameKey}>
              <SylText syls={slot.frame} />
            </span>
          </div>
          <p className="ck-frame__gloss">
            … and <span>{item.gloss}</span> for me
          </p>
          <div className="ck-frame__meta">
            <span className="ck-read ck-num">
              Item {String(i + 1).padStart(3, "0")} of {SLOTS.length}, anuvāka {item.anuvaka}
            </span>
            <button
              type="button"
              className="ck-read ck-frame__pause"
              onClick={() => setRunning((v) => !v)}
              aria-pressed={!running}
            >
              {running ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              className="ck-read ck-frame__pause"
              onClick={() => setI((v) => (v + 1) % SLOTS.length)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <figure className="ck-wrap ck-barcode">
        <svg
          viewBox={`0 0 ${CORE_SYLLABLES.length} 40`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${CORE_STATS.syllables} syllables in order; ${FRAME_COUNT} of them are frame.`}
        >
          {RUNS.map((r) => (
            <rect key={r.x} x={r.x} y={0} width={r.w} height={40} data-frame={r.frame || undefined} />
          ))}
        </svg>
        <figcaption className="ck-read">
          Every syllable of anuvākas 1 to 11, left to right. Bright: the words you learn. Dim: the frame.
        </figcaption>
      </figure>
    </section>
  );
}
