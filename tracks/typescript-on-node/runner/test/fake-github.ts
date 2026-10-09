// A fake GitHub adapter kept in a JSON file, so a test and the CLI process it
// spawns share one fake repository. The CLI loads it through
// FIELDWORK_GITHUB_ADAPTER (see fakeGitHubEnv in helpers.ts).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import {
  GitHubError,
  type BranchProtection,
  type GitHub,
  type GitHubProblem,
  type Issue,
  type Ruleset,
} from "../src/github.ts";

/** A ruleset in the fake repository; `active: false` is one the Learner left disabled. */
export interface FakeRuleset extends Ruleset {
  id: number;
  active: boolean;
  requiresPullRequest: boolean;
}

interface State {
  issues: Issue[];
  rulesets: FakeRuleset[];
  /**
   * When set, every call fails the way the real adapter does for this problem,
   * or with an error the Learner cannot fix, such as GitHub being down.
   */
  failWith?: GitHubProblem | "unexpected";
}

export class FakeGitHub implements GitHub {
  readonly statePath: string;

  constructor(statePath: string) {
    this.statePath = statePath;
  }

  /** Every issue in the fake repository; they are all open. */
  issues(): Issue[] {
    return this.state().issues;
  }

  setIssues(issues: Issue[]): void {
    this.setState({ ...this.state(), issues });
  }

  rulesets(): FakeRuleset[] {
    return this.state().rulesets;
  }

  setRulesets(rulesets: FakeRuleset[]): void {
    this.setState({ ...this.state(), rulesets });
  }

  failWith(problem: GitHubProblem | "unexpected"): void {
    this.setState({ ...this.state(), failWith: problem });
  }

  async listOpenIssues(): Promise<Issue[]> {
    return this.stateOrFailure().issues;
  }

  async createIssue(title: string, body: string): Promise<number> {
    const issues = this.stateOrFailure().issues;
    const number = Math.max(0, ...issues.map((issue) => issue.number)) + 1;
    this.setIssues([...issues, { number, title, body, pinned: false }]);
    return number;
  }

  async editIssueBody(number: number, body: string): Promise<void> {
    this.updateIssue(number, (issue) => ({ ...issue, body }));
  }

  async pinIssue(number: number): Promise<void> {
    // GitHub's limit, so tests can exercise a repository that has reached it.
    if (this.stateOrFailure().issues.filter(({ pinned }) => pinned).length >= 3) {
      throw new Error("A repository can pin at most 3 issues");
    }
    this.updateIssue(number, (issue) => ({ ...issue, pinned: true }));
  }

  async branchProtection(branch: string): Promise<BranchProtection> {
    const applying = this.stateOrFailure().rulesets.filter((ruleset) => ruleset.active && ruleset.branch === branch);
    return {
      requiresPullRequest: applying.some(({ requiresPullRequest }) => requiresPullRequest),
      requiredChecks: applying.flatMap(({ requiredChecks }) => requiredChecks),
    };
  }

  async listRulesets(): Promise<{ id: number; name: string }[]> {
    return this.stateOrFailure().rulesets.map(({ id, name }) => ({ id, name }));
  }

  async createRuleset(ruleset: Ruleset): Promise<void> {
    const rulesets = this.stateOrFailure().rulesets;
    // GitHub refuses a second ruleset with the same name.
    if (rulesets.some(({ name }) => name === ruleset.name)) throw new Error(`Name must be unique: ${ruleset.name}`);
    const id = Math.max(0, ...rulesets.map((existing) => existing.id)) + 1;
    this.setRulesets([...rulesets, { ...asCreated(ruleset), id }]);
  }

  async updateRuleset(id: number, ruleset: Ruleset): Promise<void> {
    const rulesets = this.stateOrFailure().rulesets;
    if (!rulesets.some((existing) => existing.id === id)) throw new Error(`Ruleset ${id} not found`);
    this.setRulesets(rulesets.map((existing) => (existing.id === id ? { ...asCreated(ruleset), id } : existing)));
  }

  private state(): State {
    return existsSync(this.statePath)
      ? (JSON.parse(readFileSync(this.statePath, "utf8")) as State)
      : { issues: [], rulesets: [] };
  }

  private setState(state: State): void {
    writeFileSync(this.statePath, JSON.stringify(state, null, 2));
  }

  /** The state, or the failure the fake has been told to throw. */
  private stateOrFailure(): State {
    const state = this.state();
    if (state.failWith === "unexpected") throw new Error("HTTP 502: Bad Gateway");
    if (state.failWith !== undefined) throw new GitHubError(state.failWith);
    return state;
  }

  private updateIssue(number: number, change: (issue: Issue) => Issue): void {
    const issues = this.stateOrFailure().issues;
    if (!issues.some((issue) => issue.number === number)) throw new Error(`Issue #${number} not found`);
    this.setIssues(issues.map((issue) => (issue.number === number ? change(issue) : issue)));
  }
}

/** A ruleset as the adapter creates it: active, requiring a pull request. */
function asCreated(ruleset: Ruleset): Omit<FakeRuleset, "id"> {
  return { ...ruleset, active: true, requiresPullRequest: true };
}

export function createGitHub(): GitHub {
  const statePath = process.env.FIELDWORK_FAKE_GITHUB_STATE;
  if (!statePath) throw new Error("FIELDWORK_FAKE_GITHUB_STATE is not set");
  return new FakeGitHub(statePath);
}
