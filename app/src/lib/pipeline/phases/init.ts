import { run } from "../runner";
import { VIDEOS_DIR } from "../paths";
import path from "path";
import fs from "fs";

export async function initProject(projectName: string): Promise<string> {
  const dir = path.join(VIDEOS_DIR, projectName);

  if (fs.existsSync(path.join(dir, "hyperframes.json"))) {
    return dir;
  }

  fs.mkdirSync(VIDEOS_DIR, { recursive: true });

  const result = await run({
    command: "npx",
    args: [
      "hyperframes",
      "init",
      dir,
      "--non-interactive",
      "--skip-skills",
      "--example=blank",
    ],
    cwd: VIDEOS_DIR,
    timeout: 30000,
  });

  if (result.code !== 0) {
    throw new Error(`init failed: ${result.stderr}`);
  }

  return dir;
}
