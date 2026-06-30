# HyperSense App

Next.js app for the HyperSense video-creation wizard. The UI creates a project, captures a website, generates narrator scripts and audio, reviews a storyboard, then renders a HyperFrames video.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build And Checks

```bash
npm run lint
npm run build
```

The build script uses `next build --webpack` because this local Next 16 setup can fall back to WASM SWC bindings, while Turbopack requires native bindings on this platform.

## Environment

Required for LLM story generation:

```bash
GEMINI_API_KEY=...
```

Accepted alternative:

```bash
GOOGLE_API_KEY=...
```

Optional cloud audio providers:

```bash
HEYGEN_API_KEY=...
ELEVENLABS_API_KEY=...
```

Without an LLM key, story generation falls back to template-based scripts.

## Local Pipeline Assumptions

The app expects to run from this repository's `app/` directory. Pipeline paths resolve one directory up to:

- `.agents/skills/product-launch-video`
- `.agents/skills/hyperframes-animation`
- `videos/`

Project metadata is persisted to `videos/projects.json`; generated project artifacts live in `videos/<project-name>/`.

## Important Files

- `src/app/create/*` - the seven-step wizard UI
- `src/app/api/projects/*` - project and pipeline API routes
- `src/lib/pipeline/phases/*` - capture, story, audio, design, and render phases
- `src/lib/store.ts` - file-backed project metadata store
