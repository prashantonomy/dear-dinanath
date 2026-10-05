import type { GlyphName } from "@/lib/chamakam/types";

// One line-drawn sign per room of the memory palace. Drawn on a 32-unit grid
// with a single stroke weight so they read as one family at any size.

const GODS_RING = Array.from({ length: 20 }, (_, i) => {
  const a = (i / 20) * Math.PI * 2 - Math.PI / 2;
  // rounded so server and browser render identical attribute strings
  const r = (v: number) => Math.round(v * 100) / 100;
  return [r(16 + Math.cos(a) * 11.5), r(16 + Math.sin(a) * 11.5)] as const;
});

const PATHS: Record<GlyphName, React.ReactNode> = {
  gate: (
    <>
      <path d="M9 29V13M23 29V13M5.5 13h21M9 13c1-6 13-6 14 0" />
      <circle cx="16" cy="6.5" r="1.2" />
    </>
  ),
  body: (
    <>
      <circle cx="16" cy="7.5" r="3" />
      <path d="M16 11v9M9.5 14.5 16 12.6l6.5 1.9M11.5 29 16 20l4.5 9" />
    </>
  ),
  rise: <path d="M5 28h22M7 28v-6h4v6M14 28V15h4v13M21 28V6h4v22" />,
  calm: (
    <path d="M3.5 22h25M7 27h18M10 22a6 6 0 0 1 12 0M16 10V7M9.6 12.6 7.5 10.5M22.4 12.6l2.1-2.1" />
  ),
  harvest: (
    <path d="M16 30V9.5M16 9.5c-1.6-2-1.6-4.5 0-6.5 1.6 2 1.6 4.5 0 6.5ZM16 14c-3.5-.3-5.4-2.2-5.6-5.6 3.4.2 5.3 2.1 5.6 5.6ZM16 14c3.5-.3 5.4-2.2 5.6-5.6-3.4.2-5.3 2.1-5.6 5.6ZM16 19.5c-3.5-.3-5.4-2.2-5.6-5.6 3.4.2 5.3 2.1 5.6 5.6ZM16 19.5c3.5-.3 5.4-2.2 5.6-5.6-3.4.2-5.3 2.1-5.6 5.6ZM16 25c-3.5-.3-5.4-2.2-5.6-5.6 3.4.2 5.3 2.1 5.6 5.6ZM16 25c3.5-.3 5.4-2.2 5.6-5.6-3.4.2-5.3 2.1-5.6 5.6Z" />
  ),
  earth: <path d="M2.5 26 12 11l6 9 3.5-5 8 11ZM8.5 21.5h6.5M17 23.5h6" />,
  gods: (
    <>
      {GODS_RING.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1" fill="currentColor" stroke="none" />
      ))}
      <circle cx="16" cy="16" r="3" />
    </>
  ),
  cups: <path d="M9.5 6h13c0 7-2.6 11-6.5 11S9.5 13 9.5 6ZM16 17v7.5M11 25.5h10M11.5 9.5h9" />,
  altar: (
    <path d="M6.5 29h19M8.5 29v-4h15v4M10.5 25v-3h11v3M16 21c-3.6-1.4-4.2-5.4-1.6-8.6.1 2 1 3 2.2 3.6-.4-3.2.8-6 3-8 .2 3.4 2.4 5.2 2 8.4-.3 2.6-2.4 4.4-5.6 4.6Z" />
  ),
  cosmos: (
    <>
      <circle cx="16" cy="16" r="4.5" />
      <ellipse cx="16" cy="16" rx="13" ry="5" transform="rotate(-24 16 16)" />
      <circle cx="26.6" cy="9.4" r="1.4" />
    </>
  ),
  herd: (
    <path d="M5 7c.6 4.8 3.4 6.6 7.4 6M27 7c-.6 4.8-3.4 6.6-7.4 6M12.4 13h7.2l-1 9.5c-.4 2.6-4.8 2.6-5.2 0ZM14.6 23.2h.01M17.4 23.2h.01M10 15.5 7 16.5M22 15.5l3 1" />
  ),
  count: (
    <>
      {[
        [8, 8, true],
        [16, 8, false],
        [24, 8, true],
        [8, 16, false],
        [16, 16, true],
        [24, 16, false],
        [8, 24, true],
        [16, 24, false],
        [24, 24, true],
      ].map(([x, y, on]) => (
        <circle
          key={`${x}-${y}`}
          cx={x as number}
          cy={y as number}
          r={on ? 2.3 : 1.1}
          fill={on ? "currentColor" : "none"}
          stroke={on ? "none" : "currentColor"}
        />
      ))}
    </>
  ),
  peace: <path d="M4.5 11h23M8 16.5h16M11.5 22h9" />,
};

export default function Glyph({
  name,
  size = 32,
  className,
}: {
  name: GlyphName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
