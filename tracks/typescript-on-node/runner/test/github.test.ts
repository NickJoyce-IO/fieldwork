import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GhCli } from "../src/github.ts";
import { githubContract } from "./github-contract.ts";
import { fakeGitHub, fixturesDir } from "./helpers.ts";

githubContract("fake GitHub", {
  connect: () => {
    const github = fakeGitHub();
    github.setTemplate(join(fixturesDir, "hello-steps"));
    return github;
  },
  connectUnauthenticated: () => {
    const github = fakeGitHub();
    github.failWith("not-authenticated");
    return github;
  },
});

// Creates, edits, pins, then unpins and closes real issues in the named
// repository, and creates then deletes rulesets on throwaway branch names
// (never main), using your `gh` login. The repository must have been created
// from a published Project's template:
//   FIELDWORK_GITHUB_CONTRACT_REPO=<owner>/<repo> npm test
const repo = process.env.FIELDWORK_GITHUB_CONTRACT_REPO;

githubContract("gh CLI against real GitHub", {
  skip: repo ? false : "set FIELDWORK_GITHUB_CONTRACT_REPO=<owner>/<repo> to run against real GitHub",
  connect: () => new GhCli({ repo }),
  // An empty gh config directory and no token: gh has no login at all.
  connectUnauthenticated: () =>
    new GhCli({ repo, env: { GH_CONFIG_DIR: mkdtempSync(join(tmpdir(), "gh-")), GH_TOKEN: "", GITHUB_TOKEN: "" } }),
  cleanUp: async ({ issues, rulesets }) => {
    const gh = (args: string[]) => spawnSync("gh", args, { env: { ...process.env, GH_REPO: repo }, stdio: "ignore" });
    // Best effort: not every test pins its issue.
    for (const issue of issues) {
      gh(["issue", "unpin", String(issue)]);
      gh(["issue", "close", String(issue), "--reason", "not planned"]);
    }
    for (const id of rulesets) gh(["api", "--method", "DELETE", `repos/{owner}/{repo}/rulesets/${id}`]);
  },
});
