"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SECTIONS = [
  ["frame", "Frame"],
  ["pitch", "Pitch"],
  ["palace", "Palace"],
  ["patterns", "Patterns"],
  ["method", "Method"],
] as const;

/** A thin bar that stays out of the way: home, the section jumps, and Practise. */
export default function TopBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="ck-top" data-scrolled={scrolled || undefined}>
      <Link href="/" className="ck-top__home" aria-label="Dear Dinanath">
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Dear Dinanath</span>
      </Link>
      <nav className="ck-top__nav" aria-label="Lab sections">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      </nav>
      <div className="ck-top__end">
        <a href="#practice" className="ck-btn" data-small data-primary>
          Practise
        </a>
      </div>
    </header>
  );
}
