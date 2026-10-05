"use client";

import { useMemo, useState } from "react";

import { CK, itemSyllables, SCENES } from "@/lib/chamakam/data";
import { lineSyllables } from "@/lib/chamakam/svara";
import type { Level } from "@/lib/chamakam/types";
import { roomState, useProgress } from "@/lib/chamakam/progress";
import Glyph from "./Glyph";
import { useLab } from "./lab-context";
import SylText from "./SylText";

const C = 300;
const R0 = 172;
const TICK: Record<Level, number> = { 0: 8, 1: 16, 2: 30, 3: 42 };
const GAP = 0.03; // radians between rooms
const r2 = (v: number) => Math.round(v * 100) / 100;

interface Segment {
  n: number;
  a0: number;
  a1: number;
  paths: { lv: Level; frame: boolean; d: string }[];
  hit: string;
  label: [number, number];
}

// Lay every syllable of the chant around one circle, room by room.
const SEGMENTS: Segment[] = (() => {
  const total = CK.anuvakas.reduce((n, a) => n + a.sylCount, 0);
  const span = Math.PI * 2 - GAP * CK.anuvakas.length;
  let a = -Math.PI / 2 + GAP / 2;
  return CK.anuvakas.map((room) => {
    const syls = room.lines.flatMap(lineSyllables);
    const width = (room.sylCount / total) * span;
    const buckets = new Map<string, string[]>();
    syls.forEach((s, i) => {
      const t = a + ((i + 0.5) / syls.length) * width;
      const len = TICK[s.lv];
      const key = `${s.lv}${s.role === "p" ? "" : "f"}`;
      const d = `M${r2(C + Math.cos(t) * R0)} ${r2(C + Math.sin(t) * R0)}L${r2(C + Math.cos(t) * (R0 + len))} ${r2(C + Math.sin(t) * (R0 + len))}`;
      buckets.set(key, [...(buckets.get(key) ?? []), d]);
    });
    const a0 = a;
    const a1 = a + width;
    const ri = R0 - 18;
    const ro = R0 + 60;
    const large = width > Math.PI ? 1 : 0;
    const p = (rad: number, ang: number) => `${r2(C + Math.cos(ang) * rad)} ${r2(C + Math.sin(ang) * rad)}`;
    const hit = `M${p(ri, a0)}L${p(ro, a0)}A${ro} ${ro} 0 ${large} 1 ${p(ro, a1)}L${p(ri, a1)}A${ri} ${ri} 0 ${large} 0 ${p(ri, a0)}Z`;
    const mid = (a0 + a1) / 2;
    const seg: Segment = {
      n: room.n,
      a0,
      a1,
      paths: [...buckets].map(([key, ds]) => ({
        lv: Number(key[0]) as Level,
        frame: key.endsWith("f"),
        d: ds.join(""),
      })),
      hit,
      label: [r2(C + Math.cos(mid) * (R0 + 74)), r2(C + Math.sin(mid) * (R0 + 74))],
    };
    a = a1 + GAP;
    return seg;
  });
})();

/** The first payload of each room: its door. */
const DOORS = CK.anuvakas.map((a) => itemSyllables(a.items[0]).filter((s) => s.role === "p"));

const STORY: Record<number, string> = {
  1: "you eat",
  2: "rise to the top",
  3: "settle in peace",
  4: "feast",
  5: "dig into stone",
  6: "meet Agni and the gods",
  7: "press the soma stalk",
  8: "stack the firewood",
  9: "light the great fire",
  10: "calves on the way",
  11: "and you count: one",
};

function roomLabel(n: number) {
  return n === 0 ? "Opening" : n === 12 ? "Closing" : `Anuvāka ${n}`;
}

