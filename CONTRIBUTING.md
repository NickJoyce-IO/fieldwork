# Contributing to Fieldwork

Thanks for helping. Fieldwork is a set of free, test-driven learning Projects, so most contributions are a new Project, a fix to a Step, or a better Hint.

## Before you start

- **Read `CONTEXT.md`.** It defines the words used everywhere here, such as Learner, Track, Project, Step, Hint, Reference Solution, Project Content, Learner Code and Project Update. Use them in code, docs and pull requests, and avoid the alternatives it lists.
- **Open an issue first** for a new Project, a change of Step order, or anything that needs a major version. These are hard to undo once Learners have them. Typos, Hint improvements and clear bug fixes can go straight to a pull request.
- **Set up locally:** Node 24 (see `.nvmrc`) and npm, then `npm ci` at the repository root.

## Adding or changing a Project

Follow `docs/authoring-guide.md`. It covers the Project format, writing Steps, Hints and Reference Solutions, the versioning rules, and borrowing from MIT-licensed sources. `docs/project-layout.md` is the reference for where everything lives.

## Before opening a pull request

Run what CI runs, from the repository root:

```sh
npm run typecheck
npm test
npm run fieldwork -- verify
npm run fieldwork -- readme --check
```

If you changed a Project's metadata, run `npm run fieldwork -- readme` and commit the updated `README.md`.

## Pull requests

- Work on a branch and open a pull request against `main`. CI runs the four checks above on it, and it is only merged once they pass.
- Keep a pull request to one change. Reference the issue it addresses (`Closes #12`).
- When a pull request changes a published Project, bump its `version` by the rules in the authoring guide, and say in the description what the change means for Learners.

## Licence

Fieldwork is MIT licensed. By contributing, you agree your contribution is published under the same licence. Material borrowed from elsewhere must follow "Borrowing a problem from an MIT source" in the authoring guide.
