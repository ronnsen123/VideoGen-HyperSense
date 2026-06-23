# HyperSense Video Creator

Automated product video generation from any website URL. Paste a URL, and HyperSense captures brand assets, generates a narrator script using LLM, produces audio, plans visuals, and renders a finished video.

**Live demo (static UI):** https://ronnsen123.github.io/VideoGen-HyperSense/

## How it works

A 7-step wizard guides video creation:

| Step | What happens |
|------|-------------|
| **1. URL & Capture** | Paste a product URL. The system launches headless Chrome, captures screenshots, extracts design tokens (colors, fonts, headings, CTAs), and builds a structured `context_pack.md`. |
| **2. Configure** | Choose video focus, duration (30/60/90s), aspect ratio (16:9, 9:16, 1:1), and visual style preset. |
| **3. Story** | An LLM (Gemini 3.5 Flash) reads the context pack and writes a narrator script with a proper story arc: hook, value props, feature showcases, social proof, and CTA. Falls back to template-based generation if no API key is configured. |
| **4. Audio** | Text-to-speech generates voiceover per scene. Supports HeyGen, ElevenLabs, or local Kokoro TTS. Optional background music via Lyria or MusicGen. |
| **5. Visual Plan** | Each scene gets a visual composition plan: layout, animations, effects, and asset placement. |
| **6. Generate** | HyperFrames renders each scene as an HTML composition, then ffmpeg assembles the final video with transitions. |
| **7. Result** | Download the finished video. |

## Tech stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **HyperFrames** for HTML-based video composition and rendering
- **Gemini 3.5 Flash** for LLM-powered narrator script generation
- **Kokoro / HeyGen / ElevenLabs** for TTS
- **ffmpeg** for video assembly

## Local development

```bash
cd app
npm install
npm run dev
```

The app runs at `http://localhost:3000`. All 7 steps are functional locally, including the capture pipeline and LLM story generation.

### Environment variables

Create `app/.env.local`:

```
GEMINI_API_KEY=your-key-here
```

Get a free Gemini API key at https://aistudio.google.com/apikey. Without it, story generation falls back to template-based scripts.

Optional keys for cloud TTS and background music:

```
HEYGEN_API_KEY=...        # Cloud TTS with word-level timestamps
ELEVENLABS_API_KEY=...    # Alternative cloud TTS
```

### Prerequisites

- Node.js >= 18
- Chrome (downloaded automatically on first capture)
- ffmpeg (for video rendering)

## Project structure

```
app/
  src/
    app/
      create/           # 7-step wizard pages
        url/            # Step 1: URL capture
        configure/      # Step 2: Video config
        story/          # Step 3: Narrator script editor
        audio/          # Step 4: TTS generation
        design/         # Step 5: Visual planning
        generate/       # Step 6: Video rendering
        result/         # Step 7: Download
      api/              # Server-side API routes
    lib/
      pipeline/
        phases/         # Pipeline phases (capture, story, audio, etc.)
        llm.ts          # Gemini API client
        types.ts        # Shared TypeScript types
        presets.ts      # Visual style presets
    components/ui/      # shadcn/ui components
```

## GitHub Pages

The static UI is deployed automatically on push to `main` via GitHub Actions. The static export excludes API routes — it's a UI showcase only. Full functionality requires running locally.
