import { run } from "../runner";
import { scriptPath } from "../paths";
import type { PipelineEvent } from "../types";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

function ensurePython311Symlink(projectDir: string): string | null {
  const binDir = path.join(projectDir, ".bin");
  const symlink = path.join(binDir, "python3");
  if (fs.existsSync(symlink)) return binDir;

  try {
    const python311 = execSync("which python3.11", { encoding: "utf-8" }).trim();
    if (python311) {
      fs.mkdirSync(binDir, { recursive: true });
      fs.symlinkSync(python311, symlink);
      return binDir;
    }
  } catch {
    // python3.11 not available
  }
  return null;
}

export async function runAudio(
  projectDir: string,
  voice: string,
  noBgm: boolean,
  emit: (event: PipelineEvent) => void
): Promise<void> {
  emit({ phase: "audio", status: "running", message: "Generating voiceover..." });

  const env: Record<string, string> = {};
  const binDir = ensurePython311Symlink(projectDir);
  if (binDir) {
    env.PATH = `${binDir}:${process.env.PATH}`;
  }

  let audioScript: string;
  try {
    audioScript = scriptPath("audio.mjs");
  } catch {
    emit({
      phase: "audio",
      status: "error",
      error: "audio.mjs script not found",
    });
    throw new Error("audio.mjs not found in any skill directory");
  }

  const args = [
    audioScript,
    "--narrator-scripts", "./narrator_scripts.json",
    "--hyperframes", ".",
    "--out", "./audio_meta.json",
  ];

  if (voice) {
    args.push("--voice", voice);
  }
  if (noBgm) {
    args.push("--no-bgm");
  }

  const result = await run({
    command: "node",
    args,
    cwd: projectDir,
    timeout: 180000,
    env,
    onStdout: (line) =>
      emit({ phase: "audio", status: "running", message: line }),
    onStderr: (line) =>
      emit({ phase: "audio", status: "running", message: line }),
  });

  if (result.code !== 0) {
    emit({ phase: "audio", status: "error", error: result.stderr });
    throw new Error(`Audio generation failed: ${result.stderr}`);
  }

  emit({ phase: "audio", status: "completed", message: "Audio generated" });
  emit({ phase: "done", status: "completed" });
}
