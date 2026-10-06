import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { trackRunner } from "./tracks.ts";

interface StepDefinition {
  id: string;
  title: string;
}

interface ProjectMetadata {
  name: string;
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
  return { project: metadata.name, problems };
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
