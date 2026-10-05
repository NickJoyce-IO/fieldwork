import { loadProject, stepDir } from "./project.ts";
import { describeStepTests, runStepTests, stepTestsPass } from "./run-step-tests.ts";
import { typeCheck, typeErrorsForStep, type TypeDiagnostic } from "./type-check.ts";

// node:test marks its child processes with NODE_TEST_CONTEXT, and run() skips
// every file when it sees it. The CLI is always a top-level run of a Project's
// Steps, even when launched from inside a test (e.g. by `verify`).
delete process.env.NODE_TEST_CONTEXT;

const project = loadProject(process.cwd());
const allTypeErrors = typeCheck(project);
const lines: string[] = [];
let currentStep: { index: number; typeErrors: TypeDiagnostic[] } | undefined;

for (const [index, step] of project.steps.entries()) {
  const label = `Step ${index + 1}: ${step.title}`;
  if (currentStep !== undefined) {
    lines.push(`🔒 ${label}`);
    continue;
  }
  const results = await runStepTests(stepDir(project, step));
  const typeErrors = typeErrorsForStep(allTypeErrors, step);
  if (stepTestsPass(results) && typeErrors.length === 0) {
    lines.push(`✔ ${label}`);
    continue;
  }
  const details = [describeStepTests(results)];
  if (typeErrors.length > 0) details.push(`${typeErrors.length} type error${typeErrors.length === 1 ? "" : "s"}`);
  lines.push(`✘ ${label} (${details.filter(Boolean).join(", ")})`);
  currentStep = { index, typeErrors };
}

if (currentStep === undefined) {
  lines.push("", `All ${project.steps.length} Steps passing`);
} else if (currentStep.typeErrors.length > 0) {
  lines.push("", "Type errors:", ...currentStep.typeErrors.map(({ text }) => `  ${text}`));
}
console.log(lines.join("\n"));
process.exitCode = currentStep === undefined ? 0 : 1;
