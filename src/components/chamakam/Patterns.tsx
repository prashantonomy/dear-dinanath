"use client";

import { CK, CORE_STATS, findItem, itemSyllables, room } from "@/lib/chamakam/data";
import { lineSyllables } from "@/lib/chamakam/svara";
import type { Item, Syl } from "@/lib/chamakam/types";
import { excerpt, Score } from "./Score";
import SylText from "./SylText";

const payload = (it: Item): Syl[] => itemSyllables(it.id).filter((s) => s.role === "p");

/** Items that ask for something (the closing "may it thrive by yajña" phrases excluded). */
const WISHES = CK.items.filter((it) => it.anuvaka >= 1 && it.anuvaka <= 11 && payload(it).length > 0).length;
const whole = (it: Item): Syl[] => itemSyllables(it.id);

function pair(n: number, a: string, b: string) {
  const x = findItem(n, a);
  const y = findItem(n, b);
  return { line: excerpt(room(n).lines[x.line], x.id, y.id), a: x, b: y };
}

// ---- data for each specimen, all read from the text --------------------------

const TWINS = [
  pair(2, "वृद्धञ्", "वृद्धि"),
  pair(2, "ऋद्धञ्", "ऋद्धि"),
  pair(2, "क्लृप्तञ्", "क्लृप्ति"),
  pair(4, "पुष्टञ्", "पुष्टि"),
  pair(5, "वित्तञ्", "वित्ति"),
  pair(5, "भूतञ्", "भूति"),
];

const MEASURES = ["जेमा", "महिमा", "वरिमा", "प्रथिमा", "वर्ष्मा", "द्राघुया"].map((w) => findItem(2, w));

const NOS = [
  ["ऽमृत", "no death"],
  ["ऽयक्ष्म", "no disease"],
  ["ऽनामय", "no ailment"],
  ["ऽनमित्र", "no enemy"],
  ["ऽभय", "no fear"],
].map(([w, en]) => ({ it: findItem(3, w), en }));

const GRAINS = room(4).items.map((id) => CK.items[id]).filter((it) => whole(it).some((s) => s.lv === 3));
const HELD_HERE = GRAINS.reduce((n, it) => n + whole(it).filter((s) => s.lv === 3).length, 0);

const GODS = room(6).lines.map((l) => l.items.map((id) => CK.items[id]));

const CUPS: [string, string, string][] = [
  ["सविता", "सावित्र", "a → ā"],
  ["सरस्वती", "सारस्वत", "a → ā"],
  ["पूषा", "पौष्ण", "ū → au"],
  ["मित्र + वरुण", "मैत्रावरुण", "i → ai"],
  ["अश्विनौ", "आश्विन", "a → ā"],
  ["विश्वे देवाः", "वैश्वदेव", "i → ai"],
  ["इन्द्र + अग्नि", "ऐन्द्राग्न", "i → ai"],
  ["महा + इन्द्र", "माहेन्द्र", "a → ā"],
  ["अदिति", "आदित्य", "a → ā"],
];
const CUP_TUNE = (() => {
  const ca = room(7).lines.flatMap(lineSyllables).filter((s) => s.role === "r" && s.d.includes("च"));
  return { lifts: ca.filter((s) => s.lv >= 2).length, total: ca.length };
})();

const HERD: [string, string, string][] = [
  ["1½", "त्र्यवि", "त्र्यवी"],
  ["2", "दित्यवाट्", "दित्यौही"],
  ["2½", "पञ्चावि", "पञ्चावी"],
  ["3", "त्रिवत्स", "त्रिवत्सा"],
  ["4", "तुर्यवाट्", "तुर्यौही"],
  ["5", "पष्ठवा", "पष्ठौही"],
];

const FIVES = ["पञ्च", "पञ्चदश", "पञ्चविꣳशति"].map((w) => {
  const matches = room(11).items.map((id) => CK.items[id]);
  return matches.find((it) => it.payload.replace(/[॒॑᳚]/g, "") === w)!;
});

const START = excerpt(room(1).lines[0], room(1).items[0], room(1).items[1]);
const END_LINE = room(11).lines[7];
const END = excerpt(END_LINE, END_LINE.items[0], END_LINE.items[1]);

// ---- specimens ---------------------------------------------------------------

