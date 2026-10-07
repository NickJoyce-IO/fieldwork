import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { lastPublished, majorVersion } from "./published.ts";
import { trackRunner, type TrackRunner } from "./tracks.ts";

interface StepDefinition {
  id: string;
  title: string;
}

interface ProjectMetadata {
  name: string;
  version: string;
  track: string;
  steps: StepDefinition[];
}

export interface Verdict {
  project: string;
  /** Each rule the Project breaks, naming the Step; empty when the Project is sound. */
  problems: string[];
}

/**
 * Checks a Project's Steps against its starter code and Reference Solutions
 * (docs/project-layout.md): the starter passes no Step, and the solution for
 * Step N passes Steps 1..N and not Step N+1.
 */
export function verifyProject(projectDir: string): Verdict {
  const metadata = JSON.parse(readFileSync(join(projectDir, "fieldwork.json"), "utf8")) as ProjectMetadata;
  const runSteps = trackRunner(metadata.track);
  if (runSteps === undefined) {
    return { project: metadata.name, problems: [`unknown Track "${metadata.track}" in fieldwork.json`] };
  }

  const steps = metadata.steps;
  const label = (index: number) => `Step ${index + 1} "${steps[index]!.title}"`;
  const problems: string[] = [];
  const workDir = makeWorkingCopy(projectDir);
  try {
    // The Track's test stops at the first failing Step, so each Step is
    // checked against the starter code on its own.
    for (const [index, step] of steps.entries()) {
      writeMetadata(workDir, { ...metadata, steps: [step] });
      if (runSteps(workDir).passedSteps > 0) {
        problems.push(`${label(index)}: the starter code passes it, but starter code must not pass any Step`);
      }
    }
    writeMetadata(workDir, metadata);

    for (const [index, step] of steps.entries()) {
      const solutionDir = join(projectDir, "solutions", step.id);
      if (!existsSync(solutionDir)) {
        problems.push(`${label(index)}: no Reference Solution at solutions/${step.id}/`);
        continue;
      }
      applySolution(workDir, solutionDir);
      const run = runSteps(workDir);
      if (run.passedSteps <= index) {
        problems.push(
          `${label(index)}: its Reference Solution must pass Steps 1..${index + 1}, but fails ${label(run.passedSteps)}\n${indent(run.output)}`,
        );
      } else if (run.passedSteps > index + 1) {
        problems.push(
          `${label(index)}: its Reference Solution also passes ${label(index + 1)}, but must not pass the next Step`,
        );
      }
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
  problems.push(...publishedStepProblems(projectDir, metadata, runSteps, label));
  return { project: metadata.name, problems };
}

/**
 * The Project Update promise: within a major version, published Steps never get
 * stricter. So each published Step's published Reference Solution must still
 * pass Steps 1..N as they stand now, or a Learner who completed them would see
 * them fail after updating.
 */
function publishedStepProblems(
  projectDir: string,
  metadata: ProjectMetadata,
  runSteps: TrackRunner,
  label: (index: number) => string,
): string[] {
  const published = lastPublished(projectDir, metadata.name);
  if (published === undefined || majorVersion(metadata.version) !== majorVersion(published.version)) return [];

  const problems: string[] = [];
  const workDir = makeWorkingCopy(projectDir);
  try {
    const solutionsDir = join(workDir, ".published-solutions");
    published.extractSolutions(solutionsDir);
    for (const [index, step] of published.steps.entries()) {
      // A Learner's Completed Steps are counted in order, so a published Step
      // must stay where it was.
      if (metadata.steps[index]?.id !== step.id) {
        problems.push(
          `Step ${index + 1} "${step.title}" from ${published.tag} is no longer Step ${index + 1}, so Learners who completed it would lose it after a ${metadata.version} update. Within a major version published Steps must not be removed or reordered: bump the major version, or put the Step back`,
        );
        break;
      }
      applySolution(workDir, join(solutionsDir, step.id));
      const run = runSteps(workDir);
      if (run.passedSteps <= index) {
        problems.push(
          `${label(index)}: its tests now fail its Reference Solution from ${published.tag}, so Learners who completed it would fail it after a ${metadata.version} update. Within a major version published Steps must not get stricter: bump the major version, or loosen the tests\n${indent(run.output)}`,
        );
      }
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
  return problems;
}

/**
 * Copies the Project without its Reference Solutions into its own .tmp folder,
 * so the Project's dependencies (and the monorepo's) still resolve from there.
 */
function makeWorkingCopy(projectDir: string): string {
  const tmpRoot = join(projectDir, ".tmp");
  mkdirSync(tmpRoot, { recursive: true });
  const workDir = mkdtempSync(join(tmpRoot, "verify-"));
  for (const entry of readdirSync(projectDir)) {
    if (entry === "solutions" || entry === ".tmp" || entry === "node_modules") continue;
    cpSync(join(projectDir, entry), join(workDir, entry), { recursive: true });
  }
  return workDir;
}

/** Rewrites the working copy's fieldwork.json, e.g. to list a single Step. */
function writeMetadata(workDir: string, metadata: ProjectMetadata): void {
  writeFileSync(join(workDir, "fieldwork.json"), JSON.stringify(metadata, null, 2));
}

/** A Reference Solution is a snapshot: each top-level path in it replaces the same path in the Project. */
function applySolution(workDir: string, solutionDir: string): void {
  for (const entry of readdirSync(solutionDir)) {
    rmSync(join(workDir, entry), { recursive: true, force: true });
    cpSync(join(solutionDir, entry), join(workDir, entry), { recursive: true });
  }
}

function indent(output: string): string {
  return output
    .trimEnd()
    .split(/\r?\n/)
    .map((line) => `    ${line}`)
    .join("\n");
}
