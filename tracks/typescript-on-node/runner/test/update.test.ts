import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import type { FakeGitHub } from "./fake-github.ts";
import { farewellStep, greetSolved, greetStep, greetUnsolved, shoutStep } from "./fixture-steps.ts";
import { fakeGitHub, fakeGitHubEnv, git, gitIdentityEnv, makeLearnerRepo, makeProject, runCli, type FixtureStep } from "./helpers.ts";

const greetWithHints: FixtureStep = { ...greetStep, files: { ...greetStep.files, "HINTS.md": "Try a template literal.\n" } };

/**
 * A Learner's repository at version 1.0.0, with Step 1 solved: `src/` is
 * their work, and the rest is Project Content and metadata as published.
 */
function installed(): { dir: string; origin: string } {
  return makeLearnerRepo({
    version: "1.0.0",
    steps: [greetWithHints],
    learnerCode: { "src/greet.ts": greetSolved },
    otherFiles: { ".fieldwork/cli.ts": "// runner 1.0.0\n", "README.md": "# fixture 1.0.0\n" },
  });
}

/** The template repository's files at `version`, starter code and all. */
function published(version: string, steps: FixtureStep[] = [greetStep, farewellStep]): string {
  return makeProject({
    version,
    steps,
    learnerCode: { "src/greet.ts": greetUnsolved, "src/farewell.ts": "export {};\n" },
    otherFiles: { ".fieldwork/cli.ts": `// runner ${version}\n`, "README.md": `# fixture ${version}\n` },
  });
}

function templateAt(version: string, steps?: FixtureStep[]): FakeGitHub {
  const github = fakeGitHub();
  github.setTemplate(published(version, steps));
  return github;
}

function update(dir: string, github: FakeGitHub, args: string[] = []) {
  return runCli(dir, ["update", ...args], { ...fakeGitHubEnv(github), ...gitIdentityEnv });
}

/** The files on a branch of the bare `origin` repository standing in for GitHub. */
function filesOn(origin: string, branch: string): string[] {
  return git(origin, ["ls-tree", "-r", "--name-only", branch]).trim().split("\n");
}

function fileOn(origin: string, branch: string, path: string): string {
  return git(origin, ["show", `${branch}:${path}`]);
}

function branchesOf(origin: string): string[] {
  return git(origin, ["branch", "--format=%(refname:short)"]).trim().split("\n");
}

test("update brings a newer version's Project Content and metadata in on a new branch, as a pull request", () => {
  const { dir, origin } = installed();
  const github = templateAt("1.1.0");

  const { exitCode, output } = update(dir, github);

  assert.equal(exitCode, 0, output);
  const branch = "fieldwork/update-1.1.0";
  assert.equal(JSON.parse(fileOn(origin, branch, "fieldwork.json")).version, "1.1.0");
  assert.ok(filesOn(origin, branch).includes("steps/02-farewell/farewell.test.ts"));
  assert.ok(!filesOn(origin, branch).includes("steps/01-greet/HINTS.md"), "files the newer version dropped are removed");
  assert.equal(fileOn(origin, branch, ".fieldwork/cli.ts"), "// runner 1.1.0\n");
  assert.equal(fileOn(origin, branch, "README.md"), "# fixture 1.1.0\n");

  const [pullRequest, ...others] = github.pullRequests();
  assert.equal(others.length, 0);
  assert.equal(pullRequest?.head, branch);
  assert.equal(pullRequest?.base, "main");
  assert.match(pullRequest!.title, /1\.1\.0/);
  assert.match(pullRequest!.body, /from 1\.0\.0 to 1\.1\.0/);
  assert.match(pullRequest!.body, /Steps added:\n- Step 2: Say goodbye/);
  assert.match(pullRequest!.body, /Steps changed:\n- Step 1: Greet someone/);
  assert.match(output, /https:\/\/github\.com\/learner\/project\/pull\/1/);
});

test("update never modifies Learner Code, even when the newer version's starter code differs", () => {
  const { dir, origin } = installed();
  writeFileSync(join(dir, "NOTES.md"), "My notes\n");
  git(dir, ["add", "NOTES.md"]);
  git(dir, ["commit", "--quiet", "--message", "Notes"]);
  git(dir, ["push", "--quiet", "origin", "main"]);

  const { exitCode, output } = update(dir, templateAt("1.1.0"));

  assert.equal(exitCode, 0, output);
  const branch = "fieldwork/update-1.1.0";
  assert.equal(fileOn(origin, branch, "src/greet.ts"), greetSolved);
  assert.deepEqual(
    filesOn(origin, branch).filter((path) => path.startsWith("src/")),
    ["src/greet.ts"],
    "no starter code is added to src/",
  );
  assert.equal(fileOn(origin, branch, "NOTES.md"), "My notes\n", "the Learner's own files elsewhere are kept");
});

