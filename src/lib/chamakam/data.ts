// The parsed Chamakam plus the derived views the lab needs: item lookups,
// render blocks, statistics, and the memory-palace scene for each room.

import { CHAMAKAM } from "./text";
import { lineSyllables, parseChamakam, statsOf } from "./svara";
import type { Anuvaka, Item, Line, Syl } from "./types";

export const CK = parseChamakam(CHAMAKAM);

/** Anuvākas 1–11: the Chamakam proper, without the opening verse and śānti. */
export const CORE: Anuvaka[] = CK.anuvakas.filter((a) => a.n >= 1 && a.n <= 11);

export const CORE_SYLLABLES: Syl[] = CORE.flatMap((a) => a.lines.flatMap(lineSyllables));
export const CORE_STATS = statsOf(CORE_SYLLABLES);
export const CORE_ITEMS = CORE.reduce((n, a) => n + a.items.length, 0);

/** 1697 → "1,697", identical on the server and in every browser. */
export function fmt(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function room(n: number): Anuvaka {
  return CK.anuvakas[n];
}

/** The k-th item (0-based) of anuvāka n. */
export function itemAt(n: number, k: number): Item {
  return CK.items[CK.anuvakas[n].items[k]];
}

const MARKS = /[\u0951\u0952\u1CDA]/g;

/** Devanagari without svara marks, for matching. */
export function plain(s: string): string {
  return s.replace(MARKS, "");
}

/** The item of anuvāka n whose payload starts with `start` (marks ignored). */
export function findItem(n: number, start: string): Item {
  const id = CK.anuvakas[n].items.find((i) => plain(CK.items[i].payload).startsWith(start));
  if (id === undefined) throw new Error(`No item starting "${start}" in anuvāka ${n}`);
  return CK.items[id];
}

/** All syllables of one item, in order. */
export function itemSyllables(id: number): Syl[] {
  const it = CK.items[id];
  const line = CK.anuvakas[it.anuvaka].lines[it.line];
  return lineSyllables(line).filter((s) => s.item === id);
}

export interface Frag {
  syls: Syl[];
  /** Word space before this fragment (false when a sandhi join splits a word). */
  space: boolean;
}

export interface Block {
  item: number;
  frags: Frag[];
  /** Trailing pause mark (the hiatus comma). */
  punct?: string;
  space: boolean;
}

/**
 * Groups a line into item blocks for rendering. A block is the run of word
 * fragments that belong to one item; fragments of the same word sit flush, so a
 * sandhi-joined word still reads as one word even when two items share it.
 */
export function blocksOf(line: Line): Block[] {
  const blocks: Block[] = [];
  let wordStart = true;
  for (const t of line.tokens) {
    if (t.kind === "punct") {
      if (blocks.length) blocks[blocks.length - 1].punct = t.text;
      wordStart = true;
      continue;
    }
    let frag: Frag | null = null;
    t.syls.forEach((s, k) => {
      const last = blocks[blocks.length - 1];
      const startsWord = k === 0;
      if (!last || last.item !== s.item) {
        frag = { syls: [s], space: startsWord && wordStart && blocks.length > 0 };
        blocks.push({ item: s.item, frags: [frag], space: frag.space });
      } else if (startsWord) {
        frag = { syls: [s], space: true };
        last.frags.push(frag);
      } else {
        frag!.syls.push(s);
      }
    });
    wordStart = true;
  }
  return blocks;
}

/** The memory-palace scene for each room: one image to walk through. */
export const SCENES: Record<number, string> = {
  0: "Two guests are invited, Agni and Viṣṇu. The songs make them grow; they arrive with splendour and strength.",
  1: "Food arrives. You breathe in, out, and through. Mind, speech, eye and ear switch on, strength floods in, and armour closes over limbs, bones and joints.",
  2: "You rise: rank, leadership, fire in the belly. You grow in every direction, wide, tall and long. Truth and faith steady you; past and future open.",
  3: "Home and at ease: peace, delight, fortune, fame, a guide and a support. No disease, no enemy, no fear. Then good sleep, a good dawn, a good day.",
  4: "A shared feast of milk, juice, ghee and honey. Rain on the fields, the harvest swells, full and fuller. Then the granary, sack by sack.",
  5: "Dig down: stone, clay, hills, mountains, sand. Mine gold, iron, lead, tin, copper. Then fire and water, plants wild and farmed, animals tame and wild.",
  6: "A procession of twenty gods, each one arm in arm with Indra. The last six climb: Earth, mid-air, sky, the directions, the zenith, Prajāpati.",
  7: "A bar of soma cups, each named after its god. Stretch the god's first vowel and you have the cup: Savitṛ becomes Sāvitra.",
  8: "Walk the yajña ground: firewood, grass, altar, hearths; ladles, cups, stones; the soma press; the sheds and the hall; rice cakes; the final bath.",
  9: "The great rites and the sky: fire, sun, breath, the horse rite; Earth, Aditi, Diti, heaven; the Vedas; vow, austerity, season; rain day and night.",
  10: "The herd lines up by age, bull then cow, from eighteen months to five years. Then everything you are is offered back to the yajña.",
  11: "Count the odd numbers to thirty-three, then the fours to forty-eight. Twelve names close it, and the first is वाज, where the Chamakam began.",
  12: "Iḍā calls the gods, Manu leads, Bṛhaspati sings. Earth, do not harm me. Sweet thoughts, sweet words. Peace, peace, peace.",
};
