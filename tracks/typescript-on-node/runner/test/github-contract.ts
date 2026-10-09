import assert from "node:assert/strict";
import { test } from "node:test";
import { GitHubError, type GitHub } from "../src/github.ts";

/** What a contract test made in the repository, for cleaning up after it. */
export interface CreatedResources {
  issues: number[];
  rulesets: number[];
}

/**
 * What every GitHub adapter must do, run against the fake on every test run
 * and against real GitHub when enabled (github.test.ts). The repository may
 * hold other issues and rulesets, so each test only looks at what it creates,
 * and rulesets target a branch of their own, never main.
 */
export function githubContract(
  name: string,
  options: {
    skip?: string | false;
    connect: () => GitHub;
    /** The same repository, reached without a GitHub login. */
    connectUnauthenticated: () => GitHub;
    cleanUp?: (created: CreatedResources) => Promise<void>;
  },
): void {
  const contractTest = (title: string, body: (github: GitHub, created: CreatedResources) => Promise<void>) =>
    test(`${name}: ${title}`, { skip: options.skip }, async (t) => {
      const created: CreatedResources = { issues: [], rulesets: [] };
      t.after(() => options.cleanUp?.(created));
      await body(options.connect(), created);
    });

  contractTest("a created issue is listed as open and unpinned", async (github, created) => {
    const number = await github.createIssue("Fieldwork contract test", "First body");
    created.issues.push(number);

    const issue = (await github.listOpenIssues()).find((listed) => listed.number === number);
    assert.deepEqual(issue, { number, title: "Fieldwork contract test", body: "First body", pinned: false });
  });

  contractTest("editing an issue's body replaces it, and pinning it shows it pinned", async (github, created) => {
    const number = await github.createIssue("Fieldwork contract test", "First body");
    created.issues.push(number);

    await github.editIssueBody(number, "Second body\n\n- with Markdown");
    await github.pinIssue(number);

    const issue = (await github.listOpenIssues()).find((listed) => listed.number === number);
    assert.equal(issue?.body, "Second body\n\n- with Markdown");
    assert.equal(issue?.pinned, true);
  });

  contractTest("a branch with no ruleset requires nothing", async (github) => {
    assert.deepEqual(await github.branchProtection(uniqueBranch()), { requiresPullRequest: false, requiredChecks: [] });
  });

  contractTest("a created ruleset protects its branch, is listed, and can be updated", async (github, created) => {
    const branch = uniqueBranch();
    const name = `Fieldwork contract test ${branch}`;

    await github.createRuleset({ name, branch, requiredChecks: ["First check"] });
    const listed = (await github.listRulesets()).find((ruleset) => ruleset.name === name);
    assert.ok(listed, `ruleset "${name}" is listed`);
    created.rulesets.push(listed.id);
    assert.deepEqual(await github.branchProtection(branch), { requiresPullRequest: true, requiredChecks: ["First check"] });

    await github.updateRuleset(listed.id, { name, branch, requiredChecks: ["Second check"] });
    assert.deepEqual(await github.branchProtection(branch), { requiresPullRequest: true, requiredChecks: ["Second check"] });
  });

  test(`${name}: without a login, calls fail as not authenticated`, { skip: options.skip }, async () => {
    await assert.rejects(options.connectUnauthenticated().branchProtection("main"), (error: unknown) => {
      assert.ok(error instanceof GitHubError);
      assert.equal(error.problem, "not-authenticated");
      assert.match(error.message, /gh auth login/);
      return true;
    });
  });
}

function uniqueBranch(): string {
  return `fieldwork-contract-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}
