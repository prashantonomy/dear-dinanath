// Fonts for the Chamakam lab only, self-hosted through next/font like the rest
// of the site (no runtime requests to Google). Declared here rather than in
// src/lib/fonts.ts so other pages never load them.

import { Anybody, Noto_Sans_Devanagari } from "next/font/google";

// The Latin voice of the lab: a variable grotesk with a 50–150 width axis, so
// one family covers wide display lines and condensed instrument readouts. It
// carries every IAST letter the Chamakam uses (ā ī ū ṛ ḷ ṅ ñ ṭ ḍ ṇ ś ṣ ḥ ṃ).
export const anybody = Anybody({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
  variable: "--ck-latin-face",
});

// Chant text. Noto Sans Devanagari carries the Vedic marks this text needs:
// ॑ U+0951, ॒ U+0952, ᳚ U+1CDA, and the Taittiriya "gum" signs ꣳ U+A8F3, ꣴ U+A8F4.
export const notoDeva = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  display: "swap",
  variable: "--ck-deva-face",
  preload: true,
});
