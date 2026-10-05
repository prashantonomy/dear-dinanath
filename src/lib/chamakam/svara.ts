// Parses the marked Devanagari in text.ts into syllables (aksharas) carrying a
// pitch level, a role (payload / refrain / fixed phrase), and an item index.
// Pure and deterministic: it runs once at module load, on the server during the
// static build and again in the browser.

import type { Anuvaka, AnuvakaSource, Item, Level, Line, Role, Syl, Token } from "./types";

const VIRAMA = "्";
const AVAGRAHA = "ऽ";
const OM = "ॐ";
const SVARITA = "॑";
const ANUDATTA = "॒";
const DIRGHA = "᳚";

const isCons = (c: string | undefined) => !!c && c >= "क" && c <= "ह";
const isIndepVowel = (c: string | undefined) =>
  !!c && ((c >= "ऄ" && c <= "औ") || c === "ॠ" || c === "ॡ");
const isMatra = (c: string | undefined) =>
  !!c && ((c >= "ा" && c <= "ौ") || c === "ॢ" || c === "ॣ");
// candrabindu, anusvara, visarga, the two Taittiriya "gum" signs, and the svara marks
const isModifier = (c: string | undefined) =>
  !!c && "ँंःꣳꣴ॒॑᳚".includes(c);

const LONG_MATRAS = "ाीूॄेैोौ";
const LONG_VOWELS = "आईऊॠएऐओऔॐ";

const CONS_ROMAN: Record<string, string> = {
  क: "k", ख: "kh", ग: "g", घ: "gh", ङ: "ṅ", च: "c", छ: "ch", ज: "j", झ: "jh", ञ: "ñ",
  ट: "ṭ", ठ: "ṭh", ड: "ḍ", ढ: "ḍh", ण: "ṇ", त: "t", थ: "th", द: "d", ध: "dh", न: "n",
  प: "p", फ: "ph", ब: "b", भ: "bh", म: "m", य: "y", र: "r", ल: "l", व: "v", श: "ś",
  ष: "ṣ", स: "s", ह: "h",
};
const VOWEL_ROMAN: Record<string, string> = {
  अ: "a", आ: "ā", इ: "i", ई: "ī", उ: "u", ऊ: "ū", ऋ: "ṛ", ॠ: "ṝ", ऌ: "ḷ", ए: "e",
  ऐ: "ai", ओ: "o", औ: "au",
  "ा": "ā", "ि": "i", "ी": "ī", "ु": "u", "ू": "ū",
  "ृ": "ṛ", "ॄ": "ṝ", "ॢ": "ḷ", "े": "e", "ै": "ai",
  "ो": "o", "ौ": "au",
};
const OTHER_ROMAN: Record<string, string> = {
  "ँ": "m̐", "ं": "ṃ", "ः": "ḥ", "ꣳ": "gm", "ꣴ": "gm",
  [AVAGRAHA]: "'", [OM]: "oṃ",
};

/** IAST for one akshara. Svara marks are dropped; the UI draws pitch instead. */
export function toRoman(akshara: string): string {
  let out = "";
  const cs = [...akshara];
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i];
    if (CONS_ROMAN[c]) {
      out += CONS_ROMAN[c];
      const next = cs[i + 1];
      if (next === VIRAMA) i++;
      else if (isMatra(next)) {
        out += VOWEL_ROMAN[next];
        i++;
      } else out += "a";
    } else if (VOWEL_ROMAN[c]) out += VOWEL_ROMAN[c];
    else if (OTHER_ROMAN[c]) out += OTHER_ROMAN[c];
  }
  // क्लृप्त is the traditional spelling of kḷpta.
  return out.replace("klṛ", "kḷ");
}

function levelOf(akshara: string): Level {
  if (akshara.includes(DIRGHA)) return 3;
  if (akshara.includes(SVARITA)) return 2;
  if (akshara.includes(ANUDATTA)) return 0;
  return 1;
}

function isLong(akshara: string): boolean {
  for (const c of akshara) {
    if (LONG_MATRAS.includes(c) || LONG_VOWELS.includes(c)) return true;
  }
  return false;
}

interface Annotated {
  c: string;
  role: Role;
  item: number;
}

/** Split one word (annotated characters) into aksharas. */
function splitWord(chars: Annotated[]): { d: string; role: Role; item: number }[] {
  const out: { d: string; role: Role; item: number }[] = [];
  let prefix = "";
  let prefixMeta: Annotated | null = null;
  let i = 0;
  const at = (k: number) => chars[k]?.c;
  while (i < chars.length) {
    const c = at(i);
    if (c === AVAGRAHA) {
      // The elided "a" sign leans on the syllable that follows it.
      prefix += c;
      prefixMeta ??= chars[i];
      i++;
      continue;
    }
    const start = i;
    if (isCons(c)) {
      i++;
      while (at(i) === VIRAMA && isCons(at(i + 1))) i += 2;
      if (isMatra(at(i)) || at(i) === VIRAMA) i++;
    } else {
      i++;
    }
    while (isModifier(at(i))) i++;
    const d = prefix + chars.slice(start, i).map((a) => a.c).join("");
    const meta = prefixMeta ?? chars[start];
    prefix = "";
    prefixMeta = null;
    // A word-final dead consonant (…ञ्, …क्) closes the previous akshara.
    if (d.endsWith(VIRAMA) && out.length) out[out.length - 1].d += d;
    else out.push({ d, role: meta.role, item: meta.item });
  }
  if (prefix && out.length) out[out.length - 1].d += prefix;
  return out;
}

