# Prototype: repo-per-Project on real GitHub (#6)

Whether publishing one public template repository per Project works end to end, before Project Content is written at scale. Terms follow `CONTEXT.md`.

## What was done (2026-10-07)

1. Two example Projects under `prototype/projects/`: `hello-steps` (a copy of the runner fixture) and `word-stats`. Both pass `npm run fieldwork -- verify prototype/projects/<project>`. They live here, not in `tracks/*/projects/`, so monorepo CI and the real catalogue never pick them up.
2. `npm run fieldwork -- publish prototype/projects/<project> --out <dir>` for each, then `git init`, `gh repo create --public --source . --push` and `gh repo edit --template`:
   - https://github.com/NickJoyce-IO/fieldwork-proto-hello-steps
   - https://github.com/NickJoyce-IO/fieldwork-proto-word-stats
3. A Learner repository from the `hello-steps` template with `gh repo create --public --template … --clone`: https://github.com/NickJoyce-IO/fieldwork-proto-learner-hello-steps
4. In the Learner repository: `npm install && npm test` reported Step 1 current (0/1) and Step 2 locked, exit 1.
5. Solved Step 1 on a branch, pushed and opened [PR #1](https://github.com/NickJoyce-IO/fieldwork-proto-learner-hello-steps/pull/1). The Fieldwork Steps check passed in 18s, and its output matched the local run: Step 1 passing, Step 2 current with its type error shown. Merged.

## Decision

**Go: keep repo-per-Project.** Every acceptance criterion of #6 held with the tooling as built, and nothing turned up that repo-per-Track would avoid. No ADR is needed since the spec's plan stands.

## Findings

- **Actions runs with no setup.** A repository created from a template had Actions enabled, and the first PR was graded without approval or configuration.
- **The Learner repo starts with one squashed "Initial commit".** It shares no Git history with the template, so `update` (#9) cannot merge or rebase against the template. It has to copy Project Content and compare versions through `fieldwork.json`, which is what the spec already says.
- **Templates do not include `package-lock.json`.** `npm install` creates one, so the Learner's first PR contains a ~400-line lockfile next to their real change, and CI resolves dependency versions afresh on every run. Suggestion: have `publish` write a lockfile (`npm install --package-lock-only`) and switch the PR workflow to `npm ci`. Needs its own ticket.
- **Nothing runs after a merge to `main`.** The workflow is `pull_request` only, so a merge records nothing yet. That is #7's job (push-to-`main` progress view).
- **`main` is unprotected in a new Learner repo.** Repository settings and rulesets are not part of a template's contents, so protection has to come from Step 0 or `setup` (#8), as planned. Not tested directly here: the prototype templates had no ruleset to copy.
- **Publishing a template is still manual.** It took `publish`, `git init`, `gh repo create` and `gh repo edit --template`. Publishing new versions from monorepo CI will need a token that can push to (and first create) each template repository, which `GITHUB_TOKEN` cannot do across repositories. Needs a ticket before #12 ships.
- **Where the template repos live is still open.** Up to eight Projects per Track as separate repos would crowd a personal profile. A GitHub org for the monorepo and its templates is worth deciding before the first real Project is published. Not tested here: the prototype used the personal account.
- **Minor:** the Learner workflow uses `actions/checkout@v5`/`setup-node@v5` while monorepo CI uses `@v4`.

## Cleanup

The three `fieldwork-proto-*` repositories are throwaway. Delete or archive them once this branch's findings are recorded on #6.
