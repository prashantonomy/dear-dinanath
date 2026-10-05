"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CK, SCENES } from "@/lib/chamakam/data";
import { checkRoom, markLine, resetRoom, roomState, useProgress, type Mark } from "@/lib/chamakam/progress";
import { lineSyllables } from "@/lib/chamakam/svara";
import { phrase, phraseLength, tone, type Tempo } from "@/lib/chamakam/tone";
import type { Anuvaka, Line, Syl } from "@/lib/chamakam/types";
import Glyph from "./Glyph";
import { PlayIcon, StopIcon } from "./Hero";
import { useLab } from "./lab-context";
import { excerpt, Score, type Cue, type Script } from "./Score";
import { usePlayer } from "./usePlayer";
import { usePref } from "./usePref";

const CUES: [Cue, string][] = [
  ["full", "Full"],
  ["hint", "Initials"],
  ["tune", "Tune only"],
  ["blank", "Blank"],
];
const TEMPOS: [Tempo, string][] = [
  ["slow", "Slow"],
  ["steady", "Steady"],
  ["quick", "Quick"],
];
type Drill = "score" | "echo" | "links";

function roomTitle(a: Anuvaka) {
  return a.n === 0 ? "Opening verse" : a.n === 12 ? "Closing śānti" : `Anuvāka ${a.n}`;
}

/** Rests after the last syllable of each line, for whole-room playback. */
function roomPhrase(a: Anuvaka) {
  const syls: Syl[] = [];
  const rests = new Set<number>();
  for (const l of a.lines) {
    syls.push(...lineSyllables(l));
    rests.add(syls.length - 1);
  }
  return { syls, rests };
}

