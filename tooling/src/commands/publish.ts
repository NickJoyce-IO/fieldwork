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
  steps: { id: string; title: string }[];
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
  packageJson.scripts = { ...(packageJson.scripts as object), test: `node ${publishedRunnerDir}/cli.ts test` };
  packageJson.packageManager = monorepoPackage.packageManager;
  packageJson.engines = monorepoPackage.engines;
  // The source Project's description is written for maintainers, not Learners.
  delete packageJson.description;
  writeJson(join(outDir, "package.json"), packageJson);
  cpSync(join(monorepoDir, ".nvmrc"), join(outDir, ".nvmrc"));
  writeFileSync(join(outDir, "README.md"), projectReadme(metadata));

  console.log(`Published ${metadata.name} ${metadata.version} to ${outDir}`);
  return 0;
}

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

## Steps

${steps.map(({ id, title }, index) => `${index + 1}. [Step ${index + 1}: ${title}](steps/${id}/README.md)`).join("\n")}

## Where things live

- \`src/\`: your code. This is the only place you edit.
- \`steps/<step>/\`: each Step's instructions, Hints and tests.
- \`fieldwork.json\`: this Project's version and its list of Steps.
- \`.fieldwork/\`: the commands behind \`npm test\`.

## Workflow

For each Step (or a few at once), work on a branch, open a pull request against \`main\` in this repository, and merge it once its check passes. The check's summary shows which Steps the pull request passes. After each merge, the pinned Progress issue is updated with your Completed Steps.
`;
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
