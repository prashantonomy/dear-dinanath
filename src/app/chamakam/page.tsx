import type { Metadata, Viewport } from "next";

import "./chamakam.css";
import { anybody, notoDeva } from "./fonts";
import Lab from "@/components/chamakam/Lab";

export const metadata: Metadata = {
  title: "Chamakam memory lab",
  description:
    "Learn the Chamakam (Taittirīya Saṃhitā 4.7) word for word and pitch for pitch: its patterns, its svara melody, and a practice console built on retrieval, fading cues and spaced review.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function ChamakamPage() {
  return (
    <div className={`ck ${anybody.variable} ${notoDeva.variable}`}>
      <Lab />
    </div>
  );
}
