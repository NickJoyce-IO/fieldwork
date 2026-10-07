// A fake GitHub adapter kept in a JSON file, so a test and the CLI process it
// spawns share one fake repository. The CLI loads it through
// FIELDWORK_GITHUB_ADAPTER (see fakeGitHubEnv in helpers.ts).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { GitHub, Issue } from "../src/github.ts";

export class FakeGitHub implements GitHub {
  readonly statePath: string;

  constructor(statePath: string) {
    this.statePath = statePath;
  }

  /** Every issue in the fake repository; they are all open. */
  issues(): Issue[] {
    return existsSync(this.statePath) ? (JSON.parse(readFileSync(this.statePath, "utf8")) as Issue[]) : [];
  }

  setIssues(issues: Issue[]): void {
    writeFileSync(this.statePath, JSON.stringify(issues, null, 2));
  }

  async listOpenIssues(): Promise<Issue[]> {
    return this.issues();
  }

  async createIssue(title: string, body: string): Promise<number> {
    const issues = this.issues();
    const number = Math.max(0, ...issues.map((issue) => issue.number)) + 1;
    this.setIssues([...issues, { number, title, body, pinned: false }]);
    return number;
  }

  async editIssueBody(number: number, body: string): Promise<void> {
    this.update(number, (issue) => ({ ...issue, body }));
  }

  async pinIssue(number: number): Promise<void> {
    // GitHub's limit, so tests can exercise a repository that has reached it.
    if (this.issues().filter(({ pinned }) => pinned).length >= 3) throw new Error("A repository can pin at most 3 issues");
    this.update(number, (issue) => ({ ...issue, pinned: true }));
  }

  private update(number: number, change: (issue: Issue) => Issue): void {
    const issues = this.issues();
    if (!issues.some((issue) => issue.number === number)) throw new Error(`Issue #${number} not found`);
    this.setIssues(issues.map((issue) => (issue.number === number ? change(issue) : issue)));
  }
}

export function createGitHub(): GitHub {
  const statePath = process.env.FIELDWORK_FAKE_GITHUB_STATE;
  if (!statePath) throw new Error("FIELDWORK_FAKE_GITHUB_STATE is not set");
  return new FakeGitHub(statePath);
}
