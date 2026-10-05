import type { Syl } from "@/lib/chamakam/types";

/** Devanagari (or IAST) syllables coloured by pitch, without the staff. */
export default function SylText({
  syls,
  roman = false,
  dimFrame = false,
  className,
}: {
  syls: Syl[];
  roman?: boolean;
  dimFrame?: boolean;
  className?: string;
}) {
  return (
    <span className={`ck-syltext ${className ?? ""}`} data-roman={roman || undefined}>
      {syls.map((s, i) => (
        <span key={i} data-lv={s.lv} data-frame={(dimFrame && s.role !== "p") || undefined}>
          {i > 0 && s.ws ? " " : ""}
          {roman ? s.r : s.d}
        </span>
      ))}
    </span>
  );
}