function parseLine(src: string, firstItem: number): { tokens: Token[]; itemCount: number } {
  const tokens: Token[] = [];
  let role: Role = "p";
  let item = firstItem;
  let word: Annotated[] = [];
  const flush = () => {
    if (!word.length) return;
    const syls: Syl[] = splitWord(word).map((a, k) => ({
      d: a.d,
      r: toRoman(a.d),
      lv: levelOf(a.d),
      role: a.role,
      item: a.item,
      long: isLong(a.d),
      beat: false,
      lead: false,
      ws: k === 0,
    }));
    tokens.push({ kind: "word", syls });
    word = [];
  };
  for (const c of src) {
    if (c === "[") role = "r";
    else if (c === "{") role = "f";
    else if (c === "]" || c === "}") role = "p";
    else if (c === "|") item++;
    else if (c === " ") flush();
    else if (c === ",") {
      flush();
      tokens.push({ kind: "punct", text: "," });
    } else word.push({ c, role, item });
  }
  flush();
  return { tokens, itemCount: item - firstItem + 1 };
}

function* syllablesOf(lines: Line[]): Generator<Syl> {
  for (const line of lines) {
    for (const t of line.tokens) if (t.kind === "word") yield* t.syls;
  }
}

export interface Chamakam {
  anuvakas: Anuvaka[];
  items: Item[];
  /** Every syllable in reading order. */
  syllables: Syl[];
}

export function parseChamakam(source: AnuvakaSource[]): Chamakam {
  const items: Item[] = [];
  const anuvakas: Anuvaka[] = source.map((a) => {
    const lines: Line[] = a.lines.map((l, index) => {
      const first = items.length;
      const { tokens, itemCount } = parseLine(l.t, first);
      if (itemCount !== l.g.length) {
        throw new Error(`Anuvaka ${a.n} line ${index}: ${itemCount} items, ${l.g.length} glosses`);
      }
      const ids = l.g.map((gloss, k) => {
        items.push({ id: first + k, anuvaka: a.n, line: index, gloss, text: "", payload: "" });
        return first + k;
      });
      return { id: `${a.n}-${index}`, anuvaka: a.n, index, tokens, items: ids };
    });
    const sylCount = [...syllablesOf(lines)].length;
    return { ...a, lines, items: lines.flatMap((l) => l.items), sylCount };
  });

  // Beat (udātta) detection over each anuvāka as one continuous chant: a flat
  // syllable that comes straight after a low one, or straight before a high one.
  for (const a of anuvakas) {
    const seq = [...syllablesOf(a.lines)];
    seq.forEach((s, k) => {
      const prev = seq[k - 1];
      const next = seq[k + 1];
      s.beat = s.lv === 1 && ((prev?.lv ?? 1) === 0 || (next?.lv ?? 1) >= 2);
    });
  }

  // Item text, payload, and lead syllable.
  const syllables: Syl[] = [];
  for (const a of anuvakas) {
    for (const line of a.lines) {
      for (const t of line.tokens) {
        if (t.kind !== "word") continue;
        for (const s of t.syls) syllables.push(s);
      }
      // Rebuild item strings with word spacing.
      const parts = new Map<number, { text: string[]; payload: string[] }>();
      for (const t of line.tokens) {
        if (t.kind === "punct") continue;
        const byItem = new Map<number, Syl[]>();
        for (const s of t.syls) byItem.set(s.item, [...(byItem.get(s.item) ?? []), s]);
        for (const [id, syls] of byItem) {
          const p = parts.get(id) ?? { text: [], payload: [] };
          p.text.push(syls.map((s) => s.d).join(""));
          const pay = syls.filter((s) => s.role === "p").map((s) => s.d).join("");
          if (pay) p.payload.push(pay);
          parts.set(id, p);
        }
      }
      for (const [id, p] of parts) {
        items[id].text = p.text.join(" ");
        items[id].payload = p.payload.join(" ");
      }
    }
  }
  const seenLead = new Set<number>();
  for (const s of syllables) {
    if (s.role === "p" && !seenLead.has(s.item)) {
      s.lead = true;
      seenLead.add(s.item);
    }
  }

  return { anuvakas, items, syllables };
}

export interface Stats {
  syllables: number;
  refrain: number;
  fixed: number;
  payload: number;
  levels: [number, number, number, number];
}

export function statsOf(syls: Iterable<Syl>): Stats {
  const st: Stats = { syllables: 0, refrain: 0, fixed: 0, payload: 0, levels: [0, 0, 0, 0] };
  for (const s of syls) {
    st.syllables++;
    if (s.role === "r") st.refrain++;
    else if (s.role === "f") st.fixed++;
    else st.payload++;
    st.levels[s.lv]++;
  }
  return st;
}

export function lineSyllables(line: Line): Syl[] {
  return line.tokens.flatMap((t) => (t.kind === "word" ? t.syls : []));
}