export default function Console() {
  const { room } = useLab();
  const a = CK.anuvakas[room];
  const progress = useProgress();
  const { active, playing, play, stop } = usePlayer();

  const [drill, setDrill] = useState<Drill>("score");
  const [cue, setCue] = usePref<Cue>("cue", "full", ["full", "hint", "tune", "blank"]);
  const [script, setScript] = usePref<Script>("script", "deva", ["deva", "roman"]);
  const [tempo, setTempo] = usePref<Tempo>("tempo", "steady", ["slow", "steady", "quick"]);
  const [gloss, setGloss] = usePref<boolean>("gloss", false);
  const [drone, setDrone] = useState(false);

  useEffect(() => {
    tone().setDrone(drone);
  }, [drone]);
  useEffect(() => () => tone().setDrone(false), []);

  // Changing rooms stops whatever is sounding.
  useEffect(() => {
    stop();
  }, [room, drill, stop]);

  const playRoom = () => {
    const { syls, rests } = roomPhrase(a);
    void play(`room-${a.n}`, syls, { tempo, rests });
  };

  const lineMarks = a.lines.map((l) => progress.lines[l.id] ?? 0);
  const recalled = lineMarks.filter((m) => m >= 2).length;

  return (
    <section id="practice" className="ck-sec ck-console" aria-labelledby="ck-practice-title">
      <div className="ck-wrap">
        <div className="ck-console__intro">
          <h2 id="ck-practice-title" className="ck-h2">
            Practice
          </h2>
          <p className="ck-p">
            Pick a room. Hear it, echo it, then take the text away step by step until you can chant it
            blind. Your marks stay in this browser.
          </p>
        </div>

        <RoomStrip />

        <div className="ck-console__room">
          <div className="ck-console__title">
            <Glyph name={a.glyph} size={44} />
            <div>
              <span className="ck-read">{roomTitle(a)}</span>
              <h3 className="ck-console__name">{a.name}</h3>
            </div>
          </div>
          <p className="ck-console__scene">{SCENES[a.n]}</p>
          <p className="ck-read ck-num ck-console__stats">
            {a.lines.length} lines, {a.items.length} items, {a.sylCount} syllables
            {recalled > 0 ? `; ${recalled} of ${a.lines.length} lines recalled` : ""}
          </p>
        </div>

        <div className="ck-panel">
          <div className="ck-panel__bar">
            <div className="ck-seg" role="group" aria-label="Drill">
              {(
                [
                  ["score", "Score"],
                  ["echo", "Echo"],
                  ["links", "Links"],
                ] as [Drill, string][]
              ).map(([d, label]) => (
                <button key={d} type="button" aria-pressed={drill === d} onClick={() => setDrill(d)}>
                  {label}
                </button>
              ))}
            </div>
            {drill === "score" && (
              <button
                type="button"
                className="ck-btn"
                data-primary
                data-small
                onClick={playRoom}
                aria-pressed={playing === `room-${a.n}`}
              >
                {playing === `room-${a.n}` ? <StopIcon /> : <PlayIcon />}
                {playing === `room-${a.n}` ? "Stop" : "Play the room"}
              </button>
            )}
          </div>

          <div className="ck-panel__opts">
            <Opt label="Show">
              <div className="ck-seg" role="group" aria-label="How much text to show">
                {CUES.map(([c, label]) => (
                  <button key={c} type="button" aria-pressed={cue === c} onClick={() => setCue(c)}>
                    {label}
                  </button>
                ))}
              </div>
            </Opt>
            <Opt label="Script">
              <div className="ck-seg" role="group" aria-label="Script">
                <button type="button" aria-pressed={script === "deva"} onClick={() => setScript("deva")} lang="sa">
                  <span className="ck-deva">देव</span>
                </button>
                <button type="button" aria-pressed={script === "roman"} onClick={() => setScript("roman")}>
                  IAST
                </button>
              </div>
            </Opt>
            <Opt label="Tempo">
              <div className="ck-seg" role="group" aria-label="Tempo">
                {TEMPOS.map(([t, label]) => (
                  <button key={t} type="button" aria-pressed={tempo === t} onClick={() => setTempo(t)}>
                    {label}
                  </button>
                ))}
              </div>
            </Opt>
            <div className="ck-panel__toggles">
              <button type="button" className="ck-toggle" aria-pressed={gloss} onClick={() => setGloss(!gloss)}>
                Meanings
              </button>
              <button type="button" className="ck-toggle" aria-pressed={drone} onClick={() => setDrone(!drone)}>
                Drone
              </button>
            </div>
          </div>

          {drill === "score" && (
            <ScoreDrill a={a} cue={cue} script={script} gloss={gloss} tempo={tempo} marks={lineMarks} player={{ active, playing, play }} />
          )}
          {drill === "echo" && <EchoDrill key={a.n} a={a} script={script} gloss={gloss} tempo={tempo} cue={cue} player={{ active, play, stop }} />}
          {drill === "links" && <LinksDrill key={a.n} a={a} script={script} gloss={gloss} tempo={tempo} player={{ active, playing, play }} />}
        </div>

        <RoomCheck a={a} />
      </div>
    </section>
  );
}

function Opt({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="ck-opt">
      <span className="ck-read">{label}</span>
      {children}
    </div>
  );
}

