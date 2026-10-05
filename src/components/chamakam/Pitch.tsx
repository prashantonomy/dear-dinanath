"use client";

import { CORE, CORE_STATS, room } from "@/lib/chamakam/data";
import { lineSyllables } from "@/lib/chamakam/svara";
import { tone } from "@/lib/chamakam/tone";
import type { Level } from "@/lib/chamakam/types";
import { PlayIcon, StopIcon } from "./Hero";
import { excerpt, Score } from "./Score";
import { usePlayer } from "./usePlayer";

const A1 = room(1).lines[0];
const SPECIMEN = excerpt(A1, A1.items[0], A1.items[2]);
const SPECIMEN_SYLS = lineSyllables(SPECIMEN);

// How often a lift comes straight after a level syllable (the beat).
const LIFTS = (() => {
  let total = 0;
  let afterLevel = 0;
  for (const a of CORE) {
    const seq = a.lines.flatMap(lineSyllables);
    seq.forEach((s, k) => {
      if (s.lv < 2) return;
      total++;
      if (k > 0 && seq[k - 1].lv === 1) afterLevel++;
    });
  }
  return { total, afterLevel };
})();

const LEGEND: { lv: Level; name: string; mark: string; sample: string; term: string }[] = [
  { lv: 2, name: "Lift", mark: "stroke above", sample: "श्च॑", term: "svarita" },
  { lv: 1, name: "Level", mark: "no mark", sample: "वा", term: "udātta and the flat run" },
  { lv: 0, name: "Dip", mark: "bar below", sample: "स॒", term: "anudātta" },
  { lv: 3, name: "Lift and hold", mark: "double stroke", sample: "वा᳚", term: "dīrgha svarita" },
];

export default function Pitch() {
  const { active, playing, play } = usePlayer();
  const counts = CORE_STATS.levels;

  return (
    <section id="pitch" className="ck-sec" aria-labelledby="ck-pitch-title">
      <div className="ck-wrap ck-split">
        <div className="ck-stack">
          <h2 id="ck-pitch-title" className="ck-h2">
            Three pitches and one rule
          </h2>
          <p className="ck-p">
            The marks are a melody. A stroke above <span className="ck-mark ck-flame">◌॑</span> lifts
            the syllable, a bar below <span className="ck-mark ck-water">◌॒</span> dips it, and a
            double stroke <span className="ck-mark ck-ember">◌᳚</span> lifts and holds. No mark means
            level.
          </p>
          <p className="ck-p">
            <strong>Every word leans on one syllable, its beat.</strong> The syllable before the beat
            dips; the one after it lifts; the rest stay level. Of the {LIFTS.total} lifts in anuvākas 1
            to 11, {LIFTS.afterLevel} come straight after a level syllable. Learn where each word’s
            beat falls and the marks follow.
          </p>
          <p className="ck-p">
            Trace it with your hand, the same way every time: down for a dip, flat for level, up for a
            lift. Gestures that follow pitch help it stick, and Yajurveda reciters have long marked the
            accents with the hand.
          </p>
        </div>

        <div className="ck-pitch">
          <ul className="ck-legend">
            {LEGEND.map((row) => (
              <li key={row.lv} data-lv={row.lv}>
                <span className="ck-legend__sample ck-deva">{row.sample}</span>
                <span className="ck-legend__lane" aria-hidden="true">
                  <i />
                </span>
                <span className="ck-legend__name">
                  <b>{row.name}</b>
                  <span className="ck-read">
                    {row.mark}, {row.term}
                  </span>
                </span>
                <span className="ck-legend__count ck-read ck-num">{counts[row.lv]}</span>
                <button
                  type="button"
                  className="ck-btn"
                  data-small
                  onClick={() => tone().ping(row.lv, row.lv === 3 ? 1.1 : 0.7)}
                  aria-label={`Hear ${row.name.toLowerCase()}`}
                >
                  <PlayIcon />
                </button>
              </li>
            ))}
          </ul>
          <p className="ck-read ck-legend__note">
            Counts are syllables in anuvākas 1 to 11. The tone guide plays each as a piano note: lift
            E, level D, dip C; lift and hold stays on E, then drops to D.
          </p>

          <div className="ck-specimen">
            <div className="ck-specimen__head">
              <span className="ck-read">The first three wishes, beats dotted</span>
              <button
                type="button"
                className="ck-btn"
                data-small
                onClick={() => play("specimen", SPECIMEN_SYLS, { tempo: "slow" })}
                aria-pressed={playing === "specimen"}
              >
                {playing === "specimen" ? <StopIcon /> : <PlayIcon />}
                {playing === "specimen" ? "Stop" : "Hear it"}
              </button>
            </div>
            <div className="ck-specimen__score">
              <Score line={SPECIMEN} beats active={active} />
            </div>
            <dl className="ck-specimen__notes">
              <div>
                <dt className="ck-deva">वाज॑श्च मे</dt>
                <dd>
                  Beat on <span className="ck-deva">वा</span>, so <span className="ck-deva ck-flame">ज॑</span>{" "}
                  lifts and <span className="ck-deva">च</span> stays level.
                </dd>
              </div>
              <div>
                <dt className="ck-deva">प्रस॒वश्च॑ मे॒</dt>
                <dd>
                  Beat on <span className="ck-deva">व</span>: <span className="ck-deva ck-water">स॒</span>{" "}
                  dips before it, <span className="ck-deva ck-flame">श्च॑</span> lifts after it, and{" "}
                  <span className="ck-deva ck-water">मे॒</span> dips because the next beat,{" "}
                  <span className="ck-deva">प्र</span>, follows.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
