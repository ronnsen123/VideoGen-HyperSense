import { spawn } from "child_process";

export interface RunOptions {
  command: string;
  args: string[];
  cwd: string;
  env?: Record<string, string>;
  timeout?: number;
  onStdout?: (line: string) => void;
  onStderr?: (line: string) => void;
}

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

export function run(opts: RunOptions): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, ...opts.env };
    const child = spawn(opts.command, opts.args, {
      cwd: opts.cwd,
      env,
      shell: false,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = opts.timeout
      ? setTimeout(() => {
          timedOut = true;
          child.kill("SIGTERM");
        }, opts.timeout)
      : null;

    child.stdout.on("data", (data: Buffer) => {
      const text = data.toString();
      stdout += text;
      if (opts.onStdout) {
        for (const line of text.split("\n").filter(Boolean)) {
          opts.onStdout(line);
        }
      }
    });

    child.stderr.on("data", (data: Buffer) => {
      const text = data.toString();
      stderr += text;
      if (opts.onStderr) {
        for (const line of text.split("\n").filter(Boolean)) {
          opts.onStderr(line);
        }
      }
    });

    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`Command timed out after ${opts.timeout}ms`));
      } else {
        resolve({ code: code ?? 1, stdout, stderr });
      }
    });

    child.on("error", (err) => {
      if (timer) clearTimeout(timer);
      reject(err);
    });
  });
}
