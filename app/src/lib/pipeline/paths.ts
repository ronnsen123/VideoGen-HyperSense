import path from "path";
import fs from "fs";

export const WORKSPACE_ROOT = path.resolve(process.cwd(), "..");

export const SKILL_DIR = path.join(
  WORKSPACE_ROOT,
  ".agents/skills/product-launch-video"
);

export const VIDEOS_DIR = path.join(WORKSPACE_ROOT, "videos");

function findScript(name: string): string {
  const candidates = [
    path.join(SKILL_DIR, "scripts", name),
    path.join(WORKSPACE_ROOT, ".agents/skills/faceless-explainer/scripts", name),
    path.join(WORKSPACE_ROOT, ".agents/skills/pr-to-video/scripts", name),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`Script not found: ${name}`);
}

export function scriptPath(name: string): string {
  return findScript(name);
}

export function projectDir(projectName: string): string {
  return path.join(VIDEOS_DIR, projectName);
}

export const DESIGN_SCRIPTS_DIR = path.join(
  SKILL_DIR,
  "phases/design-system/scripts"
);

export const PRESETS_DIR = path.join(
  SKILL_DIR,
  "phases/design-system/style-presets"
);

export const ANIMATION_RULES_DIR = path.join(
  WORKSPACE_ROOT,
  ".agents/skills/hyperframes-animation/rules"
);

export const SFX_LIB_DIR = path.join(SKILL_DIR, "assets/sfx");
