# The monorepo and its template repositories live in the fieldwork-learn org

Repo-per-Project (confirmed in #6) means up to eight template repositories per Track. The monorepo and all of them live in a free GitHub org, `fieldwork-learn`, owned by the maintainer's own account, not on that personal account. The monorepo is `fieldwork-learn/fieldwork`. Each template repository is named `<Track prefix>-<Project name>`, for example `fieldwork-learn/ts-paginated-api`. The prefix is the Track's `repositoryPrefix` in its `track.json`: `ts` for the TypeScript-on-Node Track and `kotlin` for the Kotlin Track.

## Considered Options

- **Stay on the personal account:** rejected, mainly because of publishing from CI (#21). A token that creates repositories reaches every repository its owner has, so on a personal account it could write to the maintainer's unrelated repositories. The workaround, creating each template by hand and scoping the token to those, adds a manual step to every new Project. A personal account also has no roles beyond owner and collaborator, so co-maintainers couldn't be given narrower access. And up to sixteen template repositories would crowd the maintainer's profile.
- **Bare Project names** (`fieldwork-learn/paginated-api`): rejected. Two Tracks can reasonably have a Project of the same name, such as a paginated-API CLI in both, and `verify` would have to enforce names unique across Tracks.
- **The full Track folder name as the prefix** (`typescript-on-node-paginated-api`): rejected as too long for little gain over a short prefix.

## Consequences

- #21's token, or GitHub App, is scoped to the org, so it can create template repositories itself and can't reach anything else.
- A Project's template repository is fixed by its Track's prefix and its `name`, so neither may change once the Project is published. `tooling/src/template-repository.ts` is the one place that builds the name.
- Learners' own repositories are unaffected: they live in the Learners' accounts. `update` finds the template through GitHub's record of the template a repository was created from, so it doesn't depend on any of these names.
- The maintainer keeps their personal login. The org is only a namespace that they own.
- The `fieldwork-proto-*` repositories from #6 stay on the personal account as throwaways.
