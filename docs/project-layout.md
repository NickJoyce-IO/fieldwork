# Project layout

How a Project is laid out in this monorepo, and which parts reach the Learner. Terms follow `CONTEXT.md`. The authoring guide (#15) will build on this.

## Where things live in the monorepo

- `tooling/`: maintainer-side commands (`npm run fieldwork -- <command>`), such as `verify` and `publish`. Never shipped to Learners (ADR-0002).
- `tracks/<track>/runner/`: that Track's Learner-side commands (`test`, later `update` and `setup`). Shipped inside every published Project of the Track.
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

## Reference Solutions

- There is one folder per Step: `solutions/<step-id>/`, where `<step-id>` matches the Step's `id` in `fieldwork.json`.
- Each folder is a **complete snapshot of Learner Code as it stands once that Step is done**. It is cumulative: `solutions/02-…/` includes everything from Step 1 as well.
- Paths inside the folder mirror the Project root. For example, `solutions/02-farewell/src/greet.ts` replaces `src/greet.ts`.
- To check a Step's Reference Solution, replace each path in the Project with the same path from the snapshot (usually just `src/`) and run the Track's `test`. The solution for Step N must pass Steps 1..N and fail Step N+1. That is what `verify` enforces, along with the starter code in `src/` passing no Step, each Step checked on its own.
- Run `npm run fieldwork -- verify <project-dir>` to check one Project, or `npm run fieldwork -- verify` to check every Project under `tracks/*/projects/`. Monorepo CI runs the latter on every PR and push to `main`.
- `solutions/` is never published to a Learner's Project repository.
