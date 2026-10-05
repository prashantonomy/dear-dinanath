"use client";

import { createContext, useContext } from "react";

export interface LabState {
  /** The room (0 opening, 1–11 anuvākas, 12 śānti) loaded in the practice console. */
  room: number;
  setRoom: (n: number) => void;
  /** Scroll to the practice console, optionally loading a room first. */
  practise: (n?: number) => void;
}

export const LabContext = createContext<LabState | null>(null);

export function useLab(): LabState {
  const ctx = useContext(LabContext);
  if (!ctx) throw new Error("useLab must be used inside <Lab>");
  return ctx;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
