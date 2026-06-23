import { run } from "../runner";
import { DESIGN_SCRIPTS_DIR } from "../paths";

export async function buildDesignSystem(
  projectDir: string,
  preset: string
): Promise<void> {
  const buildDesign = `${DESIGN_SCRIPTS_DIR}/build-design.mjs`;
  const args = [buildDesign, "./design-system"];
  if (preset && preset !== "auto") {
    args.push("--style", preset);
  }

  const result = await run({
    command: "node",
    args,
    cwd: projectDir,
    timeout: 60000,
  });

  if (result.code !== 0) {
    throw new Error(`Design system build failed: ${result.stderr}`);
  }
}
