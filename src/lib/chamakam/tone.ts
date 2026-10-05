// The tone guide: a plain piano note for every syllable, on its svara's key.
// Dip is C, level is D, lift is E, and a held lift stays on E, then drops to
// D. Each note is struck and stopped dead at its end: no glide, no swell, no
// tail, so the steps between pitches are heard as steps. One AudioContext for
// the whole page, created on the first user gesture (browsers block audio
// before that).

import type { Level, Syl } from "./types";

type Key = "C" | "D" | "E";

/** C4, D4 and E4. */
const PITCH: Record<Key, number> = { C: 261.63, D: 293.66, E: 329.63 };
const KEYS = Object.keys(PITCH) as Key[];

/** The key each svara is struck on; the held lift starts on E and ends on D. */
const KEY: Record<Level, Key> = { 0: "C", 1: "D", 2: "E", 3: "E" };

/** How much of the held lift stays on E before it drops to D. */
const HOLD = 2 / 3;

/** The damper comes down this long before a note's end, so every stop is heard. */
const DAMP = 0.025;

/** Loudness of a fresh strike. */
const PEAK = 0.8;

/** The overtones of a struck string, from the fundamental up. */
const PARTIALS = [0, 1, 0.6, 0.45, 0.3, 0.2, 0.12, 0.06, 0, 0.04, 0.03, 0.02, 0.015];

export type Tempo = "slow" | "steady" | "quick";
/** Milliseconds per mātrā (one short syllable). */
export const MATRA_MS: Record<Tempo, number> = { slow: 330, steady: 240, quick: 170 };

export interface Note {
  /** Start, in seconds from the start of the phrase. */
  t: number;
  dur: number;
  lv: Level;
  /** Index into the syllable list the phrase was built from. */
  ref: number;
}

/** Turns syllables into timed notes. `restAfter` holds indices followed by a pause. */
export function phrase(syls: Syl[], tempo: Tempo, restAfter: Set<number> = new Set()): Note[] {
  const m = MATRA_MS[tempo] / 1000;
  const notes: Note[] = [];
  let t = 0;
  syls.forEach((s, i) => {
    const dur = m * (s.long ? 2 : 1) * (s.lv === 3 ? 1.5 : 1);
    notes.push({ t, dur, lv: s.lv, ref: i });
    t += dur;
    if (restAfter.has(i)) t += m;
  });
  return notes;
}

export function phraseLength(notes: Note[]): number {
  const last = notes[notes.length - 1];
  return last ? last.t + last.dur : 0;
}

export interface Playback {
  stop: () => void;
  /** Resolves true when the phrase ran to the end, false when it was stopped. */
  done: Promise<boolean>;
}

interface Piano {
  /** Strikes one syllable from `t0`. */
  sing: (n: Note, t0: number) => void;
  /** Brings every damper down at `at`. */
  hush: (at: number) => void;
  srcs: AudioScheduledSourceNode[];
}

class ToneEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private wave: PeriodicWave | null = null;
  private noise: AudioBuffer | null = null;
  private drone: { gain: GainNode; nodes: OscillatorNode[] } | null = null;
  private current: Playback | null = null;

  private ensure(): AudioContext {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      // a limiter only, so the strikes and the stops are never squeezed flat
      const limit = this.ctx.createDynamicsCompressor();
      limit.threshold.value = -3;
      limit.knee.value = 0;
      limit.ratio.value = 20;
      limit.attack.value = 0.002;
      limit.release.value = 0.08;
      this.master.connect(limit).connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** A low tanpura-like bed, Sa and Pa with Sa on the level note D, as a pitch reference. */
  setDrone(on: boolean) {
    if (!on) {
      if (this.drone && this.ctx) {
        const now = this.ctx.currentTime;
        this.drone.gain.gain.setTargetAtTime(0, now, 0.25);
        this.drone.nodes.forEach((o) => o.stop(now + 1.5));
      }
      this.drone = null;
      return;
    }
    if (this.drone) return;
    const ctx = this.ensure();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.06, ctx.currentTime, 0.6);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 650;
    gain.connect(lp).connect(this.master!);
    const nodes: OscillatorNode[] = [];
    [0.5, 0.75, 1].forEach((k, i) => {
      const o = ctx.createOscillator();
      o.type = i === 1 ? "sine" : "triangle";
      o.frequency.value = PITCH.D * k;
      o.detune.value = (i - 1) * 3;
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.22 : 0.55;
      // a slow shimmer, like tanpura strings decaying and returning
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.17 + i * 0.07;
      const depth = ctx.createGain();
      depth.gain.value = 0.18;
      lfo.connect(depth).connect(g.gain);
      o.connect(g).connect(gain);
      o.start();
      lfo.start();
      nodes.push(o, lfo);
    });
    this.drone = { gain, nodes };
  }

  /** One note, for the pitch demos. */
  ping(lv: Level, seconds = 0.7) {
    const ctx = this.ensure();
    const now = ctx.currentTime;
    const piano = this.piano(ctx);
    piano.sing({ t: 0, dur: seconds, lv, ref: 0 }, now);
    piano.srcs.forEach((s) => {
      s.start(now);
      s.stop(now + seconds + 0.1);
    });
  }

  /**
   * Plays a phrase. `onNote` fires with each note's `ref` as it starts and
   * with -1 between notes and at the end.
   */
  play(notes: Note[], onNote: (ref: number) => void): Playback {
    this.stop();
    const ctx = this.ensure();
    const start = ctx.currentTime + 0.08;
    const end = start + phraseLength(notes);
    const piano = this.piano(ctx);
    notes.forEach((n) => piano.sing(n, start + n.t));
    piano.srcs.forEach((s) => {
      s.start(start);
      s.stop(end + 0.1);
    });

    let raf = 0;
    let last = -2;
    let finished = false;
    let resolve!: (ran: boolean) => void;
    const done = new Promise<boolean>((r) => (resolve = r));
    const finish = (ran: boolean) => {
      finished = true;
      cancelAnimationFrame(raf);
      onNote(-1);
      resolve(ran);
    };
    const tick = () => {
      if (finished) return;
      const now = ctx.currentTime - start;
      let ref = -1;
      for (let k = notes.length - 1; k >= 0; k--) {
        if (now >= notes[k].t) {
          if (now < notes[k].t + notes[k].dur) ref = notes[k].ref;
          break;
        }
      }
      if (ref !== last) {
        last = ref;
        onNote(ref);
      }
      if (ctx.currentTime >= end) return finish(true);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const playback: Playback = {
      done,
      stop: () => {
        if (finished) return;
        piano.hush(ctx.currentTime);
        finish(false);
      },
    };
    this.current = playback;
    return playback;
  }

  stop() {
    this.current?.stop();
    this.current = null;
  }

  private piano(ctx: AudioContext): Piano {
    // One string per key, through a lowpass that is bright at the strike and
    // mellows as it rings.
    this.wave ??= ctx.createPeriodicWave(new Float32Array(PARTIALS.length), Float32Array.from(PARTIALS));
    const srcs: AudioScheduledSourceNode[] = [];
    const strings = {} as Record<Key, { env: AudioParam; tone: AudioParam }>;
    for (const k of KEYS) {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.Q.value = 0.7;
      const env = ctx.createGain();
      env.gain.value = 0;
      lp.connect(env).connect(this.master!);
      const o = ctx.createOscillator();
      o.setPeriodicWave(this.wave);
      o.frequency.value = PITCH[k];
      o.connect(lp);
      srcs.push(o);
      strings[k] = { env: env.gain, tone: lp.frequency };
    }

    // the hammer's knock: a few milliseconds of filtered noise on every strike
    if (!this.noise) {
      this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = this.noise;
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2200;
    bp.Q.value = 0.8;
    const knock = ctx.createGain();
    knock.gain.value = 0;
    noise.connect(bp).connect(knock).connect(this.master!);
    srcs.push(noise);

    const strike = (k: Key, t0: number, t1: number) => {
      const { env, tone } = strings[k];
      const off = t1 - DAMP;
      // full at once, the bright first ring dies quickly, then a slow fade…
      env.setTargetAtTime(PEAK, t0, 0.002);
      env.setTargetAtTime(PEAK * 0.5, t0 + 0.01, 0.06);
      if (t0 + 0.2 < off) env.setTargetAtTime(0, t0 + 0.2, 0.8);
      // …until the damper stops it dead
      env.setTargetAtTime(0, off, 0.005);
      tone.setValueAtTime(PITCH[k] * 16, t0);
      tone.setTargetAtTime(PITCH[k] * 5, t0 + 0.004, 0.12);
      knock.gain.setTargetAtTime(0.3, t0, 0.001);
      knock.gain.setTargetAtTime(0, t0 + 0.004, 0.01);
    };

    return {
      srcs,
      sing: (n, t0) => {
        const t1 = t0 + n.dur;
        if (n.lv !== 3) return strike(KEY[n.lv], t0, t1);
        const drop = t0 + n.dur * HOLD;
        strike(KEY[3], t0, drop);
        strike("D", drop, t1);
      },
      hush: (at) => {
        for (const p of [...KEYS.map((k) => strings[k].env), knock.gain]) {
          p.cancelScheduledValues(at);
          p.setTargetAtTime(0, at, 0.005);
        }
        srcs.forEach((s) => s.stop(at + 0.1));
      },
    };
  }
}

let engine: ToneEngine | null = null;

/** The page-wide tone engine (browser only). */
export function tone(): ToneEngine {
  engine ??= new ToneEngine();
  return engine;
}
