import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const toolingDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(toolingDir, "src", "cli.ts");

export const helloSteps = join(toolingDir, "..", "tracks", "typescript-on-node", "fixtures", "hello-steps");

export interface RunResult {
  exitCode: number | null;
  output: string;
}

/** Runs a maintainer command the way `npm run fieldwork -- <args>` does. */
export function runFieldwork(args: string[]): RunResult {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
  return { exitCode: result.status, output: result.stdout + result.stderr };
}

/**
 * Copies hello-steps into tooling/.tmp with some files overwritten (keyed by
 * path relative to the Project root), to make a deliberately broken Project.
 */
export function brokenHelloSteps(overrides: Record<string, string>): string {
  const tmpRoot = join(toolingDir, ".tmp");
  mkdirSync(tmpRoot, { recursive: true });
  const dir = mkdtempSync(join(tmpRoot, "hello-steps-"));
  cpSync(helloSteps, dir, { recursive: true });
  for (const [path, content] of Object.entries(overrides)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}
