import { run } from "../runner";
import type { PipelineEvent } from "../types";
import fs from "fs";
import path from "path";

export async function runRender(
  projectDir: string,
  emit: (event: PipelineEvent) => void
): Promise<void> {
  emit({ phase: "render", status: "running", message: "Starting render..." });

  const env: Record<string, string> = {};
  const binDir = path.join(projectDir, ".bin");
  if (fs.existsSync(path.join(binDir, "python3"))) {
    env.PATH = `${binDir}:${process.env.PATH}`;
  }

  const result = await run({
    command: "npx",
    args: [
      "hyperframes",
      "render",
      "-o",
      "renders/video.mp4",
      "--quality",
      "standard",
      "--fps",
      "30",
    ],
    cwd: projectDir,
    timeout: 600000,
    env,
    onStdout: (line) => {
      const frameMatch = line.match(/frame (\d+)\/(\d+)/);
      if (frameMatch) {
        const progress = Math.round(
          (parseInt(frameMatch[1]) / parseInt(frameMatch[2])) * 100
        );
        emit({
          phase: "render",
          status: "running",
          message: `Capturing frame ${frameMatch[1]}/${frameMatch[2]}`,
          progress,
        });
      } else {
        emit({ phase: "render", status: "running", message: line });
      }
    },
    onStderr: (line) =>
      emit({ phase: "render", status: "running", message: line }),
  });

  if (result.code !== 0) {
    emit({ phase: "render", status: "error", error: result.stderr });
    throw new Error(`Render failed: ${result.stderr}`);
  }

  emit({ phase: "render", status: "completed", message: "Video rendered" });
}
