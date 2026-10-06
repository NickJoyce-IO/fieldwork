import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const runnerDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(runnerDir, "src", "cli.ts");

export interface FixtureStep {
  id: string;
  title: string;
  /** Files inside the Step's folder, keyed by file name. */
  files: Record<string, string>;
}

export interface FixtureProject {
  steps: FixtureStep[];
  /** Learner Code, keyed by path relative to the Project root. */
  learnerCode: Record<string, string>;
}

export const fixturesDir = join(runnerDir, "..", "fixtures");

/** Generated Projects use the same tsconfig as the committed hello-steps fixture. */
const tsconfig = readFileSync(join(fixturesDir, "hello-steps", "tsconfig.json"), "utf8");

/**
 * Writes a Project to a fresh directory inside the runner package, so that
 * `typescript` and `@types/node` resolve from the monorepo's node_modules
 * the same way they resolve from a Learner's own node_modules.
 */
export function makeProject(project: FixtureProject): string {
  const tmpRoot = join(runnerDir, ".tmp");
  mkdirSync(tmpRoot, { recursive: true });
  const dir = mkdtempSync(join(tmpRoot, "project-"));

  const write = (path: string, content: string) => {
    const full = join(dir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  };

  write(
    "fieldwork.json",
    JSON.stringify(
      {
        name: "fixture",
        version: "1.0.0",
        track: "typescript-on-node",
        steps: project.steps.map(({ id, title }) => ({ id, title })),
      },
      null,
      2,
    ),
  );
  write("tsconfig.json", tsconfig);
  write("package.json", JSON.stringify({ type: "module", private: true }, null, 2));
  for (const [path, content] of Object.entries(project.learnerCode)) write(path, content);
  for (const step of project.steps) {
    for (const [name, content] of Object.entries(step.files)) write(join("steps", step.id, name), content);
  }
  return dir;
}

export interface RunResult {
  exitCode: number | null;
  output: string;
}

/**
 * Runs the CLI's `test` command in a Project. These tests themselves run under
 * node:test, so the child inherits NODE_TEST_CONTEXT unless a test overrides it.
 */
export function runTest(projectDir: string, env: NodeJS.ProcessEnv = {}): RunResult {
  return runCli(projectDir, ["test"], env);
}

/** Runs the runner CLI with arbitrary arguments in a directory. */
export function runCli(cwd: string, args: string[], env: NodeJS.ProcessEnv = {}): RunResult {
  return run(process.execPath, [cliPath, ...args], cwd, env);
}

/** Runs `npm test` in a Project, the way a Learner does. */
export function runNpmTest(projectDir: string): RunResult {
  return run(process.platform === "win32" ? "npm.cmd" : "npm", ["test", "--silent"], projectDir);
}

function run(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}): RunResult {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env, NO_COLOR: "1" },
    shell: process.platform === "win32",
  });
  return { exitCode: result.status, output: result.stdout + result.stderr };
}
