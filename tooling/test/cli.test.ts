import assert from "node:assert/strict";
import { test } from "node:test";
import { runFieldwork } from "./helpers.ts";

test("an unknown maintainer command prints usage and exits 2", () => {
  const { exitCode, output } = runFieldwork(["frobnicate"]);

  assert.match(output, /Unknown command: frobnicate/);
  assert.match(output, /Usage: npm run fieldwork -- <command>/);
  assert.equal(exitCode, 2);
});
