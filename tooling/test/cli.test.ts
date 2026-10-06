import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const cliPath = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "cli.ts");

function runFieldwork(args: string[]) {
  const result = spawnSync(process.execPath, [cliPath, ...args], { encoding: "utf8" });
  return { exitCode: result.status, output: result.stdout + result.stderr };
}

test("an unknown maintainer command prints usage and exits 2", () => {
  const { exitCode, output } = runFieldwork(["frobnicate"]);

  assert.match(output, /Unknown command: frobnicate/);
  assert.match(output, /Usage: npm run fieldwork -- <command>/);
  assert.equal(exitCode, 2);
});
