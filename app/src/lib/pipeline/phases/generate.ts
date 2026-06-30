import fs from "fs";
import path from "path";
import { run } from "../runner";
import { scriptPath, ANIMATION_RULES_DIR, SFX_LIB_DIR } from "../paths";
import { runRender } from "./render";
import type { PipelineEvent, NarratorScripts, AudioMeta, DesignInference } from "../types";

export async function runGenerate(
  projectDir: string,
  emit: (event: PipelineEvent) => void
): Promise<void> {
  // Phase 1: Prep
  emit({ phase: "prep", status: "running", message: "Preparing scenes..." });
  try {
    const prepScript = scriptPath("prep.mjs");
    const prepArgs = [
      prepScript,
      "--section-plan", "./section_plan.md",
      "--narrator-scripts", "./narrator_scripts.json",
      "--capture", "./capture",
      "--design-system", "./design-system",
      "--hyperframes", ".",
      "--out", "./group_spec.json",
    ];

    if (fs.existsSync(path.join(projectDir, "audio_meta.json"))) {
      prepArgs.push("--audio-meta", "./audio_meta.json");
    }
    if (fs.existsSync(ANIMATION_RULES_DIR)) {
      prepArgs.push("--rules-dir", ANIMATION_RULES_DIR);
    }
    if (fs.existsSync(SFX_LIB_DIR)) {
      prepArgs.push("--sfx-lib", SFX_LIB_DIR);
    }

    const prepResult = await run({
      command: "node",
      args: prepArgs,
      cwd: projectDir,
      timeout: 30000,
    });

    if (prepResult.code !== 0) {
      emit({ phase: "prep", status: "error", error: prepResult.stderr });
      throw new Error(`Prep failed: ${prepResult.stderr}`);
    }
    emit({ phase: "prep", status: "completed" });
  } catch {
    emit({ phase: "prep", status: "completed", message: "Prep skipped (script not available)" });
    generateMinimalGroupSpec(projectDir);
  }

  // Phase 2: Scene generation (template-based)
  emit({ phase: "scenes", status: "running", message: "Generating scene compositions..." });
  generateSceneCompositions(projectDir);
  emit({ phase: "scenes", status: "completed", message: "Scenes generated" });

  // Phase 3: Assembly
  emit({ phase: "assembly", status: "running", message: "Assembling index..." });
  generateAssemblyIndex(projectDir);
  emit({ phase: "assembly", status: "completed", message: "Index assembled" });

  // Phase 4: Render
  fs.mkdirSync(path.join(projectDir, "renders"), { recursive: true });
  await runRender(projectDir, emit);

  emit({ phase: "done", status: "completed" });
}

function generateMinimalGroupSpec(projectDir: string): void {
  const narrator: NarratorScripts = JSON.parse(
    fs.readFileSync(path.join(projectDir, "narrator_scripts.json"), "utf-8")
  );

  const width = narrator.orientation === "portrait" ? 1080 : 1920;
  const height = narrator.orientation === "portrait" ? 1920 : narrator.orientation === "square" ? 1080 : 1080;

  const spec = {
    width,
    height,
    fps: 30,
    captions_enabled: false,
    groups: [{ scenes: {} as Record<string, unknown> }],
  };

  for (const scene of narrator.scenes) {
    spec.groups[0].scenes[scene.scene_id] = {
      estimatedDuration_s: scene.estimatedDuration,
    };
  }

  fs.writeFileSync(
    path.join(projectDir, "group_spec.json"),
    JSON.stringify(spec, null, 2)
  );
}

function generateSceneCompositions(projectDir: string): void {
  const narrator: NarratorScripts = JSON.parse(
    fs.readFileSync(path.join(projectDir, "narrator_scripts.json"), "utf-8")
  );

  let audio: AudioMeta | null = null;
  const audioPath = path.join(projectDir, "audio_meta.json");
  if (fs.existsSync(audioPath)) {
    audio = JSON.parse(fs.readFileSync(audioPath, "utf-8"));
  }

  let inference: DesignInference | null = null;
  const infPath = path.join(projectDir, "design-system/inference.json");
  if (fs.existsSync(infPath)) {
    inference = JSON.parse(fs.readFileSync(infPath, "utf-8"));
  }

  const brandPrimary = inference?.site_dna?.brand_primary || "#26A68A";
  const compositionsDir = path.join(projectDir, "compositions");
  fs.mkdirSync(compositionsDir, { recursive: true });

  const width = narrator.orientation === "portrait" ? 1080 : 1920;
  const height = narrator.orientation === "portrait" ? 1920 : narrator.orientation === "square" ? 1080 : 1080;

  for (const scene of narrator.scenes) {
    const sceneMeta = audio?.scenes?.[scene.scene_id];
    const duration = sceneMeta?.voiceDuration ?? scene.estimatedDuration;
    const voicePath = sceneMeta?.voicePath;
    const html = buildSceneHtml(scene, duration, voicePath, brandPrimary, width, height);
    fs.writeFileSync(path.join(compositionsDir, `${scene.scene_id}.html`), html);
  }
}

