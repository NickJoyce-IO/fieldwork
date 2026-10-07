import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const toolingDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(toolingDir, "src", "cli.ts");
const helloSteps = join(toolingDir, "..", "tracks", "typescript-on-node", "fixtures", "hello-steps");

/**
 * A fresh, empty output directory inside the tooling package, so a published
 * Project resolves `typescript` from the monorepo's node_modules the same way
 * it would from a Learner's own after `npm install`.
 */
function freshOutDir(): string {
  const tmpRoot = join(toolingDir, ".tmp");
  mkdirSync(tmpRoot, { recursive: true });
  return mkdtempSync(join(tmpRoot, "published-"));
}

function run(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
    shell: process.platform === "win32",
  });
  return { exitCode: result.status, output: result.stdout + result.stderr };
}

function publish(projectDir: string, outDir: string) {
  return run(process.execPath, [cliPath, "publish", projectDir, "--out", outDir], toolingDir);
}

test("npm test in a published Project works and reports Step 1 as current", () => {
  const outDir = freshOutDir();
  assert.equal(publish(helloSteps, outDir).exitCode, 0);

  const { exitCode, output } = run(process.platform === "win32" ? "npm.cmd" : "npm", ["test", "--silent"], outDir);

  assert.match(output, /✘ Step 1: Greet someone \(0\/1 tests passing\)/);
  assert.match(output, /🔒 Step 2: Say goodbye/);
  assert.equal(exitCode, 1);
});

function readJson(path: string): Record<string, any> {
  return JSON.parse(readFileSync(path, "utf8"));
}

test("a published Project holds starter code as Learner Code, Project Content and versioned metadata, but no Reference Solutions", () => {
  const outDir = freshOutDir();
  assert.equal(publish(helloSteps, outDir).exitCode, 0);

  assert.equal(
    readFileSync(join(outDir, "src", "greet.ts"), "utf8"),
    readFileSync(join(helloSteps, "src", "greet.ts"), "utf8"),
  );
  for (const step of ["01-greet", "02-farewell"]) {
    assert.deepEqual(readdirSync(join(outDir, "steps", step)).sort(), readdirSync(join(helloSteps, "steps", step)).sort());
  }
  assert.deepEqual(readJson(join(outDir, "fieldwork.json")), readJson(join(helloSteps, "fieldwork.json")));
  assert.equal(readJson(join(outDir, "fieldwork.json")).version, "0.1.0");

  assert.equal(existsSync(join(outDir, "solutions")), false);
  for (const file of readdirSync(outDir, { recursive: true, encoding: "utf8" })) assert.doesNotMatch(file, /solutions/);
});

test("a published Project pins Node and npm, and ships a README and a devcontainer", () => {
  const outDir = freshOutDir();
  assert.equal(publish(helloSteps, outDir).exitCode, 0);

  const packageJson = readJson(join(outDir, "package.json"));
  assert.match(packageJson.packageManager, /^npm@\d+\.\d+\.\d+$/);
  assert.equal(packageJson.engines.node, ">=24");
  assert.equal(packageJson.description, undefined, "the source Project's description is for maintainers");
  assert.equal(readFileSync(join(outDir, ".nvmrc"), "utf8").trim(), "24");

  const readme = readFileSync(join(outDir, "README.md"), "utf8");
  assert.match(readme, /^# hello-steps/);
  assert.match(readme, /npm test/);
  assert.match(readme, /\[Step 1: Greet someone\]\(steps\/01-greet\/README\.md\)/);
  assert.match(readme, /\[Step 2: Say goodbye\]\(steps\/02-farewell\/README\.md\)/);

  const devcontainer = readJson(join(outDir, ".devcontainer", "devcontainer.json"));
  assert.match(devcontainer.image, /node:.*24/);
});

test("a published Project has a PR workflow that runs every Step and reports them in the check summary", () => {
  const outDir = freshOutDir();
  assert.equal(publish(helloSteps, outDir).exitCode, 0);

  const workflow = readFileSync(join(outDir, ".github", "workflows", "fieldwork.yml"), "utf8");
  assert.match(workflow, /pull_request/);
  assert.match(workflow, /node-version-file: \.nvmrc/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /GITHUB_STEP_SUMMARY/);
});

test("a published Project has a workflow that records progress after each merge to main without committing to it", () => {
  const outDir = freshOutDir();
  assert.equal(publish(helloSteps, outDir).exitCode, 0);

  const workflow = readFileSync(join(outDir, ".github", "workflows", "progress.yml"), "utf8");
  assert.match(workflow, /push:\n\s+branches: \[main\]/);
  assert.match(workflow, /node \.fieldwork\/cli\.ts progress/);
  // A read-only token cannot push to main; it only needs to write the Progress issue.
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /issues: write/);
  assert.doesNotMatch(workflow, /contents: write/);
});

test("publish refuses to write into a directory that already has files in it", () => {
  const outDir = freshOutDir();
  writeFileSync(join(outDir, "keep.txt"), "not mine\n");

  const { exitCode, output } = publish(helloSteps, outDir);

  assert.match(output, /not empty/);
  assert.equal(exitCode, 1);
  assert.deepEqual(readdirSync(outDir), ["keep.txt"]);
});

test("publish without a Project and an output directory prints its usage and exits 2", () => {
  const { exitCode, output } = run(process.execPath, [cliPath, "publish", helloSteps], toolingDir);

  assert.match(output, /Usage: npm run fieldwork -- publish <project-dir> --out <dir>/);
  assert.equal(exitCode, 2);
});

test("publish from a directory that is not a Project reports the error and exits 2", () => {
  const { exitCode, output } = publish(join(helloSteps, "steps"), freshOutDir());

  assert.match(output, /fieldwork\.json/);
  assert.equal(exitCode, 2);
});
