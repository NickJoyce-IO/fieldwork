import assert from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { fixturesDir, makeProject, runNpmTest, runTest } from "./helpers.ts";

test("npm test in the hello-steps fixture Project shows Step 1 as current", () => {
  const { exitCode, output } = runNpmTest(join(fixturesDir, "hello-steps"));

  assert.match(output, /✘ Step 1: Greet someone \(0\/1 tests passing\)/);
  assert.match(output, /🔒 Step 2: Say goodbye/);
  assert.equal(exitCode, 1);
});

const greetSolved = `export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
`;

const greetStep = {
  id: "01-greet",
  title: "Greet someone",
  files: {
    "greet.test.ts": `import assert from "node:assert/strict";
import { test } from "node:test";
import { greet } from "../../src/greet.ts";

test("greets by name", () => {
  assert.equal(greet("Ada"), "Hello, Ada!");
});
`,
  },
};

const farewellStep = {
  id: "02-farewell",
  title: "Say goodbye",
  files: {
    "farewell.test.ts": `import assert from "node:assert/strict";
import { test } from "node:test";
import { farewell } from "../../src/greet.ts";

test("says goodbye by name", () => {
  assert.equal(farewell("Ada"), "Goodbye, Ada!");
});

test("says goodbye to everyone when no name is given", () => {
  assert.equal(farewell(), "Goodbye, everyone!");
});
`,
  },
};

const shoutStep = {
  id: "03-shout",
  title: "Shout",
  files: {
    "shout.test.ts": `import assert from "node:assert/strict";
import { test } from "node:test";
import { shout } from "../../src/greet.ts";

test("shouts", () => {
  assert.equal(shout("hi"), "HI!");
});
`,
  },
};

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

const pairStep = {
  id: "01-pair",
  title: "Type a pair",
  files: {
    "pair.test.ts": `import type { Pair } from "../../src/pair.ts";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

export type Cases = [Expect<Equal<Pair<number>, [number, number]>>];
`,
  },
};

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
