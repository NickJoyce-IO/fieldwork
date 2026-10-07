import { spawnSync } from "node:child_process";
import { GhCli } from "../src/github.ts";
import { githubContract } from "./github-contract.ts";
import { fakeGitHub } from "./helpers.ts";

githubContract("fake GitHub", { connect: () => fakeGitHub() });

// Creates, edits, pins, then unpins and closes real issues in the named
// repository, using your `gh` login:
//   FIELDWORK_GITHUB_CONTRACT_REPO=<owner>/<repo> npm test
const repo = process.env.FIELDWORK_GITHUB_CONTRACT_REPO;

githubContract("gh CLI against real GitHub", {
  skip: repo ? false : "set FIELDWORK_GITHUB_CONTRACT_REPO=<owner>/<repo> to run against real GitHub",
  connect: () => new GhCli(repo),
  cleanUp: async (issue) => {
    // Best effort: not every test pins its issue.
    spawnSync("gh", ["issue", "unpin", String(issue), "--repo", repo!], { stdio: "ignore" });
    spawnSync("gh", ["issue", "close", String(issue), "--repo", repo!, "--reason", "not planned"], { stdio: "ignore" });
  },
});
