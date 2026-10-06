import assert from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { fixturesDir, runCli } from "./helpers.ts";

const projectDir = join(fixturesDir, "hello-steps");

test("an unknown command prints usage listing the available commands and exits 2", () => {
  const { exitCode, output } = runCli(projectDir, ["frobnicate"]);

  assert.match(output, /Unknown command: frobnicate/);
  assert.match(output, /Commands:\n {2}test/);
  assert.equal(exitCode, 2);
});

test("no command prints usage and exits 2", () => {
  const { exitCode, output } = runCli(projectDir, []);

  assert.match(output, /Commands:\n {2}test/);
  assert.equal(exitCode, 2);
});

test("a command that cannot run reports the error and exits 2, not 1, which means an unfinished Step", () => {
  const { exitCode, output } = runCli(fixturesDir, ["test"]);

  assert.match(output, /fieldwork\.json/);
  assert.equal(exitCode, 2);
});
