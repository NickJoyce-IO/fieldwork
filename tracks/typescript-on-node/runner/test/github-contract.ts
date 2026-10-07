import assert from "node:assert/strict";
import { test } from "node:test";
import type { GitHub } from "../src/github.ts";

/**
 * What every GitHub adapter must do, run against the fake on every test run
 * and against real GitHub when enabled (github.test.ts). The repository may
 * hold other issues, so each test only looks at the ones it creates.
 */
export function githubContract(
  name: string,
  options: { skip?: string | false; connect: () => GitHub; cleanUp?: (issue: number) => Promise<void> },
): void {
  const contractTest = (title: string, body: (github: GitHub, created: number[]) => Promise<void>) =>
    test(`${name}: ${title}`, { skip: options.skip }, async (t) => {
      const created: number[] = [];
      t.after(async () => {
        for (const issue of created) await options.cleanUp?.(issue);
      });
      await body(options.connect(), created);
    });

  contractTest("a created issue is listed as open and unpinned", async (github, created) => {
    const number = await github.createIssue("Fieldwork contract test", "First body");
    created.push(number);

    const issue = (await github.listOpenIssues()).find((listed) => listed.number === number);
    assert.deepEqual(issue, { number, title: "Fieldwork contract test", body: "First body", pinned: false });
  });

  contractTest("editing an issue's body replaces it, and pinning it shows it pinned", async (github, created) => {
    const number = await github.createIssue("Fieldwork contract test", "First body");
    created.push(number);

    await github.editIssueBody(number, "Second body\n\n- with Markdown");
    await github.pinIssue(number);

    const issue = (await github.listOpenIssues()).find((listed) => listed.number === number);
    assert.equal(issue?.body, "Second body\n\n- with Markdown");
    assert.equal(issue?.pinned, true);
  });
}
