import assert from "node:assert/strict";
import { test } from "node:test";
import { farewellStep, greetStep, greetUnsolved, shoutStep } from "./fixture-steps.ts";
import { makeProject, runTest } from "./helpers.ts";

// Step 2 solved while Step 1 is still unsolved.
const onlyFarewellSolved = `${greetUnsolved}
export function farewell(name = "everyone"): string {
  return \`Goodbye, \${name}!\`;
}
`;

test("--step runs only that Step, even when an earlier Step is failing", () => {
  const dir = makeProject({
    steps: [greetStep, farewellStep, shoutStep],
    learnerCode: { "src/greet.ts": onlyFarewellSolved },
  });

  const { exitCode, output } = runTest(dir, {}, ["--step", "2"]);

  assert.match(output, /✔ Step 2: Say goodbye/);
  assert.doesNotMatch(output, /Step 1/);
  assert.doesNotMatch(output, /Step 3/);
  assert.equal(exitCode, 0);
});

test("--step reports a failing Step with its own type errors only, and exits 1", () => {
  // Steps 2 and 3 import functions the Learner has not written yet.
  const dir = makeProject({
    steps: [greetStep, farewellStep, shoutStep],
    learnerCode: { "src/greet.ts": greetUnsolved },
  });

  const { exitCode, output } = runTest(dir, {}, ["--step", "3"]);

  assert.match(output, /✘ Step 3: Shout \(tests failed to load, 1 type error\)/);
  assert.match(output, /steps\/03-shout\/shout\.test\.ts/);
  assert.doesNotMatch(output, /steps\/02-farewell/);
  assert.equal(exitCode, 1);
});

test("--step with a Step number the Project does not have prints a clear error and exits 2", () => {
  const dir = makeProject({ steps: [greetStep, farewellStep], learnerCode: { "src/greet.ts": onlyFarewellSolved } });

  for (const value of ["3", "0", "-1", "1.5", "two", ""]) {
    const { exitCode, output } = runTest(dir, {}, [`--step=${value}`]);

    assert.match(output, new RegExp(`Invalid Step number "${value}": this Project has Steps 1 to 2`), value);
    assert.doesNotMatch(output, /Step \d+:/, value);
    assert.equal(exitCode, 2, value);
  }
});

test("--step without a number prints a clear error and exits 2", () => {
  const dir = makeProject({ steps: [greetStep], learnerCode: { "src/greet.ts": onlyFarewellSolved } });

  const { exitCode, output } = runTest(dir, {}, ["--step"]);

  assert.match(output, /--step/);
  assert.match(output, /Usage: fieldwork test \[--step N\] \[--watch\]/);
  assert.equal(exitCode, 2);
});
