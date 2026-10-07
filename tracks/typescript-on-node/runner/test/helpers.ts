import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FakeGitHub } from "./fake-github.ts";

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

/** A fresh, empty fake GitHub repository (see fake-github.ts). */
export function fakeGitHub(): FakeGitHub {
  const tmpRoot = join(runnerDir, ".tmp");
  mkdirSync(tmpRoot, { recursive: true });
  return new FakeGitHub(join(mkdtempSync(join(tmpRoot, "github-")), "issues.json"));
}

/** Environment that makes the CLI use `github` instead of real GitHub. */
export function fakeGitHubEnv(github: FakeGitHub): NodeJS.ProcessEnv {
  return {
    FIELDWORK_GITHUB_ADAPTER: join(runnerDir, "test", "fake-github.ts"),
    FIELDWORK_FAKE_GITHUB_STATE: github.statePath,
  };
}

export interface RunResult {
  exitCode: number | null;
  output: string;
}

/**
 * Runs the CLI's `test` command in a Project. These tests themselves run under
 * node:test, so the child inherits NODE_TEST_CONTEXT unless a test overrides it.
 */
export function runTest(projectDir: string, env: NodeJS.ProcessEnv = {}, args: string[] = []): RunResult {
  return runCli(projectDir, ["test", ...args], env);
}

/** Runs the runner CLI with arbitrary arguments in a directory. */
export function runCli(cwd: string, args: string[], env: NodeJS.ProcessEnv = {}): RunResult {
  return run(process.execPath, [cliPath, ...args], cwd, env);
}

export interface RunningCli {
  /**
   * Resolves with the output printed since the previous wait once it matches
   * `pattern`; rejects if the process exits or `timeoutMs` passes first.
   */
  waitFor(pattern: RegExp, timeoutMs?: number): Promise<string>;
  stop(): Promise<void>;
}

/** Starts the runner CLI without waiting for it to exit, e.g. in watch mode. */
export function startCli(cwd: string, args: string[]): RunningCli {
  const child = spawn(process.execPath, [cliPath, ...args], {
    cwd,
    env: { ...process.env, NO_COLOR: "1" },
  });
  let output = "";
  let consumed = 0;
  let exited = false;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  child.stdout.setEncoding("utf8").on("data", (chunk: string) => ((output += chunk), notify()));
  child.stderr.setEncoding("utf8").on("data", (chunk: string) => ((output += chunk), notify()));
  const closed = new Promise<void>((resolve) => child.on("close", () => ((exited = true), notify(), resolve())));

  return {
    waitFor(pattern, timeoutMs = 15_000) {
      return new Promise((resolve, reject) => {
        const check = () => {
          const fresh = output.slice(consumed);
          if (pattern.test(fresh)) {
            done();
            consumed = output.length;
            resolve(fresh);
          } else if (exited) {
            done();
            reject(new Error(`CLI exited before printing ${pattern}. Output:\n${output}`));
          }
        };
        const timer = setTimeout(() => {
          done();
          reject(new Error(`Timed out waiting for ${pattern}. Output:\n${output}`));
        }, timeoutMs);
        const done = () => (clearTimeout(timer), listeners.delete(check));
        listeners.add(check);
        check();
      });
    },
    async stop() {
      if (!exited) child.kill();
      await closed;
    },
  };
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