export default function Palace() {
  const { room, setRoom, practise } = useLab();
  const [hover, setHover] = useState<number | null>(null);
  const progress = useProgress();
  const now = useMemo(() => Date.now(), [progress]);
  const shown = hover ?? room;
  const a = CK.anuvakas[shown];

  return (
    <section id="palace" className="ck-sec" aria-labelledby="ck-palace-title">
      <div className="ck-wrap">
        <div className="ck-stack ck-palace__intro">
          <h2 id="ck-palace-title" className="ck-h2">
            A palace of eleven rooms
          </h2>
          <p className="ck-p">
            Memory champions keep long sequences in order by walking through a building they know, placing
            one image at each spot: the method of loci. The Chamakam is already built that way. Each
            anuvāka is one scene, and the scenes run inside out: your body, your standing, your home, the
            harvest, the earth, the gods, the cups and tools of the sacrifice, the sky, the herd, and
            finally a count.
          </p>
        </div>

        <div className="ck-palace">
          <div className="ck-ring" onPointerLeave={() => setHover(null)}>
            <svg viewBox="0 0 600 600" role="img" aria-label="Every syllable of the Chamakam around one circle, room by room. Longer ticks lift, shorter ticks dip.">
              <circle cx={C} cy={C} r={R0 - 1} className="ck-ring__base" />
              {SEGMENTS.map((seg) => (
                <g
                  key={seg.n}
                  className="ck-ring__seg"
                  data-on={seg.n === shown || undefined}
                  onPointerEnter={() => setHover(seg.n)}
                  onClick={() => setRoom(seg.n)}
                >
                  <path d={seg.hit} className="ck-ring__hit" />
                  {seg.paths.map((p) => (
                    <path key={`${p.lv}${p.frame}`} d={p.d} data-lv={p.lv} data-frame={p.frame || undefined} />
                  ))}
                  <g transform={`translate(${seg.label[0] - 11} ${seg.label[1] - 11})`} className="ck-ring__glyph">
                    <Glyph name={CK.anuvakas[seg.n].glyph} size={22} />
                  </g>
                </g>
              ))}
            </svg>
            <div className="ck-ring__core" aria-live="polite">
              <span className="ck-read">{roomLabel(a.n)}</span>
              <span className="ck-ring__name">{a.name}</span>
              <span className="ck-ring__door">
                <SylText syls={DOORS[a.n]} />
              </span>
              <span className="ck-read ck-num">
                {a.items.length} items, {a.sylCount} syllables
              </span>
            </div>
          </div>

          <div className="ck-rooms">
            <ol>
              {CK.anuvakas.map((r) => {
                const st = roomState(progress.rooms[r.n], now);
                return (
                  <li key={r.n}>
                    <button
                      type="button"
                      className="ck-room"
                      aria-pressed={room === r.n}
                      onClick={() => setRoom(r.n)}
                      onPointerEnter={() => setHover(r.n)}
                      onPointerLeave={() => setHover(null)}
                      onFocus={() => setHover(r.n)}
                      onBlur={() => setHover(null)}
                    >
                      <Glyph name={r.glyph} size={20} />
                      <span className="ck-room__n ck-num">{r.n === 0 ? "ॐ" : r.n === 12 ? "॥" : r.n}</span>
                      <span className="ck-room__name">{r.name}</span>
                      <span className="ck-room__door">
                        <SylText syls={DOORS[r.n]} />
                      </span>
                      <span className="ck-room__state ck-read" data-kind={st.kind}>
                        {st.kind === "new" ? "" : st.kind === "due" ? "review due" : `in ${st.days}d`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="ck-rooms__scene">
              <p className="ck-p">{SCENES[shown]}</p>
              <button type="button" className="ck-btn" data-primary onClick={() => practise(shown)}>
                Practise {shown === 0 ? "the opening" : shown === 12 ? "the closing" : `anuvāka ${shown}`}
              </button>
            </div>
          </div>
        </div>

        <div className="ck-doors">
          <h3 className="ck-h3">Learn the doors first</h3>
          <p className="ck-p">
            The first word of each room is its door. Chain the eleven doors into one silly story and you
            will always know which room comes next. Linking items into a story is one of the oldest
            findings in memory research.
          </p>
          <ol className="ck-doors__chain">
            {CK.anuvakas
              .filter((r) => r.n >= 1 && r.n <= 11)
              .map((r) => (
                <li key={r.n}>
                  <span className="ck-read ck-num">{r.n}</span>
                  <span className="ck-doors__word">
                    <SylText syls={DOORS[r.n]} />
                  </span>
                  <span className="ck-doors__story">{STORY[r.n]}</span>
                </li>
              ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
