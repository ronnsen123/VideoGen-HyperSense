import { run } from "../runner";
import { DESIGN_SCRIPTS_DIR, scriptPath } from "../paths";
import type { PipelineEvent } from "../types";

export async function runCapture(
  projectDir: string,
  url: string,
  emit: (event: PipelineEvent) => void
): Promise<void> {
  emit({ phase: "capture", status: "running", message: "Capturing website..." });

  const captureResult = await run({
    command: "npx",
    args: ["hyperframes", "capture", url, "-o", "./capture"],
    cwd: projectDir,
    timeout: 120000,
    onStdout: (line) =>
      emit({ phase: "capture", status: "running", message: line }),
  });

  if (captureResult.code !== 0) {
    emit({ phase: "capture", status: "error", error: captureResult.stderr });
    throw new Error(`Capture failed: ${captureResult.stderr}`);
  }
  emit({ phase: "capture", status: "completed", message: "Website captured" });

  emit({
    phase: "context-pack",
    status: "running",
    message: "Extracting context...",
  });
  try {
    const cpScript = scriptPath("derive-context-pack.mjs");
    await run({
      command: "node",
      args: [cpScript, "--capture", "./capture"],
      cwd: projectDir,
      timeout: 30000,
    });
    emit({ phase: "context-pack", status: "completed" });
  } catch {
    emit({
      phase: "context-pack",
      status: "completed",
      message: "Context pack skipped (script not found)",
    });
  }

  emit({
    phase: "design-inference",
    status: "running",
    message: "Inferring design style...",
  });
  const buildDesign = `${DESIGN_SCRIPTS_DIR}/build-design.mjs`;
  const diResult = await run({
    command: "node",
    args: [buildDesign, "./design-system", "--no-emit"],
    cwd: projectDir,
    timeout: 30000,
  });

  if (diResult.code !== 0) {
    emit({
      phase: "design-inference",
      status: "error",
      error: diResult.stderr,
    });
    throw new Error(`Design inference failed: ${diResult.stderr}`);
  }
  emit({
    phase: "design-inference",
    status: "completed",
    message: "Style inferred",
  });

  emit({ phase: "done", status: "completed" });
}
