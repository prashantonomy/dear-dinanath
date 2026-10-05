// Practice memory for the lab: per-line recall marks and a spaced-review
// schedule per room, kept in this browser's localStorage. Every read and write
// is guarded, so a blocked storage API only means progress is not remembered.

import { useSyncExternalStore } from "react";

const KEY = "dd-chamakam-v1";

/** 0 not tried yet · 1 missed last time · 2 recalled once · 3 recalled twice or more. */
export type Mark = 0 | 1 | 2 | 3;

export interface RoomRecord {
  /** How many reviews in a row went well (0–5). */
  box: number;
  /** Next review, epoch ms. */
  due: number;
  last: number;
}

export interface Progress {
  lines: Record<string, Mark>;
  rooms: Record<string, RoomRecord>;
}

/** Review gaps in days: next morning, ~3 days, ~1 week, ~3 weeks, ~2 months. */
export const INTERVAL_DAYS = [1, 3, 7, 21, 60];
const DAY = 86_400_000;

const EMPTY: Progress = { lines: {}, rooms: {} };
let state: Progress = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Progress>;
      state = { lines: parsed.lines ?? {}, rooms: parsed.rooms ?? {} };
    }
  } catch {
    state = EMPTY;
  }
}

function commit(next: Progress) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage unavailable: keep the in-memory state for this visit
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => EMPTY,
  );
}

export function markLine(id: string, recalled: boolean) {
  load();
  const cur = state.lines[id] ?? 0;
  const next: Mark = recalled ? (cur >= 2 ? 3 : 2) : 1;
  commit({ ...state, lines: { ...state.lines, [id]: next } });
}

/** Record a whole-room check: recalled from memory end to end, or not yet. */
export function checkRoom(n: number, recalled: boolean, now = Date.now()) {
  load();
  const prev = state.rooms[n];
  const box = recalled ? Math.min((prev?.box ?? 0) + 1, INTERVAL_DAYS.length) : 0;
  const gap = recalled ? INTERVAL_DAYS[box - 1] * DAY : 0;
  commit({ ...state, rooms: { ...state.rooms, [n]: { box, due: now + gap, last: now } } });
}

export function resetRoom(n: number, lineIds: string[]) {
  load();
  const lines = { ...state.lines };
  lineIds.forEach((id) => delete lines[id]);
  const rooms = { ...state.rooms };
  delete rooms[n];
  commit({ lines, rooms });
}

export type RoomState = { kind: "new" } | { kind: "due"; box: number } | { kind: "later"; box: number; days: number };

export function roomState(rec: RoomRecord | undefined, now: number): RoomState {
  if (!rec) return { kind: "new" };
  if (rec.due <= now) return { kind: "due", box: rec.box };
  return { kind: "later", box: rec.box, days: Math.ceil((rec.due - now) / DAY) };
}
