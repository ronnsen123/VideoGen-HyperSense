import fs from "fs";
import path from "path";
import type { NarratorScripts, AudioMeta, DesignInference } from "../types";

const SCENE_LAYOUTS: Record<string, string> = {
  hook: `**Layout:** Centered hero. Logo top-center, display headline below, chip underneath. Floating decorative pills at edges. Two radial accent glows.
**Components:** hero, chip, floating-pills, title-pill
**Effects:** center-outward-expansion for headline entry`,

  "value-prop": `**Layout:** Three pillar-cards in horizontal row (2rem gap), each with circular icon, title, body text. Section chip above row. Radial glow center-bottom.
**Components:** pillar-card x3, chip
**Effects:** discrete-text-sequence for card stagger reveal`,

  "feature-showcase": `**Layout:** Asymmetric two-column. Left: headline + body text. Right: stacked visual-frames with screenshots. Chip top-left. Two radial accent glows.
**Components:** visual-frame x2, chip, hero
**Effects:** split-tilt-cards entry on visual-frames`,

  "social-proof": `**Layout:** 2x2 stat-counter grid centered. Each tile: white pill-card with large numeral, label, accent bar. Single radial glow center.
**Components:** stat-counter x4
**Effects:** counting-dynamic-scale on numerals, stat-bars-and-fills`,

  cta: `**Layout:** Full-width centered closing. Display headline, logo below, CTA chip. Floating decorative pills at edges. Three radial accent glows.
**Components:** hero, chip, floating-pills
**Effects:** center-outward-expansion for lockup reveal`,
};

export function generateVisualPlan(
  projectDir: string
): string {
  const narratorPath = path.join(projectDir, "narrator_scripts.json");
  const audioPath = path.join(projectDir, "audio_meta.json");
  const inferencePath = path.join(projectDir, "design-system/inference.json");

  const narrator: NarratorScripts = JSON.parse(
    fs.readFileSync(narratorPath, "utf-8")
  );

  let audio: AudioMeta | null = null;
  if (fs.existsSync(audioPath)) {
    audio = JSON.parse(fs.readFileSync(audioPath, "utf-8"));
  }

  let inference: DesignInference | null = null;
  if (fs.existsSync(inferencePath)) {
    inference = JSON.parse(fs.readFileSync(inferencePath, "utf-8"));
  }

  const brandPrimary = inference?.site_dna?.brand_primary || "#26A68A";

  const assetFiles = listAssets(projectDir);

  let md = `# ${narrator.project} — Visual Plan\n\n`;
  md += `## Film Direction\n\n`;
  md += `**Palette system:** Brand primary (${brandPrimary}). White canvas grounds every scene. Brand color drives headline pills, icon fills, and stat numerals.\n\n`;
  md += `**Type roles:** Display font for headlines (sentence case, tight tracking). Mono uppercase for chips and labels. Body font for copy at opacity 0.65.\n\n`;
  md += `**Motion defaults:** GSAP paused timeline, 30fps render. Entry: y:30, opacity:0 → 1 with power2.out, 0.5s per element, stagger 0.1s.\n\n`;
  md += `**Ambient system:** Every scene carries 4% grain overlay (multiply blend) + 1-3 radial accent glows (8-12% opacity).\n\n`;
  md += `**Transition vocabulary:** 0.6s opacity cross-fade between scenes.\n\n`;

  if (assetFiles.length > 0) {
    md += `**Available assets:** ${assetFiles.slice(0, 10).join(", ")}\n\n`;
  }

  for (const scene of narrator.scenes) {
    const duration = audio?.scenes?.[scene.scene_id]?.voiceDuration ?? scene.estimatedDuration;
    const type = scene.narrativeIntent.type;
    const layout = SCENE_LAYOUTS[type] || SCENE_LAYOUTS["hook"];

    md += `## ${scene.scene_id}: ${type}\n\n`;
    md += `**Duration:** ${duration.toFixed(1)}s\n`;
    md += `${layout}\n\n`;
  }

  return md;
}

function listAssets(projectDir: string): string[] {
  const assetsDir = path.join(projectDir, "capture/assets");
  if (!fs.existsSync(assetsDir)) return [];
  try {
    return fs
      .readdirSync(assetsDir)
      .filter((f) => /\.(png|jpg|jpeg|svg|webp)$/i.test(f));
  } catch {
    return [];
  }
}

export function saveVisualPlan(projectDir: string, content: string): void {
  fs.writeFileSync(path.join(projectDir, "section_plan.md"), content);
}

export function loadVisualPlan(projectDir: string): string | null {
  const p = path.join(projectDir, "section_plan.md");
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf-8");
}
