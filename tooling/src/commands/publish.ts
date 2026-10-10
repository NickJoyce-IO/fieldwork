import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const monorepoDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/** Where the Track's Learner-side commands live in a published Project. */
const publishedRunnerDir = ".fieldwork";

interface ProjectMetadata {
  name: string;
  version: string;
  track: string;
  steps: { id: string; title: string; check?: string }[];
}

/**
 * Writes a template repository's file tree for a source Project. Only
 * allow-listed parts of the source are copied, so Reference Solutions
 * (solutions/) can never leak into the output.
 */
export async function publishCommand(args: string[]): Promise<number> {
  const options = parseArgs(args);
  if (options === undefined) {
    console.error("Usage: npm run fieldwork -- publish <project-dir> --out <dir>");
    return 2;
  }
  const { projectDir, outDir } = options;
  if (existsSync(outDir) && readdirSync(outDir).length > 0) {
    console.error(`Output directory is not empty: ${outDir}`);
    return 1;
  }
  mkdirSync(outDir, { recursive: true });

  const metadata = readJson(join(projectDir, "fieldwork.json")) as unknown as ProjectMetadata;

  // Learner Code (from the starter code), Project Content and metadata.
  for (const path of ["src", "steps", "fieldwork.json", "tsconfig.json"]) {
    cpSync(join(projectDir, path), join(outDir, path), { recursive: true });
  }
  // The Track's Learner-side commands (ADR-0002), and its static files: the PR
  // workflow, the devcontainer and so on.
  const trackDir = join(monorepoDir, "tracks", metadata.track);
  cpSync(join(trackDir, "runner", "src"), join(outDir, publishedRunnerDir), { recursive: true });
  cpSync(join(trackDir, "template"), outDir, { recursive: true });

  // Learners get the Node and npm versions the monorepo is built and graded with.
  const monorepoPackage = readJson(join(monorepoDir, "package.json"));
  const packageJson = readJson(join(projectDir, "package.json"));
  packageJson.scripts = {
    ...(packageJson.scripts as object),
    test: `node ${publishedRunnerDir}/cli.ts test`,
    setup: `node ${publishedRunnerDir}/cli.ts setup`,
    update: `node ${publishedRunnerDir}/cli.ts update`,
  };
  packageJson.packageManager = monorepoPackage.packageManager;
  packageJson.engines = monorepoPackage.engines;
  // The source Project's description is written for maintainers, not Learners.
  delete packageJson.description;
  writeJson(join(outDir, "package.json"), packageJson);
  writeLockfile(outDir);
  cpSync(join(monorepoDir, ".nvmrc"), join(outDir, ".nvmrc"));
  writeFileSync(join(outDir, "README.md"), projectReadme(metadata));

  console.log(`Published ${metadata.name} ${metadata.version} to ${outDir}`);
  return 0;
}

/**
 * For a Project without Step 0: the Learner protected main by hand in their
 * Track's first Project, so `setup` does it for them here.
 */
const protectMainSection = `
## Protect main

Before your first pull request, protect \`main\` as you did in the first Project of this Track: changes reach it only through a pull request, once the Fieldwork check has run. One command does it. It needs the GitHub CLI (https://cli.github.com), logged in with \`gh auth login\`:

\`\`\`sh
npm run setup
\`\`\`

It adds a ruleset to this repository that requires a pull request and the "Fieldwork Steps" check before anything reaches \`main\`. Running it again is safe. If it cannot reach GitHub or change the repository's settings, it tells you what to fix.
`;

function projectReadme({ name, version, steps }: ProjectMetadata): string {
  return `# ${name}

Version ${version}. Work through the Steps below in order: each one is a small set of failing tests you make pass.

## Getting started

You need Node 24 and npm (see \`.nvmrc\`). If your local setup gives you trouble, open this repository in its devcontainer instead.

\`\`\`sh
npm install
npm test
\`\`\`

\`npm test\` runs the Steps in order and stops at the first one that fails: your Current Step. Steps after it are locked until it passes, but you can read their instructions and tests whenever you like.
${steps.some(({ check }) => check === "main-ruleset") ? "" : protectMainSection}
## Steps

${steps.map(({ id, title }, index) => `${index + 1}. [Step ${index + 1}: ${title}](steps/${id}/README.md)`).join("\n")}

## Where things live

- \`src/\`: your code. This is the only place you edit.
- \`steps/<step>/\`: each Step's instructions, Hints and tests.
- \`fieldwork.json\`: this Project's version and its list of Steps.
- \`.fieldwork/\`: the commands behind \`npm test\`.

## Workflow

For each Step (or a few at once), work on a branch, open a pull request against \`main\` in this repository, and merge it once its check passes. The check's summary shows which Steps the pull request passes. After each merge, the pinned Progress issue is updated with your Completed Steps.

## Updates

This Project gets fixes and new Steps over time. To check for a newer version (this needs the GitHub CLI, logged in with \`gh auth login\`):

\`\`\`sh
npm run update
\`\`\`

If there is one, it opens a pull request in this repository that brings it in, listing the Steps it adds, changes and removes. Review it and merge it like any other. It never changes your code in \`src/\`, and Steps you have completed still pass afterwards.

A major update may change Steps you have completed, so it is only made when you ask for it: \`npm run update\` tells you what it contains, and \`npm run update -- --major\` takes it.
`;
}

/**
 * Writes the published Project's package-lock.json, so a Learner's first
 * `npm install` doesn't add one to their first PR and CI grades with the
 * versions they tested with. npm trims a copy of the monorepo's lockfile down
 * to the Project's dependencies, keeping the versions `verify` ran against.
 * It works offline, so a dependency the monorepo lacks fails here.
 */
function writeLockfile(outDir: string): void {
  cpSync(join(monorepoDir, "package-lock.json"), join(outDir, "package-lock.json"));
  const result = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["install", "--package-lock-only", "--offline", "--ignore-scripts", "--no-audit", "--no-fund"],
    { cwd: outDir, encoding: "utf8", shell: process.platform === "win32" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `Could not write package-lock.json. A Project's dependencies must be in the monorepo's package-lock.json, at versions that fit:\n${result.stdout}${result.stderr}`,
    );
  }
}

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function parseArgs(args: string[]): { projectDir: string; outDir: string } | undefined {
  const outFlag = args.indexOf("--out");
  const outDir = outFlag === -1 ? undefined : args[outFlag + 1];
  const positional = args.filter((_, index) => index !== outFlag && index !== outFlag + 1);
  if (outDir === undefined || positional.length !== 1) return undefined;
  return { projectDir: resolve(positional[0]!), outDir: resolve(outDir) };
}