test("update starts from main on GitHub, leaving the Learner's checkout, unmerged commits and unsaved work alone", () => {
  const { dir, origin } = installed();
  git(dir, ["switch", "--quiet", "--create", "step-2"]);
  writeFileSync(join(dir, "src", "greet.ts"), `${greetSolved}// committed on step-2\n`);
  git(dir, ["commit", "--quiet", "--all", "--message", "Work on Step 2"]);
  writeFileSync(join(dir, "src", "greet.ts"), `${greetSolved}// not committed yet\n`);

  const { exitCode, output } = update(dir, templateAt("1.1.0"));

  assert.equal(exitCode, 0, output);
  const branch = "fieldwork/update-1.1.0";
  assert.equal(git(origin, ["rev-parse", `${branch}^`]), git(origin, ["rev-parse", "main"]));
  assert.equal(git(dir, ["branch", "--show-current"]).trim(), "step-2");
  assert.equal(readFileSync(join(dir, "src", "greet.ts"), "utf8"), `${greetSolved}// not committed yet\n`);
  assert.equal(JSON.parse(readFileSync(join(dir, "fieldwork.json"), "utf8")).version, "1.0.0");
});

for (const latest of ["1.0.0", "0.9.0"]) {
  test(`update reports the Project up to date, and exits 0, when the latest published version is ${latest}`, () => {
    const { dir, origin } = installed();
    const github = templateAt(latest, [greetWithHints]);

    const { exitCode, output } = update(dir, github);

    assert.equal(exitCode, 0, output);
    assert.match(output, /fixture is up to date at version 1\.0\.0/);
    assert.deepEqual(github.pullRequests(), []);
    assert.deepEqual(branchesOf(origin), ["main"]);
  });
}

test("update does not take a major version without --major, and says what it contains", () => {
  const { dir, origin } = installed();
  const github = templateAt("2.0.0", [greetStep, shoutStep]);

  const { exitCode, output } = update(dir, github);

  assert.equal(exitCode, 0, output);
  assert.match(output, /2\.0\.0 is a major update/);
  assert.match(output, /from 1\.0\.0 to 2\.0\.0/);
  assert.match(output, /Steps added:\n- Step 2: Shout/);
  assert.match(output, /Steps changed:\n- Step 1: Greet someone/);
  assert.match(output, /npm run update -- --major/);
  assert.deepEqual(github.pullRequests(), []);
  assert.deepEqual(branchesOf(origin), ["main"]);
});

test("update --major takes a major version, marking its pull request as major and listing removed Steps", () => {
  const { dir, origin } = installed();
  const github = templateAt("2.0.0", [shoutStep]);

  const { exitCode, output } = update(dir, github, ["--major"]);

  assert.equal(exitCode, 0, output);
  assert.ok(filesOn(origin, "fieldwork/update-2.0.0").includes("steps/03-shout/shout.test.ts"));
  assert.ok(!filesOn(origin, "fieldwork/update-2.0.0").some((path) => path.startsWith("steps/01-greet/")));
  const [pullRequest] = github.pullRequests();
  assert.match(pullRequest!.title, /major/i);
  assert.match(pullRequest!.body, /Steps removed:\n- Step 1: Greet someone/);
});

test("update does not make the same update twice while its branch is waiting to be merged", () => {
  const { dir } = installed();
  const github = templateAt("1.1.0");
  assert.equal(update(dir, github).exitCode, 0);

  const { exitCode, output } = update(dir, github);

  assert.equal(exitCode, 0, output);
  assert.match(output, /already waiting on the branch fieldwork\/update-1\.1\.0/);
  assert.equal(github.pullRequests().length, 1);
});

test("update explains why it cannot work in a repository not created from a template, and exits 2", () => {
  const { dir } = installed();

  const { exitCode, output } = update(dir, fakeGitHub());

  assert.match(output, /Use this template/);
  assert.equal(exitCode, 2);
});

test("update with an unknown option prints its usage and exits 2", () => {
  const { dir } = installed();

  const { exitCode, output } = update(dir, templateAt("1.1.0"), ["--minor"]);

  assert.match(output, /Usage: fieldwork update \[--major\]/);
  assert.equal(exitCode, 2);
});
