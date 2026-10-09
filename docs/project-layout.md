# Project layout

How a Project is laid out in this monorepo, and which parts reach the Learner. Terms follow `CONTEXT.md`. The authoring guide (#15) will build on this.

## Where things live in the monorepo

- `tooling/`: maintainer-side commands (`npm run fieldwork -- <command>`), such as `verify` and `publish`. Never shipped to Learners (ADR-0002).
- `tracks/<track>/runner/`: that Track's Learner-side commands (`test`, `progress`, `setup`, later `update`). Shipped inside every published Project of the Track. All their GitHub calls go through one adapter (`runner/src/github.ts`), which wraps the `gh` CLI and is replaced by a fake in tests.
- `tracks/<track>/template/`: files every published Project of the Track gets as they are, such as the PR workflow and the devcontainer.
- `tracks/<track>/projects/<project>/`: real Projects.
- `tracks/<track>/fixtures/<project>/`: small Projects used to test the tooling, laid out exactly like real ones.

## Inside a Project

```
fieldwork.json        Project metadata: name, version, track, ordered Steps
package.json          (TypeScript-on-Node) scripts and dev dependencies
tsconfig.json         (TypeScript-on-Node) includes src and steps only
src/                  Learner Code; in the source Project this is the starter code
steps/<step-id>/      Project Content for one Step: README.md, Hints, *.test.ts
solutions/<step-id>/  Reference Solution for one Step (monorepo only)
```

## Step 0: protect main

The first Project in each Track starts with a Step that has the Learner protect `main` by hand. Its entry in `fieldwork.json` carries a built-in check instead of tests:

```json
{ "id": "00-protect-main", "title": "Protect main", "check": "main-ruleset" }
```

- **The check:** the runner asks GitHub, through the adapter, whether `main` has active rules requiring a pull request and the "Fieldwork Steps" check. It accepts any ruleset that provides them. Type errors in Learner Code don't count against this Step.
- **What the Learner sees:** the runner numbers Steps from 1, so the Learner sees this as "Step 1: Protect main". "Step 0" is only the maintainers' name for it.
- **Its folder:** `steps/00-protect-main/` holds the instructions and Hints but no tests. The `hello-step-zero` fixture has a complete version to start from.
- **Locally:** the check needs the GitHub CLI logged in.
- **In CI:** the PR and progress workflows pass their `GITHUB_TOKEN` to it.
- **Under `verify`:** monorepo CI has no Learner repository to ask, so `verify` leaves every check Step out of its runs, and such a Step needs no Reference Solution. The other Steps keep the numbers a Learner sees.

Later Projects in a Track have no Step 0. Their README tells the Learner to run `npm run setup`, which applies a "Fieldwork: protect main" ruleset with the same requirements. Running it again is safe: it leaves an already protected `main` alone, and repairs its own ruleset if it was edited.

## Reference Solutions

- There is one folder per Step: `solutions/<step-id>/`, where `<step-id>` matches the Step's `id` in `fieldwork.json`.
- Each folder is a **complete snapshot of Learner Code as it stands once that Step is done**. It is cumulative: `solutions/02-…/` includes everything from Step 1 as well.
- Paths inside the folder mirror the Project root. For example, `solutions/02-farewell/src/greet.ts` replaces `src/greet.ts`.
- To check a Step's Reference Solution, replace each path in the Project with the same path from the snapshot (usually just `src/`) and run the Track's `test`. The solution for Step N must pass Steps 1..N and fail Step N+1. That is what `verify` enforces, along with the starter code in `src/` passing no Step, each Step checked on its own.
- Run `npm run fieldwork -- verify <project-dir>` to check one Project, or `npm run fieldwork -- verify` to check every Project under `tracks/*/projects/`. Monorepo CI runs the latter on every PR and push to `main`.
- `solutions/` is never published to a Learner's Project repository.

## Versions and the semver guard

A Project's `version` in `fieldwork.json` follows semver, as Project Updates rely on it:

- **Major:** may change existing Steps' tests incompatibly, or remove or reorder Steps.
- **Minor:** adds Steps at the end, or changes Hints and instructions.
- **Patch:** fixes only.

Publishing a Project to its template repository (from monorepo CI, #21) tags the monorepo commit it published from as `<name>@<version>`, for example `hello-steps@0.1.0`. `verify` compares the Project with its highest tagged version. If the Project's current version has the same major version, then for each published Step N:

- Step N must still be Step N, with the same `id`.
- Step N's Reference Solution **as published** must pass Steps 1..N as they stand now. If it doesn't, the Step got stricter, and a Learner who completed it would fail it after updating.

The failure names the Step and asks for a major version bump. `verify` also fails if the version is not `major.minor.patch`, or is lower than the last published one. A Project with no tag has never been published, so the guard doesn't apply to it. CI checks out the full history so the tags are there.

## What `publish` produces

`npm run fieldwork -- publish <project-dir> --out <dir>` writes a template repository's file tree into an empty directory. It copies an allow-list, so anything else in the source Project, `solutions/` above all, never reaches it.

```
fieldwork.json        copied as is, so the version is the one in the source Project
package.json          the source's, minus `description`, with `npm test` and `npm run setup` pointed at .fieldwork/ and Node and npm pinned as in the monorepo
tsconfig.json         copied as is
.nvmrc                the monorepo's
src/                  the starter code, which becomes Learner Code
steps/                Project Content
.fieldwork/           the Track's runner (`tracks/<track>/runner/src/`)
README.md             generated from fieldwork.json
.github/, .devcontainer/, .gitignore   from tracks/<track>/template/
```

The PR workflow runs `npm test` and copies its output into the check summary. Exit code 1 means the Current Step is unfinished, which a pull request may leave it, so the check passes. Any other non-zero exit means the Steps could not run, and the check fails.

## The progress view

On every push to `main`, the `progress.yml` workflow runs `node .fieldwork/cli.ts progress`. It checks the Steps in order as `test` does. Every Step that passes before the Current Step is a Completed Step, so one pull request that finishes several Steps records them all. The result goes into a pinned issue titled "Progress", which is created on the first run and found again by a hidden marker in its body. The workflow's token can read the repository's contents but not write them, so it never commits to the protected `main`.

The adapter's contract tests run against the fake on every test run. To run them against real GitHub as well, set `FIELDWORK_GITHUB_CONTRACT_REPO=<owner>/<repo>` and run `npm test` in the runner package with a `gh` login that can administer it. The tests create, pin, unpin and close their own issues. They also create and delete rulesets on throwaway branch names, never `main`.

When `gh` fails in a way the Learner can fix, the adapter throws a `GitHubError` whose message says what to do. That covers `gh` not installed, not logged in, no permission, or a private repository on a free plan. A failing Step 0 shows this message, and the other commands print it and exit 2.
