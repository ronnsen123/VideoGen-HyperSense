import type { PresetInfo } from "./types";

export const PRESETS: PresetInfo[] = [
  {
    id: "capsule",
    label: "Capsule",
    bestFor: ["lifestyle brands", "creator portfolios", "DTC launches", "beauty", "wellness"],
    avoidFor: ["enterprise compliance", "financial precision"],
  },
  {
    id: "editorial",
    label: "Editorial / Swiss",
    bestFor: ["longform essays", "research recaps", "restrained editorial", "swiss-style decks"],
    avoidFor: ["playful brands", "gaming", "youth culture"],
  },
  {
    id: "liquid-glass",
    label: "Liquid Glass",
    bestFor: ["premium SaaS", "AI products", "hardware launches", "futuristic tech"],
    avoidFor: ["vintage brands", "hand-made goods", "casual tone"],
  },
  {
    id: "neo-brutalism",
    label: "Neo-Brutalism",
    bestFor: ["manifesto brands", "indie SaaS", "declarative launches", "agency talks"],
    avoidFor: ["quiet luxury", "traditional finance", "regulated industries"],
  },
  {
    id: "playful",
    label: "Playful",
    bestFor: ["indie product launches", "creator portfolios", "lifestyle", "community brands"],
    avoidFor: ["corporate authority", "medical", "legal"],
  },
  {
    id: "8-bit-orbit",
    label: "8-Bit Orbit",
    bestFor: ["gaming", "cyberpunk", "web3", "indie tools", "retro tech"],
    avoidFor: ["luxury fashion", "fine dining", "traditional finance"],
  },
  {
    id: "block-frame",
    label: "Block Frame",
    bestFor: ["indie SaaS launches", "agency credentials", "creative reviews", "brand redesigns"],
    avoidFor: ["soft feminine brands", "children's content"],
  },
  {
    id: "creative-mode",
    label: "Creative Mode",
    bestFor: ["creative agencies", "design studios", "brand-led launches", "editorial-confident"],
    avoidFor: ["institutional restraint", "formal corporate"],
  },
  {
    id: "daisy-days",
    label: "Daisy Days",
    bestFor: ["educational content", "wellness", "community workshops", "creator portfolios"],
    avoidFor: ["enterprise compliance", "security", "authority-first"],
  },
  {
    id: "editorial-forest",
    label: "Editorial Forest",
    bestFor: ["warm product stories", "research recaps", "studio updates", "literary brands"],
    avoidFor: ["high-energy tech", "gaming", "fast-paced"],
  },
  {
    id: "emerald-editorial",
    label: "Emerald Editorial",
    bestFor: ["literary brands", "strategy", "leadership decks", "longform research"],
    avoidFor: ["playful startups", "gaming", "youth culture"],
  },
  {
    id: "peoples-platform",
    label: "People's Platform",
    bestFor: ["community platforms", "social apps", "collaborative tools"],
    avoidFor: ["luxury brands", "traditional enterprise"],
  },
  {
    id: "pin-and-paper",
    label: "Pin & Paper",
    bestFor: ["qualitative research", "founder reflections", "longform brand stories"],
    avoidFor: ["precision tech", "fintech dashboards"],
  },
  {
    id: "retro-zine",
    label: "Retro Zine / Collage",
    bestFor: ["zine aesthetics", "collage layouts", "retro branding", "mixed-media editorial"],
    avoidFor: ["clean SaaS", "corporate presentations"],
  },
];

export function getPresetById(id: string): PresetInfo | undefined {
  return PRESETS.find((p) => p.id === id);
}
