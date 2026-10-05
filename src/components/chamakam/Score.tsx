"use client";

import { memo } from "react";

import { blocksOf, CK, type Block } from "@/lib/chamakam/data";
import type { Line, Syl } from "@/lib/chamakam/types";

/** How much of the line is shown: everything, first sounds, the tune only, or nothing. */
export type Cue = "full" | "hint" | "tune" | "blank";
export type Script = "deva" | "roman";

// Lane of each pitch on the little staff under a syllable: 0 top … 2 bottom.
const LANE = [2, 1, 0, 0] as const;

interface Layout {
  blocks: Block[];
  /** Connector from the previous syllable's lane: [top lane, span in lanes]. */
  steps: Map<Syl, [number, number]>;
}

const LAYOUTS = new Map<string, Layout>();

function layoutFor(line: Line): Layout {
  let l = LAYOUTS.get(line.id);
  if (!l) {
    const steps = new Map<Syl, [number, number]>();
    let prev: Syl | null = null;
    for (const t of line.tokens) {
      if (t.kind !== "word") continue;
      for (const s of t.syls) {
        if (prev && LANE[prev.lv] !== LANE[s.lv]) {
          const a = LANE[prev.lv];
          const c = LANE[s.lv];
          steps.set(s, [Math.min(a, c), Math.abs(a - c)]);
        }
        prev = s;
      }
    }
    l = { blocks: blocksOf(line), steps };
    LAYOUTS.set(line.id, l);
  }
  return l;
}

/** A line cut down to a run of its items (for specimens). */
export function excerpt(line: Line, firstItem: number, lastItem: number): Line {
  const keep = (s: Syl) => s.item >= firstItem && s.item <= lastItem;
  const tokens: Line["tokens"] = [];
  let lastKept = false;
  for (const t of line.tokens) {
    if (t.kind === "punct") {
      if (lastKept) tokens.push(t);
      continue;
    }
    const syls = t.syls.filter(keep);
    lastKept = keep(t.syls[t.syls.length - 1]);
    if (syls.length) tokens.push({ kind: "word", syls });
  }
  return {
    ...line,
    id: `${line.id}:${firstItem}-${lastItem}`,
    items: line.items.filter((i) => i >= firstItem && i <= lastItem),
    tokens,
  };
}

/** Plain text of a line, for screen readers and titles. */
export function lineText(line: Line, script: Script = "deva"): string {
  return line.tokens
    .map((t) => (t.kind === "punct" ? t.text : t.syls.map((s) => (script === "deva" ? s.d : s.r)).join("")))
    .join(" ")
    .replace(/ ,/g, ",");
}

const Syllable = memo(function Syllable({
  s,
  script,
  on,
  step,
}: {
  s: Syl;
  script: Script;
  on: boolean;
  step?: [number, number];
}) {
  return (
    <span
      className="ck-s"
      data-lv={s.lv}
      data-role={s.role}
      data-lead={s.lead || undefined}
      data-beat={s.beat || undefined}
      data-long={s.long || undefined}
      data-on={on || undefined}
      style={step ? ({ "--ct": step[0], "--cs": step[1] } as React.CSSProperties) : undefined}
    >
      <span className="ck-s__g">{script === "deva" ? s.d : s.r}</span>
      <span className="ck-s__bar" data-step={step ? "" : undefined} />
    </span>
  );
});

/**
 * One line of the chant as a svara score: each syllable sits over a three-lane
 * staff (lift · level · dip) so the melody is visible as a shape. Items render
 * as blocks that wrap together; the gloss, when shown, sits under its item.
 */
export const Score = memo(function Score({
  line,
  cue = "full",
  script = "deva",
  gloss = false,
  beats = false,
  active = null,
  peek = false,
  label,
}: {
  line: Line;
  cue?: Cue;
  script?: Script;
  gloss?: boolean;
  /** Mark each word's beat (udātta) with a dot. */
  beats?: boolean;
  active?: Syl | null;
  peek?: boolean;
  label?: string;
}) {
  const { blocks, steps } = layoutFor(line);
  const shown = peek || cue === "full";
  return (
    <div
      className="ck-score"
      data-cue={peek ? "full" : cue}
      data-script={script}
      data-beats={beats || undefined}
      role="group"
      aria-label={label ?? (shown ? lineText(line, script) : "Hidden line")}
    >
      {blocks.map((b) => (
        <span key={b.item} className="ck-block" data-space={b.space || undefined} aria-hidden="true">
          <span className="ck-block__w">
            {b.frags.map((f, i) => (
              <span key={i} className="ck-frag" data-space={(i > 0 && f.space) || undefined}>
                {f.syls.map((s, k) => (
                  <Syllable key={k} s={s} script={script} on={s === active} step={steps.get(s)} />
                ))}
              </span>
            ))}
            {b.punct && <span className="ck-punct">{b.punct}</span>}
          </span>
          {gloss && <span className="ck-gloss">{CK.items[b.item].gloss}</span>}
        </span>
      ))}
    </div>
  );
});
