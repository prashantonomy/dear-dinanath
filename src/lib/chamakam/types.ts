// Types for the Chamakam memory lab (/chamakam). The text itself lives in
// text.ts; svara.ts parses it into syllables with pitch, role, and item.

export type GlyphName =
  | "gate"
  | "body"
  | "rise"
  | "calm"
  | "harvest"
  | "earth"
  | "gods"
  | "cups"
  | "altar"
  | "cosmos"
  | "herd"
  | "count"
  | "peace";

/** One line of marked Devanagari plus one short gloss per item. */
export interface LineSource {
  t: string;
  g: string[];
}

export interface AnuvakaSource {
  /** 0 = opening verse, 1–11 = anuvākas, 12 = closing śānti. */
  n: number;
  key: string;
  name: string;
  sub: string;
  glyph: GlyphName;
  lines: LineSource[];
}

/**
 * Pitch level of one syllable, read straight from its svara mark:
 * 0 = anudātta (॒, low), 1 = unmarked (udātta / flat), 2 = svarita (॑, high),
 * 3 = dīrgha svarita (᳚, high and held).
 */
export type Level = 0 | 1 | 2 | 3;

/** p = payload (what you memorise), r = the "ca me" refrain, f = other fixed phrase. */
export type Role = "p" | "r" | "f";

export interface Syl {
  /** Devanagari akshara, svara marks included. */
  d: string;
  /** IAST for the same akshara (no accent marks; pitch is drawn, not written). */
  r: string;
  lv: Level;
  role: Role;
  /** Global item index. */
  item: number;
  /** Long vowel: two mātrās instead of one. */
  long: boolean;
  /** The word's accented syllable (udātta): flat, but the one the marks lean on. */
  beat: boolean;
  /** First payload syllable of its item — the cue kept in "hint" mode. */
  lead: boolean;
  /** First syllable of a written word (a space precedes it). */
  ws: boolean;
}

export type Token = { kind: "word"; syls: Syl[] } | { kind: "punct"; text: string };

export interface Line {
  id: string;
  anuvaka: number;
  index: number;
  tokens: Token[];
  /** Global item indices on this line, in order. */
  items: number[];
}

export interface Item {
  id: number;
  anuvaka: number;
  line: number;
  gloss: string;
  /** Full Devanagari of the item (payload + refrain). */
  text: string;
  /** Devanagari of the payload syllables only. */
  payload: string;
}

export interface Anuvaka extends Omit<AnuvakaSource, "lines"> {
  lines: Line[];
  items: number[];
  sylCount: number;
}
