import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { farewellStep, greetSolved, greetStep, greetUnsolved, shoutStep } from "./fixture-steps.ts";
import { fakeGitHub, fakeGitHubEnv, makeProject, runCli } from "./helpers.ts";

const farewellSolved = `${greetSolved}
export function farewell(name = "everyone"): string {
  return \`Goodbye, \${name}!\`;
}
`;

test("progress creates a pinned Progress issue listing Completed Steps, the Current Step and locked Steps", () => {
  const dir = makeProject({ steps: [greetStep, farewellStep, shoutStep], learnerCode: { "src/greet.ts": greetSolved } });
  const github = fakeGitHub();

  const { exitCode, output } = runCli(dir, ["progress"], fakeGitHubEnv(github));

  assert.equal(exitCode, 0, output);
  const [issue, ...others] = github.issues();
  assert.equal(others.length, 0);
  assert.equal(issue?.title, "Progress");
  assert.equal(issue?.pinned, true);
  assert.match(issue!.body, /1 of 3 Steps completed/);
  assert.match(issue!.body, /✅ Step 1: Greet someone/);
  assert.match(issue!.body, /Step 2: Say goodbye.*Current Step/);
  assert.match(issue!.body, /🔒 Step 3: Shout/);
  assert.match(output, /#1/);
});

test("several Steps completed by one merge are all recorded, updating the same Progress issue", () => {
  const dir = makeProject({ steps: [greetStep, farewellStep, shoutStep], learnerCode: { "src/greet.ts": greetUnsolved } });
  const github = fakeGitHub();
  assert.equal(runCli(dir, ["progress"], fakeGitHubEnv(github)).exitCode, 0);
  assert.match(github.issues()[0]!.body, /0 of 3 Steps completed/);

  // One pull request finishes Steps 1 and 2, then merges.
  writeFileSync(join(dir, "src", "greet.ts"), farewellSolved);
  const { exitCode, output } = runCli(dir, ["progress"], { ...fakeGitHubEnv(github), GITHUB_SHA: "abc1234" });

  assert.equal(exitCode, 0, output);
  const [issue, ...others] = github.issues();
  assert.equal(others.length, 0);
  assert.match(issue!.body, /2 of 3 Steps completed/);
  assert.match(issue!.body, /✅ Step 1: Greet someone/);
  assert.match(issue!.body, /✅ Step 2: Say goodbye/);
  assert.match(issue!.body, /Step 3: Shout.*Current Step/);
  assert.match(issue!.body, /abc1234/);
});

test("progress finds its issue among others even after the Learner renames and unpins it", () => {
  const dir = makeProject({ steps: [greetStep], learnerCode: { "src/greet.ts": greetSolved } });
  const github = fakeGitHub();
  assert.equal(runCli(dir, ["progress"], fakeGitHubEnv(github)).exitCode, 0);
  const [progress] = github.issues();
  github.setIssues([
    { number: 1, title: "Progress", body: "Not ours", pinned: true },
    { ...progress!, number: 2, title: "My Fieldwork journey", pinned: false },
  ]);

  const { exitCode, output } = runCli(dir, ["progress"], fakeGitHubEnv(github));

  assert.equal(exitCode, 0, output);
  const issues = github.issues();
  assert.equal(issues.length, 2);
  assert.equal(issues[0]!.body, "Not ours");
  assert.equal(issues[1]!.pinned, true);
  assert.match(issues[1]!.body, /all 1 Steps completed/);
  assert.match(output, /#2/);
});

test("progress explains how to install gh when it is missing, and exits 2", () => {
  const dir = makeProject({ steps: [greetStep], learnerCode: { "src/greet.ts": greetSolved } });

  const { exitCode, output } = runCli(dir, ["progress"], { PATH: "" });

  assert.match(output, /GitHub CLI \(gh\) is not installed/);
  assert.equal(exitCode, 2);
});

test("progress still records Completed Steps when the issue cannot be pinned, and warns", () => {
  const dir = makeProject({ steps: [greetStep], learnerCode: { "src/greet.ts": greetSolved } });
  const github = fakeGitHub();
  github.setIssues([1, 2, 3].map((number) => ({ number, title: `Pinned ${number}`, body: "", pinned: true })));

  const { exitCode, output } = runCli(dir, ["progress"], fakeGitHubEnv(github));

  assert.equal(exitCode, 0, output);
  const progress = github.issues()[3];
  assert.match(progress!.body, /all 1 Steps completed/);
  assert.equal(progress!.pinned, false);
  assert.match(output, /Could not pin the Progress issue #4: A repository can pin at most 3 issues/);
});
