# Each Track's Learner-side tooling uses that Track's own toolchain

The commands a Learner runs (`test`, `update`, `setup`) are built in each Track's own toolchain: npm scripts running TypeScript on Node for the TypeScript-on-Node Track, and Gradle tasks for the Kotlin Track. A Learner only installs what the language itself needs, and they practise that ecosystem's tools along the way. Maintainer tooling (`verify`, `publish`) stays in Node in the monorepo.

## Considered Options

- **One shared Node CLI vendored into every Project**: rejected because Kotlin Learners would have to install Node just to run their tests.

## Consequences

- The small Learner-side contract (run Steps in order, stop at the first failure, report passed/current/locked Steps, focus on one Step) is implemented once per Track. Monorepo `verify` checks every Track through its own `test`, which keeps the implementations consistent.
