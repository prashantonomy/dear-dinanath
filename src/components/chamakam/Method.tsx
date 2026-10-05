"use client";

import { useLab } from "./lab-context";

interface Step {
  name: string;
  minutes: number;
  what: React.ReactNode;
  why: { text: string; href: string }[];
}

const STEPS: Step[] = [
  {
    name: "See the room",
    minutes: 0.5,
    what: "Read the room’s scene, say its door word, and spot its pattern before you learn a single line.",
    why: [{ text: "Method of loci", href: "#src-loci" }],
  },
  {
    name: "Hear it",
    minutes: 1,
    what: "Play the room at Slow with the score on Full. Trace the pitch with your hand: down, flat, up.",
    why: [
      { text: "Melody", href: "#src-melody" },
      { text: "Gesture", href: "#src-gesture" },
    ],
  },
  {
    name: "Echo it",
    minutes: 1.5,
    what: "Run the Echo drill: hear up to four items, chant them back twice from memory, move on.",
    why: [
      { text: "Four chunks", href: "#src-chunks" },
      { text: "Saying it yourself", href: "#src-generation" },
    ],
  },
  {
    name: "Fade it",
    minutes: 1.5,
    what: "Step the score down: Initials, Tune only, Blank. Chant each line before you peek. After a miss, step back one level.",
    why: [
      { text: "Fading cues", href: "#src-fading" },
      { text: "Recall beats rereading", href: "#src-recall" },
    ],
  },
  {
    name: "Link it",
    minutes: 0.5,
    what: "Run the Links drill: from each item, say the next one, and finish on the door to the next room.",
    why: [{ text: "Krama recitation", href: "#src-patha" }],
  },
];

const TOTAL = STEPS.reduce((n, s) => n + s.minutes, 0);

export default function Method() {
  const { practise, room } = useLab();
  return (
    <section id="method" className="ck-sec" aria-labelledby="ck-method-title">
      <div className="ck-wrap">
        <div className="ck-split">
          <div className="ck-stack">
            <h2 id="ck-method-title" className="ck-h2">
              Five minutes a room
            </h2>
            <p className="ck-p">
              Each step below is something memory research has tested, or something Vedic teachers have
              done for three thousand years. Mostly both. One room takes about {TOTAL} minutes. All
              eleven take under an hour, best spread across a week or two.
            </p>
            <p className="ck-p">
              Rereading feels like learning and fades within days. Pulling the words out of your own memory
              is what lasts: in one study, a week later, people who had recalled a text three times
              remembered 61% of it; people who had reread it three times remembered 40%.
            </p>
          </div>

          <div>
            <div className="ck-timeline" aria-hidden="true">
              {STEPS.map((s) => (
                <span key={s.name} style={{ flexGrow: s.minutes }}>
                  <i>{s.name}</i>
                </span>
              ))}
            </div>
            <ol className="ck-steps">
              {STEPS.map((s, i) => (
                <li key={s.name}>
                  <span className="ck-steps__n ck-num">{i + 1}</span>
                  <div>
                    <h3 className="ck-h3">
                      {s.name}
                      <span className="ck-read ck-num">{s.minutes < 1 ? "30 s" : `${s.minutes} min`}</span>
                    </h3>
                    <p className="ck-p">{s.what}</p>
                    <p className="ck-steps__why">
                      {s.why.map((w) => (
                        <a key={w.href} href={w.href}>
                          {w.text}
                        </a>
                      ))}
                    </p>
                  </div>
                </li>
              ))}
              <li>
                <span className="ck-steps__n ck-num">6</span>
                <div>
                  <h3 className="ck-h3">
                    Sleep on it
                    <span className="ck-read">days, not minutes</span>
                  </h3>
                  <p className="ck-p">
                    Chant the room once before you sleep and once the next morning. Then use the room check:
                    it schedules reviews at about 3 days, a week, three weeks and two months.
                  </p>
                  <p className="ck-steps__why">
                    <a href="#src-sleep">Sleep</a>
                    <a href="#src-spacing">Spacing</a>
                  </p>
                </div>
              </li>
            </ol>
            <button type="button" className="ck-btn" data-primary onClick={() => practise(room === 0 || room === 12 ? 1 : room)}>
              Start with {room === 0 || room === 12 ? "anuvāka 1" : `anuvāka ${room}`}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