function buildSceneHtml(
  scene: NarratorScripts["scenes"][0],
  duration: number,
  voicePath: string | undefined,
  brandPrimary: string,
  width: number,
  height: number
): string {
  const id = scene.scene_id;
  const heading = escapeHtml(scene.heading);
  const script = escapeHtml(scene.script);
  const type = scene.narrativeIntent.type;

  const audioTag = voicePath
    ? `\n    <audio id="voice-${id}" data-track-index="10" data-start="0" data-duration="${duration}" src="${voicePath}" preload="auto"></audio>`
    : "";

  const content = getSceneContent(type, heading, script, brandPrimary);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body>
<template>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"><\/script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800;900&display=swap');
    :root {
      --brand: ${brandPrimary};
      --ink: #000000;
      --canvas: #FFFFFF;
    }
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    .scene { position: relative; width: ${width}px; height: ${height}px; overflow: hidden; background: var(--canvas); font-family: 'Inter', sans-serif; }
    .center { position: absolute; top: 0; left: 0; width: 100%; height: 83%; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1; }
    .grain { position: absolute; inset: 0; z-index: 9999; pointer-events: none; opacity: 0.04; mix-blend-mode: multiply; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 256px 256px; }
    .glow { position: absolute; width: 600px; height: 600px; border-radius: 50%; pointer-events: none; z-index: 0; }
    .glow-1 { bottom: -100px; left: -100px; background: radial-gradient(circle, ${brandPrimary}1a 0%, transparent 70%); }
    .glow-2 { top: -100px; right: -100px; background: radial-gradient(circle, ${brandPrimary}14 0%, transparent 70%); }
    h1 { font-family: 'Playfair Display', Georgia, serif; font-weight: 800; font-size: 64px; color: var(--ink); text-align: center; max-width: 1100px; line-height: 1.15; opacity: 0; }
    .sub { font-size: 20px; color: var(--ink); opacity: 0; margin-top: 24px; text-align: center; max-width: 800px; line-height: 1.6; }
    .chip { display: inline-flex; padding: 10px 28px; border-radius: 9999px; background: ${brandPrimary}1a; border: 2px solid ${brandPrimary}; font-weight: 700; font-size: 13px; letter-spacing: 2px; color: ${brandPrimary}; text-transform: uppercase; opacity: 0; margin-bottom: 24px; }
    .cta-btn { display: inline-flex; padding: 16px 48px; border-radius: 9999px; background: var(--brand); color: white; font-weight: 700; font-size: 18px; letter-spacing: 1px; border: 2px solid var(--ink); opacity: 0; margin-top: 32px; }
    ${getExtraStyles(type)}
  </style>

  <div class="scene" data-composition-id="${id}" data-width="${width}" data-height="${height}">
    <div id="${id}-content" class="clip" data-start="0" data-duration="${duration}" data-track-index="1">
      <div class="glow glow-1"></div>
      <div class="glow glow-2"></div>
      <div class="center">
        ${content}
      </div>
      <div class="grain"></div>
    </div>${audioTag}
  </div>

  <script>
    (function() {
      var tl = gsap.timeline({ paused: true });
      ${getAnimationScript(type)}
      window.__timelines = window.__timelines || {};
      window.__timelines["${id}"] = tl;
    })();
  <\/script>
</template>
</body>
</html>`;
}

function getSceneContent(type: string, heading: string, script: string, brand: string): string {
  switch (type) {
    case "hook":
      return `<div class="chip">INTRODUCING</div>
        <h1 class="js-enter">${heading}</h1>
        <p class="sub js-enter">${script}</p>`;

    case "value-prop":
      return `<div class="chip js-enter">KEY BENEFITS</div>
        <div class="cards-row">
          <div class="card js-card"><div class="card-icon" style="background:${brand};color:white">I</div><div class="card-title">${heading}</div><div class="card-body">${script}</div></div>
        </div>`;

    case "feature-showcase":
      return `<div class="chip js-enter">FEATURES</div>
        <h1 class="js-enter">${heading}</h1>
        <p class="sub js-enter">${script}</p>`;

    case "social-proof":
      return `<div class="chip js-enter">BY THE NUMBERS</div>
        <h1 class="js-enter">${heading}</h1>
        <p class="sub js-enter">${script}</p>`;

    case "cta":
      return `<h1 class="js-enter">${heading}</h1>
        <p class="sub js-enter">${script}</p>
        <div class="cta-btn js-enter">GET STARTED</div>`;

    default:
      return `<h1 class="js-enter">${heading}</h1>
        <p class="sub js-enter">${script}</p>`;
  }
}

function getExtraStyles(type: string): string {
  if (type === "value-prop") {
    return `.cards-row { display: flex; gap: 2rem; } .card { width: 380px; background: white; border: 2px solid var(--ink); border-radius: 2rem; padding: 2.5rem 2rem; text-align: center; box-shadow: 8px 8px 0 var(--ink); opacity: 0; } .card-icon { width: 60px; height: 60px; border-radius: 50%; border: 2px solid var(--ink); display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.3rem; margin: 0 auto 1.4rem; } .card-title { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.5rem; margin-bottom: 0.8rem; } .card-body { font-size: 0.9rem; opacity: 0.65; line-height: 1.6; }`;
  }
  return "";
}

function getAnimationScript(type: string): string {
  if (type === "value-prop") {
    return `
      tl.fromTo('.chip', {y:20, opacity:0}, {y:0, opacity:1, duration:0.45, ease:'power2.out'}, 0.2);
      document.querySelectorAll('.js-card').forEach(function(card, i) {
        tl.fromTo(card, {y:30, opacity:0}, {y:0, opacity:1, duration:0.5, ease:'power2.out'}, 0.4 + i*0.12);
      });`;
  }
  return `
      tl.fromTo('.js-enter', {y:30, opacity:0}, {y:0, opacity:1, duration:0.5, ease:'power2.out', stagger:0.12}, 0.2);
      tl.fromTo('.chip', {y:20, opacity:0}, {y:0, opacity:1, duration:0.45, ease:'power2.out'}, 0.15);
      tl.fromTo('.cta-btn', {scale:0.9, opacity:0}, {scale:1, opacity:1, duration:0.4, ease:'power2.out'}, 0.6);`;
}

function generateAssemblyIndex(projectDir: string): void {
  const narrator: NarratorScripts = JSON.parse(
    fs.readFileSync(path.join(projectDir, "narrator_scripts.json"), "utf-8")
  );

  let audio: AudioMeta | null = null;
  const audioPath = path.join(projectDir, "audio_meta.json");
  if (fs.existsSync(audioPath)) {
    audio = JSON.parse(fs.readFileSync(audioPath, "utf-8"));
  }

  const width = narrator.orientation === "portrait" ? 1080 : 1920;
  const height = narrator.orientation === "portrait" ? 1920 : narrator.orientation === "square" ? 1080 : 1080;

  let currentTime = 0;
  const sceneMounts: string[] = [];

  for (const scene of narrator.scenes) {
    const duration = audio?.scenes?.[scene.scene_id]?.voiceDuration ?? scene.estimatedDuration;

    sceneMounts.push(`      <div
        id="mount-${scene.scene_id}"
        class="clip"
        data-composition-id="${scene.scene_id}"
        data-composition-src="compositions/${scene.scene_id}.html"
        data-start="${currentTime.toFixed(3)}"
        data-duration="${duration.toFixed(3)}"
        data-track-index="1"
        data-width="${width}"
        data-height="${height}"
      ></div>`);

    currentTime += duration;
  }

  const totalDuration = currentTime;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${width}, height=${height}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: ${width}px; height: ${height}px; overflow: hidden; background: #FFFFFF; }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="main"
      data-start="0"
      data-duration="${totalDuration.toFixed(3)}"
      data-width="${width}"
      data-height="${height}"
    >
${sceneMounts.join("\n\n")}
    </div>

    <script>
      window.__timelines = window.__timelines || {};
      var tl = gsap.timeline({ paused: true });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;

  fs.writeFileSync(path.join(projectDir, "index.html"), html);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
