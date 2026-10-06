import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { brokenHelloSteps, helloSteps, runFieldwork } from "./helpers.ts";

test("the hello-steps fixture Project passes verify", () => {
  const { exitCode, output } = runFieldwork(["verify", helloSteps]);

  assert.match(output, /✔ hello-steps/);
  assert.equal(exitCode, 0);
});

const greetSolved = `export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
`;

test("fails when the starter code already passes a Step", () => {
  const project = brokenHelloSteps({ "src/greet.ts": greetSolved });

  const { exitCode, output } = runFieldwork(["verify", project]);

  assert.match(output, /✘ hello-steps/);
  assert.match(output, /hello-steps, Step 1 "Greet someone": the starter code passes it/);
  assert.equal(exitCode, 1);
});

const farewellSolved = `${greetSolved}
export function farewell(name?: string): string {
  return \`Goodbye, \${name ?? "everyone"}!\`;
}
`;

test("fails when a Step's Reference Solution also passes the next Step", () => {
  const project = brokenHelloSteps({ "solutions/01-greet/src/greet.ts": farewellSolved });

  const { exitCode, output } = runFieldwork(["verify", project]);

  assert.match(
    output,
    /hello-steps, Step 1 "Greet someone": its Reference Solution also passes Step 2 "Say goodbye"/,
  );
  assert.equal(exitCode, 1);
});

test("fails when a Step's Reference Solution does not pass every Step up to it", () => {
  // Step 2's solution forgets Step 1's work: it is not cumulative.
  const project = brokenHelloSteps({
    "solutions/02-farewell/src/greet.ts": farewellSolved.replace("Hello", "Hi"),
  });

  const { exitCode, output } = runFieldwork(["verify", project]);

  assert.match(
    output,
    /hello-steps, Step 2 "Say goodbye": its Reference Solution must pass Steps 1\.\.2, but fails Step 1 "Greet someone"/,
  );
  assert.match(output, /✘ Step 1: Greet someone \(0\/1 tests passing\)/);
  assert.equal(exitCode, 1);
});

test("fails when a Step has no Reference Solution", () => {
  const project = brokenHelloSteps({});
  rmSync(join(project, "solutions", "02-farewell"), { recursive: true });

  const { exitCode, output } = runFieldwork(["verify", project]);

  assert.match(output, /hello-steps, Step 2 "Say goodbye": no Reference Solution at solutions\/02-farewell\//);
  assert.equal(exitCode, 1);
});

test("verifies every Project given, reporting each", () => {
  const broken = brokenHelloSteps({ "src/greet.ts": greetSolved });

  const { exitCode, output } = runFieldwork(["verify", helloSteps, broken]);

  assert.match(output, /✔ hello-steps\n✘ hello-steps/);
  assert.equal(exitCode, 1);
});

test("fails clearly when a directory is not a Project", () => {
  const { exitCode, output } = runFieldwork(["verify", join(helloSteps, "steps")]);

  assert.match(output, /✘ .*steps: not a Project \(no fieldwork\.json\)/);
  assert.equal(exitCode, 1);
});

test("with no directories, verifies every Project in the monorepo", () => {
  const { exitCode, output } = runFieldwork(["verify"]);

  assert.doesNotMatch(output, /✘/);
  assert.doesNotMatch(output, /Usage/);
  assert.equal(exitCode, 0);
});

test("fails when the starter code passes a later Step, even though it fails Step 1", () => {
  const project = brokenHelloSteps({
    "src/greet.ts": `export function greet(name: string): string {
  throw new Error("Not implemented yet");
}

export function farewell(name?: string): string {
  return \`Goodbye, \${name ?? "everyone"}!\`;
}
`,
  });

  const { exitCode, output } = runFieldwork(["verify", project]);

  assert.match(output, /hello-steps, Step 2 "Say goodbye": the starter code passes it/);
  assert.doesNotMatch(output, /Step 1 "Greet someone": the starter code passes it/);
  assert.equal(exitCode, 1);
});
