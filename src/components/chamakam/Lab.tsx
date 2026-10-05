"use client";

import { useCallback, useMemo, useState } from "react";

import { LabContext, prefersReducedMotion } from "./lab-context";
import TopBar from "./TopBar";
import Hero from "./Hero";
import Frame from "./Frame";
import Pitch from "./Pitch";
import Palace from "./Palace";
import Patterns from "./Patterns";
import Method from "./Method";
import Console from "./Console";
import Sources from "./Sources";

/** The Chamakam memory lab: one page, one shared "current room". */
export default function Lab() {
  const [room, setRoom] = useState(1);

  const practise = useCallback((n?: number) => {
    if (typeof n === "number") setRoom(n);
    document
      .getElementById("practice")
      ?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  }, []);

  const value = useMemo(() => ({ room, setRoom, practise }), [room, practise]);

  return (
    <LabContext.Provider value={value}>
      <TopBar />
      <Hero />
      <Frame />
      <Pitch />
      <Palace />
      <Patterns />
      <Method />
      <Console />
      <Sources />
    </LabContext.Provider>
  );
}
