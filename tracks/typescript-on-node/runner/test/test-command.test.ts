import assert from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { farewellStep, greetSolved, greetStep, pairStep, shoutStep } from "./fixture-steps.ts";
import { fixturesDir, makeProject, runNpmTest, runTest } from "./helpers.ts";

test("npm test in the hello-steps fixture Project shows Step 1 as current", () => {
  const { exitCode, output } = runNpmTest(join(fixturesDir, "hello-steps"));

  assert.match(output, /✘ Step 1: Greet someone \(0\/1 tests passing\)/);
  assert.match(output, /🔒 Step 2: Say goodbye/);
  assert.equal(exitCode, 1);
});

test("stops at the first failing Step, showing its test count and the locked Steps after it", () => {
  const dir = makeProject({
    steps: [greetStep, farewellStep, shoutStep],
    learnerCode: {
      "src/greet.ts": `${greetSolved}
export function farewell(name?: string): string {
  return \`Goodbye, \${name}!\`;
}

export function shout(text: string): string {
  return text;
}
`,
    },
  });

  const { exitCode, output } = runTest(dir);

  assert.match(output, /✔ Step 1: Greet someone/);
  assert.match(output, /✘ Step 2: Say goodbye \(1\/2 tests passing\)/);
  assert.match(output, /🔒 Step 3: Shout/);
  assert.doesNotMatch(output, /All \d+ Steps passing/);
  assert.notEqual(exitCode, 0);
});

test("a Step whose tests pass at runtime still fails when Learner Code has type errors", () => {
  const dir = makeProject({
    steps: [greetStep],
    learnerCode: {
      "src/greet.ts": `export function greet(name: string): string {
  const length: number = name;
  return \`Hello, \${name}!\`;
}
`,
    },
  });

  const { exitCode, output } = runTest(dir);

  assert.match(output, /✘ Step 1: Greet someone \(1\/1 tests passing, 1 type error\)/);
  assert.match(output, /src\/greet\.ts\(2,9\): error TS2322/);
  assert.notEqual(exitCode, 0);
});

test("type errors in later Steps' tests do not block or clutter the current Step", () => {
  // Steps 2 and 3 import functions the Learner has not written yet.
  const dir = makeProject({
    steps: [greetStep, farewellStep, shoutStep],
    learnerCode: { "src/greet.ts": greetSolved },
  });

  const { exitCode, output } = runTest(dir);

  assert.match(output, /✔ Step 1: Greet someone/);
  assert.match(output, /✘ Step 2: Say goodbye \(tests failed to load, 1 type error\)/);
  assert.match(output, /steps\/02-farewell\/farewell\.test\.ts/);
  assert.doesNotMatch(output, /steps\/03-shout/);
  assert.match(output, /🔒 Step 3: Shout/);
  assert.notEqual(exitCode, 0);
});

test("a type-only Step fails while its compile-time assertions fail", () => {
  const dir = makeProject({
    steps: [pairStep],
    learnerCode: { "src/pair.ts": "export type Pair<T> = T[];\n" },
  });

  const { exitCode, output } = runTest(dir);

  assert.match(output, /✘ Step 1: Type a pair \(1 type error\)/);
  assert.notEqual(exitCode, 0);
});

test("a type-only Step passes once its compile-time assertions hold", () => {
  const dir = makeProject({
    steps: [pairStep],
    learnerCode: { "src/pair.ts": "export type Pair<T> = [T, T];\n" },
  });

  const { exitCode, output } = runTest(dir);

  assert.match(output, /✔ Step 1: Type a pair/);
  assert.equal(exitCode, 0);
});

test("a Step with no test files fails rather than passing vacuously", () => {
  const dir = makeProject({
    steps: [{ id: "01-empty", title: "Nothing here", files: { "README.md": "# No tests yet\n" } }],
    learnerCode: { "src/index.ts": "export {};\n" },
  });

  const { exitCode, output } = runTest(dir);

  assert.match(output, /✘ Step 1: Nothing here \(no tests found\)/);
  assert.notEqual(exitCode, 0);
});

test("Step tests still run when the CLI is launched from inside another node:test run", () => {
  const dir = makeProject({
    steps: [farewellStep],
    learnerCode: {
      "src/greet.ts": "export function farewell(name?: string): string {\n  return `Goodbye, ${name}!`;\n}\n",
    },
  });

  const { exitCode, output } = runTest(dir, { NODE_TEST_CONTEXT: "child-v8" });

  assert.match(output, /✘ Step 1: Say goodbye \(1\/2 tests passing\)/);
  assert.notEqual(exitCode, 0);
});

test("a Project whose only Step passes reports it as passed and exits 0", () => {
  const dir = makeProject({ steps: [greetStep], learnerCode: { "src/greet.ts": greetSolved } });

  const { exitCode, output } = runTest(dir);

  assert.match(output, /✔ Step 1: Greet someone/);
  assert.match(output, /All 1 Steps passing/);
  assert.equal(exitCode, 0);
});