function RoomStrip() {
  const { room, setRoom } = useLab();
  const progress = useProgress();
  const now = useMemo(() => Date.now(), [progress]);
  return (
    <div className="ck-strip" role="group" aria-label="Choose a room">
      {CK.anuvakas.map((r) => {
        const st = roomState(progress.rooms[r.n], now);
        return (
          <button
            key={r.n}
            type="button"
            className="ck-strip__room"
            aria-pressed={room === r.n}
            aria-label={`${roomTitle(r)}: ${r.name}`}
            data-state={st.kind}
            onClick={() => setRoom(r.n)}
          >
            <Glyph name={r.glyph} size={22} />
            <span className="ck-num">{r.n === 0 ? "ॐ" : r.n === 12 ? "॥" : r.n}</span>
            {st.kind !== "new" && (
              <span className="ck-strip__pips" aria-hidden="true">
                {Array.from({ length: 5 }, (_, k) => (
                  <i key={k} data-on={k < st.box || undefined} />
                ))}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface PlayerProps {
  active: Syl | null;
  playing?: string | null;
  play: ReturnType<typeof usePlayer>["play"];
  stop?: () => void;
}

// ---------------------------------------------------------------- Score drill

function ScoreDrill({
  a,
  cue,
  script,
  gloss,
  tempo,
  marks,
  player,
}: {
  a: Anuvaka;
  cue: Cue;
  script: Script;
  gloss: boolean;
  tempo: Tempo;
  marks: Mark[];
  player: PlayerProps;
}) {
  const [peek, setPeek] = useState<Set<string>>(new Set());
  const [missedOnly, setMissedOnly] = useState(false);

  useEffect(() => {
    setPeek(new Set());
  }, [a.n, cue]);

  const togglePeek = (id: string) =>
    setPeek((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const grade = (id: string, ok: boolean) => {
    markLine(id, ok);
    setPeek((p) => {
      const next = new Set(p);
      next.delete(id);
      return next;
    });
  };

  const anyMissed = marks.some((m) => m === 1);
  const lines = a.lines.filter((_, i) => !missedOnly || marks[i] === 1);

  return (
    <div className="ck-drill">
      <div className="ck-drill__head">
        <p className="ck-drill__how">
          {cue === "full"
            ? "Read along while it plays. Trace the pitch with your hand."
            : "Chant each line from memory first, then peek to check and mark it honestly."}
        </p>
        {anyMissed && (
          <button type="button" className="ck-toggle" aria-pressed={missedOnly} onClick={() => setMissedOnly(!missedOnly)}>
            Missed lines only
          </button>
        )}
      </div>
      <ol className="ck-lines">
        {lines.map((line) => {
          const i = line.index;
          const key = `line-${line.id}`;
          const isPeek = peek.has(line.id);
          return (
            <li key={line.id} className="ck-line" data-mark={marks[i]}>
              <span className="ck-line__n ck-num" title={MARK_LABEL[marks[i]]}>
                {String(i + 1).padStart(2, "0")}
                <MarkPips mark={marks[i]} />
              </span>
              <div className="ck-line__score">
                <Score line={line} cue={cue} script={script} gloss={gloss && (cue === "full" || isPeek)} active={player.active} peek={isPeek} />
              </div>
              <div className="ck-line__acts">
                <IconButton
                  label={player.playing === key ? "Stop" : `Play line ${i + 1}`}
                  onClick={() => void player.play(key, lineSyllables(line), { tempo })}
                  pressed={player.playing === key}
                >
                  {player.playing === key ? <StopIcon /> : <PlayIcon />}
                </IconButton>
                {cue !== "full" && (
                  <>
                    <IconButton label={isPeek ? "Hide line" : "Peek at line"} onClick={() => togglePeek(line.id)} pressed={isPeek}>
                      <EyeIcon open={!isPeek} />
                    </IconButton>
                    <IconButton label="I recalled it" onClick={() => grade(line.id, true)}>
                      <CheckIcon />
                    </IconButton>
                    <IconButton label="I missed something" onClick={() => grade(line.id, false)}>
                      <CrossIcon />
                    </IconButton>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const MARK_LABEL: Record<Mark, string> = {
  0: "Not tried yet",
  1: "Missed last time",
  2: "Recalled once",
  3: "Recalled twice or more",
};

function MarkPips({ mark }: { mark: Mark }) {
  return (
    <span className="ck-line__pips" data-mark={mark} aria-hidden="true">
      <i />
      <i />
    </span>
  );
}

// ---------------------------------------------------------------- Echo drill

interface EchoStep {
  line: Line;
  view: Line;
  syls: Syl[];
  join: boolean;
}

/** Chunks of at most four items, santhai style; long lines are joined after. */
function echoSteps(a: Anuvaka): EchoStep[] {
  const steps: EchoStep[] = [];
  for (const line of a.lines) {
    const ids = line.items;
    const parts = Math.ceil(ids.length / 4);
    if (parts <= 1) {
      steps.push({ line, view: line, syls: lineSyllables(line), join: false });
      continue;
    }
    const size = Math.ceil(ids.length / parts);
    for (let k = 0; k < ids.length; k += size) {
      const chunk = ids.slice(k, k + size);
      const view = excerpt(line, chunk[0], chunk[chunk.length - 1]);
      steps.push({ line, view, syls: lineSyllables(view), join: false });
    }
    steps.push({ line, view: line, syls: lineSyllables(line), join: true });
  }
  return steps;
}

function EchoDrill({
  a,
  script,
  gloss,
  tempo,
  cue,
  player,
}: {
  a: Anuvaka;
  script: Script;
  gloss: boolean;
  tempo: Tempo;
  cue: Cue;
  player: PlayerProps;
}) {
  const steps = useMemo(() => echoSteps(a), [a]);
  const [k, setK] = useState(0);
  const [phase, setPhase] = useState<"idle" | "listen" | "say" | "done">("idle");
  const [gap, setGap] = useState(0);
  const run = useRef(0);

  const halt = useCallback(() => {
    run.current++;
    player.stop?.();
    setPhase((p) => (p === "done" ? p : "idle"));
  }, [player]);

  useEffect(() => () => {
    run.current++;
  }, []);

  const start = async (from: number) => {
    const id = ++run.current;
    for (let s = from; s < steps.length; s++) {
      if (run.current !== id) return;
      setK(s);
      setPhase("listen");
      const ran = await player.play(`echo-${a.n}-${s}`, steps[s].syls, { tempo });
      if (!ran || run.current !== id) return;
      // Your turn: time to chant it back twice from memory.
      const seconds = 2 * phraseLength(phrase(steps[s].syls, tempo)) + 1.5;
      setGap(seconds);
      setPhase("say");
      await new Promise((r) => setTimeout(r, seconds * 1000));
      if (run.current !== id) return;
    }
    setPhase("done");
  };

  const step = steps[k];
  const say = phase === "say";
  // Hear it with the text; say it back with less of it (Tune only unless you chose less).
  const sayCue: Cue = cue === "full" || cue === "hint" ? "tune" : cue;

  return (
    <div className="ck-drill ck-echo">
      <p className="ck-drill__how">
        Call and response, the traditional way the Vedas are taught. Listen to a chunk of up to four
        items, then chant it back twice before the next one. The text fades while it is your turn.
      </p>

      <div className="ck-echo__stage" data-phase={phase}>
        <div className="ck-echo__meta">
          <span className="ck-read ck-num">
            Step {k + 1} of {steps.length}, line {step.line.index + 1}
            {step.join ? ", whole line" : ""}
          </span>
          <span className="ck-echo__phase">
            {phase === "listen" ? "Listen" : say ? "Your turn: say it twice" : phase === "done" ? "Room done" : "Ready"}
          </span>
        </div>
        <div className="ck-echo__score">
          <Score line={step.view} cue={say ? sayCue : "full"} script={script} gloss={gloss && !say} active={player.active} />
        </div>
        <div className="ck-echo__timer" aria-hidden="true">
          {say && <i key={`${k}-${gap}`} style={{ animationDuration: `${gap}s` }} />}
        </div>
      </div>

      <div className="ck-echo__controls">
        {phase === "idle" || phase === "done" ? (
          <button type="button" className="ck-btn" data-primary onClick={() => void start(phase === "done" ? 0 : k)}>
            <PlayIcon />
            {phase === "done" ? "Start again" : k > 0 ? "Resume" : "Start echo"}
          </button>
        ) : (
          <button type="button" className="ck-btn" data-primary onClick={halt}>
            <StopIcon />
            Pause
          </button>
        )}
        <button
          type="button"
          className="ck-btn"
          disabled={k === 0}
          onClick={() => {
            halt();
            setK((v) => Math.max(0, v - 1));
          }}
        >
          Back
        </button>
        <button
          type="button"
          className="ck-btn"
          disabled={k >= steps.length - 1}
          onClick={() => {
            halt();
            setK((v) => Math.min(steps.length - 1, v + 1));
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Links drill

function LinksDrill({
  a,
  script,
  gloss,
  tempo,
  player,
}: {
  a: Anuvaka;
  script: Script;
  gloss: boolean;
  tempo: Tempo;
  player: PlayerProps;
}) {
  const ids = a.items;
  const [k, setK] = useState(0);
  const [shown, setShown] = useState(false);

  const view = (id: number) => {
    const it = CK.items[id];
    return excerpt(CK.anuvakas[it.anuvaka].lines[it.line], id, id);
  };
  const nextRoom = CK.anuvakas[a.n + 1];
  const promptId = ids[k];
  const answerId = k + 1 < ids.length ? ids[k + 1] : nextRoom ? nextRoom.items[0] : null;
  const prompt = view(promptId);
  const answer = answerId === null ? null : view(answerId);

  const go = (to: number) => {
    setK(Math.max(0, Math.min(ids.length - 1, to)));
    setShown(false);
  };

  return (
    <div className="ck-drill ck-links">
      <p className="ck-drill__how">
        Chain drill, after the old <i>krama</i> recitation that runs A B, B C, C D: from each item, say the
        one that follows, then check. These joins are where recitations usually break.
      </p>
      <div className="ck-links__pair">
        <div>
          <span className="ck-read ck-num">
            Item {k + 1} of {ids.length}
          </span>
          <Score line={prompt} script={script} gloss={gloss} active={player.active} />
        </div>
        <div className="ck-links__next">
          <span className="ck-read">{k + 1 < ids.length ? "What comes next?" : nextRoom ? `Door to ${nextRoom.name}` : "The end"}</span>
          {answer ? (
            <Score line={answer} cue={shown ? "full" : "tune"} script={script} gloss={gloss && shown} active={player.active} />
          ) : (
            <p className="ck-p">That is the last word of the Chamakam.</p>
          )}
        </div>
      </div>
      <div className="ck-echo__controls">
        <button type="button" className="ck-btn" data-primary onClick={() => setShown(!shown)} disabled={!answer}>
          {shown ? "Hide" : "Show the answer"}
        </button>
        <button
          type="button"
          className="ck-btn"
          onClick={() => {
            const syls = [...lineSyllables(prompt), ...(answer ? lineSyllables(answer) : [])];
            void player.play(`link-${promptId}`, syls, { tempo });
            setShown(true);
          }}
        >
          <PlayIcon /> Hear the pair
        </button>
        <button type="button" className="ck-btn" onClick={() => go(k - 1)} disabled={k === 0}>
          Previous
        </button>
        <button type="button" className="ck-btn" onClick={() => go(k + 1)} disabled={k >= ids.length - 1}>
          Next
        </button>
        <button type="button" className="ck-btn" onClick={() => go(Math.floor(Math.random() * ids.length))}>
          Random
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- room check

function RoomCheck({ a }: { a: Anuvaka }) {
  const progress = useProgress();
  const now = useMemo(() => Date.now(), [progress]);
  const st = roomState(progress.rooms[a.n], now);
  const status =
    st.kind === "new"
      ? "Your first check starts this room's review schedule."
      : st.kind === "due"
        ? "A review is due now."
        : `Next review in ${st.days} day${st.days === 1 ? "" : "s"}.`;

  return (
    <div className="ck-check">
      <div>
        <h3 className="ck-h3">Room check</h3>
        <p className="ck-p">
          Set the score to Blank and chant the whole room from memory, start to finish. Then be honest.
          Each success pushes the next review further out: tomorrow, then about 3 days, a week, three weeks,
          two months.
        </p>
      </div>
      <div className="ck-check__acts">
        <button type="button" className="ck-btn" data-primary onClick={() => checkRoom(a.n, true)}>
          I chanted it all
        </button>
        <button type="button" className="ck-btn" onClick={() => checkRoom(a.n, false)}>
          Not yet
        </button>
        <span className="ck-read">{status}</span>
        {st.kind !== "new" && (
          <button
            type="button"
            className="ck-read ck-check__reset"
            onClick={() => resetRoom(a.n, a.lines.map((l) => l.id))}
          >
            Reset this room
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- icons

function IconButton({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className="ck-icon" aria-label={label} title={label} onClick={onClick} aria-pressed={pressed}>
      {children}
    </button>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8Z" />
      <circle cx="8" cy="8" r="2" />
      {!open && <path d="M2.5 13.5 13.5 2.5" />}
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="m3 8.5 3.2 3L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  );
}