function Spec({
  id,
  title,
  where,
  wide,
  children,
  note,
}: {
  id: string;
  title: string;
  where: string;
  wide?: "7" | "5" | "6" | "12";
  children: React.ReactNode;
  note: React.ReactNode;
}) {
  return (
    <article className="ck-spec" data-span={wide ?? "6"} aria-labelledby={`ck-spec-${id}`}>
      <header className="ck-spec__head">
        <h3 id={`ck-spec-${id}`} className="ck-h3">
          {title}
        </h3>
        <span className="ck-read">{where}</span>
      </header>
      <div className="ck-spec__body">{children}</div>
      <p className="ck-spec__note">{note}</p>
    </article>
  );
}

export default function Patterns() {
  return (
    <section id="patterns" className="ck-sec" aria-labelledby="ck-patterns-title">
      <div className="ck-wrap">
        <div className="ck-stack">
          <h2 id="ck-patterns-title" className="ck-h2">
            Patterns do the remembering
          </h2>
          <p className="ck-p">
            A list of {WISHES} wishes sounds like rote work. It isn’t: the words come in twins and families,
            whole runs share one tune, and the end loops back to the start. Each pattern below is one less
            thing to memorise.
          </p>
        </div>

        <div className="ck-specs">
          <Spec
            id="twins"
            title="Twins"
            where="anuvākas 2, 4, 5"
            wide="7"
            note={
              <>
                A thing, then its process: grown, growth. In all six twins the <i>-tam</i> word dips first
                and the <i>-ti</i> word lifts second, so learning one twin teaches the tune of all six.
              </>
            }
          >
            <ul className="ck-twins">
              {TWINS.map((t) => (
                <li key={t.a.id}>
                  <Score line={t.line} />
                  <span className="ck-read">
                    {t.a.gloss} → {t.b.gloss}
                  </span>
                </li>
              ))}
            </ul>
          </Spec>

          <Spec
            id="nos"
            title="Five noes"
            where="anuvāka 3"
            wide="5"
            note={
              <>
                The sign <span className="ck-deva">ऽ</span> marks a swallowed <i>a-</i>, and in this run
                every <i>a-</i> means no.
              </>
            }
          >
            <ul className="ck-nos">
              {NOS.map(({ it, en }) => {
                const syls = whole(it);
                const first = { ...syls[0], d: syls[0].d.replace("ऽ", "") };
                return (
                  <li key={it.id}>
                    <span className="ck-nos__a ck-deva" aria-hidden="true">
                      ऽ
                    </span>
                    <SylText syls={[first, ...syls.slice(1)]} dimFrame className="ck-nos__w" />
                    <span className="ck-nos__en">{en}</span>
                  </li>
                );
              })}
            </ul>
          </Spec>

          <Spec
            id="measures"
            title="Six measures, one tune"
            where="anuvāka 2"
            wide="5"
            note={
              <>
                Victory, greatness, breadth, expanse, height, length: six words ending in <i>-mā</i> or{" "}
                <i>-yā</i>, each sung the same way. Dip, beat, and <span className="ck-deva">च</span>{" "}
                lifts.
              </>
            }
          >
            <div className="ck-measures">
              <svg viewBox="0 0 160 132" aria-hidden="true">
                {[
                  [18, 18],
                  [34, 34],
                  [66, 34],
                  [66, 58],
                  [66, 104],
                  [156, 104],
                ].map(([w, h], i) => (
                  <rect key={i} x={2} y={130 - h} width={w} height={h} style={{ opacity: 0.25 + i * 0.13 }} />
                ))}
              </svg>
              <ol>
                {MEASURES.map((it) => (
                  <li key={it.id}>
                    <SylText syls={whole(it)} dimFrame />
                    <span className="ck-read">{it.gloss}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Spec>

          <Spec
            id="grains"
            title="The heavy grains"
            where="anuvāka 4"
            wide="7"
            note={
              <>
                {HELD_HERE} of the {CORE_STATS.levels[3]} held tones (
                <span className="ck-mark ck-ember">◌᳚</span>) in the whole Chamakam sit in this granary.
                Hold each grain like a full sack. Bar length is how long each syllable lasts.
              </>
            }
          >
            <ul className="ck-grains">
              {GRAINS.map((it) => (
                <li key={it.id}>
                  <SylText syls={whole(it)} dimFrame className="ck-grains__w" />
                  <span className="ck-grains__bars" aria-hidden="true">
                    {whole(it).map((s, i) => (
                      <i key={i} data-lv={s.lv} style={{ flexGrow: (s.long ? 2 : 1) * (s.lv === 3 ? 1.5 : 1) }} />
                    ))}
                  </span>
                  <span className="ck-read">{it.gloss}</span>
                </li>
              ))}
            </ul>
          </Spec>

          <Spec
            id="indra"
            title="Twenty gods, each with Indra"
            where="anuvāka 6"
            wide="6"
            note={
              <>
                Every god arrives arm in arm with Indra: ___ <span className="ck-deva">च म॒ , इन्द्र॑श्च मे</span>,
                twenty times to one tune. The last three pairs climb, in order: Earth, mid-air, sky, the
                directions, the zenith, Prajāpati.
              </>
            }
          >
            <ol className="ck-gods">
              {GODS.map((row, i) => (
                <li key={i} data-climb={i >= 7 || undefined}>
                  {row.map((it) => (
                    <span key={it.id} className="ck-gods__g">
                      <SylText syls={payload(it)} />
                      <span className="ck-read">{it.gloss}</span>
                    </span>
                  ))}
                  <span className="ck-gods__indra ck-deva" aria-hidden="true">
                    + इन्द्र
                  </span>
                </li>
              ))}
            </ol>
          </Spec>

          <Spec
            id="cups"
            title="Gods become cups"
            where="anuvākas 6 → 7"
            wide="6"
            note={
              <>
                Stretch a god’s first vowel and you have the name of its soma cup. And {CUP_TUNE.lifts} of
                the {CUP_TUNE.total} cups end the same way: dip, beat, and <span className="ck-deva">च</span>{" "}
                lifts.
              </>
            }
          >
            <ul className="ck-cups">
              {CUPS.map(([god, cup, shift]) => (
                <li key={cup}>
                  <span className="ck-cups__god ck-deva">{god}</span>
                  <span className="ck-cups__arrow" aria-hidden="true" />
                  <SylText syls={payload(findItem(7, cup))} className="ck-cups__cup" />
                  <span className="ck-read">{shift}</span>
                </li>
              ))}
            </ul>
          </Spec>

          <Spec
            id="herd"
            title="The herd ladder"
            where="anuvāka 10"
            wide="5"
            note={
              <>
                Bull, then cow, older at each rung: eighteen months up to five years. The cow’s word is the
                bull’s with a feminine ending: <i>-i</i> to <i>-ī</i>, <i>-a</i> to <i>-ā</i>,{" "}
                <i>-vāṭ</i> to <i>-auhī</i>.
              </>
            }
          >
            <ol className="ck-herd">
              {HERD.map(([age, bull, cow]) => (
                <li key={age} style={{ "--age": parseFloat(age.replace("½", ".5")) } as React.CSSProperties}>
                  <span className="ck-herd__age ck-num">{age}</span>
                  <SylText syls={whole(findItem(10, bull))} dimFrame />
                  <SylText syls={whole(findItem(10, cow))} dimFrame />
                </li>
              ))}
            </ol>
          </Spec>

          <Spec
            id="count"
            title="Odds, then fours"
            where="anuvāka 11"
            wide="7"
            note={
              <>
                Every odd number from 1 to 33, then every fourth from 4 to 48. A unit keeps its tune as it
                grows into the teens and twenties:
              </>
            }
          >
            <div className="ck-count">
              <ol className="ck-count__grid" aria-label="Numbers 1 to 48: odd numbers up to 33 are filled, multiples of 4 are ringed">
                {Array.from({ length: 48 }, (_, k) => {
                  const v = k + 1;
                  const kind = v % 2 === 1 && v <= 33 ? "odd" : v % 4 === 0 ? "four" : undefined;
                  return (
                    <li key={v} data-kind={kind} className="ck-num">
                      {v}
                    </li>
                  );
                })}
              </ol>
              <ul className="ck-count__tune">
                {FIVES.map((it) => (
                  <li key={it.id}>
                    <SylText syls={whole(it)} dimFrame />
                    <span className="ck-read">{it.gloss}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Spec>

          <Spec
            id="loop"
            title="It ends where it began"
            where="anuvākas 1, 10, 11"
            wide="12"
            note={
              <>
                The last list of anuvāka 11 opens with the very words that open anuvāka 1, to the same tune.
                And anuvāka 10 hands back what anuvāka 1 asked for: breath, eye, ear, mind, speech and self,
                each offered to the yajña.
              </>
            }
          >
            <div className="ck-loop">
              <div>
                <span className="ck-read">Anuvāka 1, first words</span>
                <Score line={START} />
              </div>
              <span className="ck-loop__arc" aria-hidden="true" />
              <div>
                <span className="ck-read">Anuvāka 11, last list</span>
                <Score line={END} />
              </div>
            </div>
          </Spec>
        </div>
      </div>
    </section>
  );
}
