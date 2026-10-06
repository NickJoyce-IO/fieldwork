import assert from "node:assert/strict";
import { renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { farewellStep, greetSolved, greetStep, greetUnsolved } from "./fixture-steps.ts";
import { makeProject, startCli } from "./helpers.ts";

const watching = /Watching for changes/;

test("--watch reruns the Steps when Learner Code changes", async (t) => {
  const dir = makeProject({ steps: [greetStep], learnerCode: { "src/greet.ts": greetUnsolved } });
  const cli = startCli(dir, ["test", "--watch"]);
  t.after(() => cli.stop());

  assert.match(await cli.waitFor(watching), /✘ Step 1: Greet someone \(0\/1 tests passing\)/);

  writeFileSync(join(dir, "src", "greet.ts"), greetSolved);

  const rerun = await cli.waitFor(watching);
  assert.match(rerun, /✔ Step 1: Greet someone/);
  assert.match(rerun, /All 1 Steps passing/);
});

test("--watch with --step reruns only that Step when its tests change", async (t) => {
  const dir = makeProject({ steps: [greetStep, farewellStep], learnerCode: { "src/greet.ts": greetSolved } });
  const cli = startCli(dir, ["test", "--step", "1", "--watch"]);
  t.after(() => cli.stop());

  assert.match(await cli.waitFor(watching), /✔ Step 1: Greet someone/);

  writeFileSync(
    join(dir, "steps", greetStep.id, "greet.test.ts"),
    greetStep.files["greet.test.ts"].replace('"Hello, Ada!"', '"Hi, Ada!"'),
  );

  const rerun = await cli.waitFor(watching);
  assert.match(rerun, /✘ Step 1: Greet someone \(0\/1 tests passing\)/);
  assert.doesNotMatch(rerun, /Step 2/);
});

test("--watch keeps watching after a run fails to complete", async (t) => {
  const dir = makeProject({ steps: [greetStep], learnerCode: { "src/greet.ts": greetSolved } });
  const cli = startCli(dir, ["test", "--watch"]);
  t.after(() => cli.stop());
  await cli.waitFor(watching);

  // The Step's folder disappears mid-edit, so the run cannot read its tests.
  const stepFolder = join(dir, "steps", greetStep.id);
  renameSync(stepFolder, `${stepFolder}-moved`);
  assert.match(await cli.waitFor(watching), /Could not run the Steps: .*ENOENT/);

  renameSync(`${stepFolder}-moved`, stepFolder);
  assert.match(await cli.waitFor(watching), /✔ Step 1: Greet someone/);
});
