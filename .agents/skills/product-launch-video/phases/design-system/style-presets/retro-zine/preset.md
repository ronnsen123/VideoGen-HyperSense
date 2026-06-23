```preset-meta
{
  "name": "retro-zine",
  "label": "Retro Zine / Collage",
  "fingerprint": {
    "shadow": "layered-offset",
    "border": "thick",
    "motion": "punchy-cut",
    "density": "high",
    "contrast": "high"
  },
  "match_signals": [
    { "kind": "thick_borders",       "weight": 0.25 },
    { "kind": "collage_layout",      "weight": 0.25 },
    { "kind": "high_saturation",     "weight": 0.20 },
    { "kind": "mixed_media",         "weight": 0.15 },
    { "kind": "retro_typography",    "weight": 0.15 }
  ],
  "best_for": ["zine aesthetics", "collage layouts", "retro branding", "mixed-media editorial", "DIY punk feel"],
  "avoid_for": ["corporate polish", "minimal clean", "refined luxury", "subdued editorial"],
  "chromeFonts": {
    "googleFontsHref": "https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;600;800&family=Playfair+Display:wght@700;900&display=swap",
    "display": "Playfair Display",
    "body": "Inter",
    "script": "Space Mono",
    "mono": "Space Mono"
  }
}
```

# retro-zine

A collage-inspired, retro-magazine visual system with offset layers, grain textures, thick borders, and mixed typography. Evokes the feel of hand-assembled zines and vintage print media.

## Palette strategy

Use bold, high-contrast color blocking with desaturated background tones. Primary accents are punchy — neon yellow, hot pink, or electric blue against kraft/cream paper tones. Grain overlay is mandatory.

## Typography

- **Display**: Bold serif or slab for headlines, often rotated or offset
- **Body**: Clean sans-serif for readability contrast
- **Accent**: Monospace for labels, tags, and callouts

## Motion language

Punchy cuts, offset-slide entrances, stamp/rotate reveals. No smooth easing — prefer step() or short elastic. Paper-tear and collage-layer motions.

## Component inventory

See `components/` directory for available building blocks.
