# Free learning resources: Kotlin, TypeScript, modern Node.js (test-driven, Git-integrated)

As of: 2026-10-05. Repo stats (stars, last push, archived, SPDX licence) come from the GitHub REST API (`api.github.com/repos/...`) fetched on this date. Anything not confirmed against a primary source is marked **unverified**.

## Summary

**What exists**
- Kotlin: official Kotlin Koans (each task is a failing unit test) via the JetBrains Academy IDE plugin, plus Exercism's Kotlin track (88 exercises) and the official Kotlin Tour.
- TypeScript: official Handbook, "TypeScript for JavaScript Programmers" and Playground (no tests); Exercism TypeScript track (108 exercises); type-challenges (type-level tests, 48k stars); typescript-exercises (3k stars); typescriptlings (Rustlings clone, 25 stars, no licence).
- Node: official nodejs.org/learn (reading, includes a node:test guide); learnyounode/NodeSchool (stale since 2021); Exercism JavaScript track; one very new community repo, `Rossoline/node-learn` (20 test-driven blocks, `node:test`, strict TS; created 2026-06-06, 2 stars).
- Git/GitHub: GitHub Skills courses (MIT, driven by Actions in a template repo copy). GitHub Classroom autograding is being retired (see below).

**What's missing**
- No single path covering Kotlin + TypeScript + Node that is test-driven, self-paced, aimed at experienced devs, and runs the Git workflow (branch, commit, PR, CI) as part of the exercises.
- Exercism is test-driven but its flow is CLI + website, not GitHub fork/PR/Actions. GitHub Skills teaches the workflow but not the languages. Nothing combines them.
- No maintained Rustlings-style (watch mode, progress file) project for Kotlin (none found; unverified absence). The Kotlin Koans repo is archived, the Kotlin by Example repo is archived.

**What to reuse**
- Exercism's per-exercise layout (stub + tests + docs + hints) and MIT licence; Exercism `problem-specifications` as shared exercise specs.
- Kotlin Koans content (`Kotlin/kotlin-koans-edu`, MIT) as the Kotlin on-ramp.
- `skills/exercise-toolkit` (MIT) and the GitHub Skills pattern (template repo + Actions workflows that comment on issues/PRs and update README) for Git/CI lessons.
- GitHub Actions on public repos is free on standard runners, so a fork-based "push, CI checks, feedback" loop costs learners nothing.
- Rustlings' watch-mode / progress / hint mechanics as a UX model.
- Do not build on GitHub Classroom: it is closed to new sign-ups and was scheduled to retire on 2026-08-28.

## Track A: Kotlin

| Name | URL | Format | Test-driven? | Git-integrated? | Licence | Maintenance (as of 2026-10-05) |
|---|---|---|---|---|---|---|
| Kotlin docs / Kotlin Tour | https://kotlinlang.org/docs/getting-started.html | Interactive browser tour + docs | No (browser exercises; not unit-test structured) | No | Site source Apache-2.0 (JetBrains/kotlin-web-site) | Active, pushed 2026-10-05 |
| Kotlin Koans (docs page) | https://kotlinlang.org/docs/koans.html | Exercises online (play.kotlinlang.org/koans) or in JetBrains Academy IDE plugin | Yes: "each exercise is structured as a failing unit test" | No | Content repo MIT | Docs page live |
| kotlin-koans-edu (task content) | https://github.com/Kotlin/kotlin-koans-edu | Course content for the Educational plugin and play.kotl.in | Yes | No | MIT | Not archived; last push 2023-01-27 (quiet, 120 stars) |
| kotlin-koans (old repo) | https://github.com/Kotlin/kotlin-koans | Old workshop repo | Yes | Clone-based only | MIT | **Archived**, last push 2019-07-15 |
| Kotlin by Example | https://github.com/Kotlin/kotlin-by-example | Annotated runnable examples | No | No | MIT | **Archived** 2025-10-10; search result states pointer to Kotlin Tour (the pointer text itself came via search snippet: unverified) |
| JetBrains Academy plugin (EduTools) | https://plugins.jetbrains.com/plugin/10081-jetbrains-academy ; source https://github.com/JetBrains/educational-plugin | IDE plugin, 100+ courses, tasks verified with built-in tests | Yes ("verify work through built-in tests") | No | Apache-2.0 | Very active, pushed 2026-10-05 |
| Hyperskill Kotlin Core track | https://hyperskill.org/tracks/18 | Web + IDE, 850+ coding problems, theory articles | Auto-checked problems | No | Proprietary | Active. Page says "free tier / no credit card"; free-tier limits **unverified** |
| Exercism Kotlin track | https://exercism.org/tracks/kotlin ; https://github.com/exercism/kotlin | Gradle projects with tests, CLI + web, optional mentoring | Yes | Not GitHub-workflow based | MIT | Active, pushed 2026-09-22, 247 stars, 88 exercises |
| Kotlin "rustlings" clone | none found | n/a | n/a | n/a | n/a | Searched; only unrelated repos surfaced (absence **unverified**) |

## Track B: JavaScript to TypeScript

| Name | URL | Format | Test-driven? | Git-integrated? | Licence | Maintenance |
|---|---|---|---|---|---|---|
| TypeScript Handbook + "TS for JS Programmers" | https://www.typescriptlang.org/docs/handbook/intro.html | Docs, Playground, cheat sheets | No | No | Docs repo CC-BY-4.0 (microsoft/TypeScript-Website) | Active, pushed 2026-10-01 |
| Exercism TypeScript track | https://exercism.org/tracks/typescript ; https://github.com/exercism/typescript | Local exercises + tests, CLI, mentoring | Yes | No (CLI submit) | MIT | Active, pushed 2026-09-22, 167 stars, 108 exercises |
| Exercism JavaScript track | https://github.com/exercism/javascript | Same model | Yes | No | MIT | Active, pushed 2026-10-02, 653 stars |
| type-challenges | https://github.com/type-challenges/type-challenges | Type-level puzzles: Playground plugin or local; ~190 challenges across warm-up/easy/medium/hard/extreme | Yes: type-assertion tests (the README does not detail the mechanism; judged by compiler) | Contribution via PRs (README implies; detail **unverified**) | MIT | 48.5k stars, last push 2026-05-16 |
| typescript-exercises | https://github.com/typescript-exercises/typescript-exercises ; https://typescript-exercises.github.io/ | Local dev server (`yarn start`), 8 topic areas, difficulty ramps | Compiler-error driven; no test files in repo root | PRs welcome | MIT | 3k stars, last push 2026-03-29. Exact check mechanism **unverified** |
| typescriptlings | https://github.com/ayakovlenko/typescriptlings | Rustlings-style, Deno; `deno task start` (watch), `deno task test` | Yes (compiler messages + tests) | `deno task pr-fix` suggests PR flow | **No licence** (SPDX null) | 25 stars, pushed 2026-02-05. Cannot be reused as-is |
| Node.js learn: TypeScript section | https://nodejs.org/en/learn | Reading | No | No | See Track C | Active |

## Track C: Modern Node.js

| Name | URL | Format | Test-driven? | Git-integrated? | Licence | Maintenance |
|---|---|---|---|---|---|---|
| nodejs.org/learn | https://nodejs.org/en/learn | Docs; sections include Test Runner (4 guides), Modules, Async, HTTP, File System, TypeScript | Only teaches `node:test`; exercises themselves not test-structured | No | Site repo MIT (nodejs/nodejs.org); content licence **unverified** | Active, pushed 2026-10-04 |
| learnyounode (NodeSchool workshopper) | https://github.com/workshopper/learnyounode | CLI workshop, `learnyounode verify` | Yes (verification) | No | MIT per LICENSE.md (GitHub API reports NOASSERTION) | Last push 2021-12-04, 7.4k stars: stale, pre-modern-Node |
| workshopper-adventure | https://github.com/workshopper/workshopper-adventure | Framework behind workshoppers | n/a | No | NOASSERTION | Last push 2024-02-03 |
| nodeschool.github.io | https://github.com/nodeschool/nodeschool.github.io | Event/chapter website | n/a | No | BSD-2-Clause | Last push 2024-06-25 |
| Exercism JavaScript track | https://github.com/exercism/javascript | See Track B | Yes | No | MIT | Active (language, not Node APIs) |
| node-learn ("Node.js in a Month") | https://github.com/Rossoline/node-learn | GitHub template repo; 20 test-driven blocks in strict TS using `node:test`; HTTP API + CLI capstone; Node 22+ | Yes | Template-repo only; no CI-driven lessons seen | MIT | **Created 2026-06-06, 2 stars**: very new, closest prior art to Nick's idea |
| karianov/nodejs-exercises | https://github.com/karianov/nodejs-exercises | Exercises | Unverified | No | None | Last push 2020, 0 stars: effectively dead |

## Cross-cutting: Git/GitHub learning

| Name | URL | Format | Test-driven? | Git-integrated? | Licence | Status |
|---|---|---|---|---|---|---|
| GitHub Skills (Introduction to GitHub) | https://github.com/skills/introduction-to-github | Template repo copy; steps: create branch, commit file, open PR, merge; Actions jobs set up each lesson | Step-completion checks | Yes, the whole point | MIT | 10.6k stars, last push 2026-06-22 |
| Hello GitHub Actions | https://github.com/skills/hello-github-actions | Same model | Step checks | Yes (Actions) | MIT | Pushed 2026-03-03 |
| Test with Actions (CI) | https://github.com/skills/test-with-actions | Same model | Step checks | Yes (CI) | MIT | Pushed 2026-04-20 |
| skills/exercise-toolkit | https://github.com/skills/exercise-toolkit | Reusable workflows + markdown templates for authoring Skills exercises | n/a | Yes | MIT | Pushed 2026-07-27 |
| GitHub Classroom autograding | https://docs.github.com/en/education/manage-coursework-with-github-classroom/teach-with-github-classroom/use-autograding | Teacher-run assignments with I/O tests, pytest, run-command tests, or any Actions workflow | Yes | Yes | n/a (service) | **Closed to new sign-ups since 2026-05-26; retirement 2026-08-28** (GitHub changelog). Current state after that date: unverified |
| GitHub Actions | https://docs.github.com/en/actions/about-github-actions/understanding-github-actions | CI engine | n/a | Yes | n/a | Free for public repos on standard runners; Free plan gives 2,000 min/month for private repos |

## Mechanisms worth reusing

- **Exercism**: per-exercise folder with stub, tests and docs (the Kotlin hello-world has `.docs`, `.meta`, `src`, Gradle files). Flow is `exercism download --exercise=<slug> --track=<track>`, solve until local tests pass, `exercism submit <files>`; optional mentor feedback and automatic analysis (https://exercism.org/docs/using/solving-exercises/working-locally). Shared specs live in `exercism/problem-specifications` (MIT). Progress is stored server-side on the website (not in your repo).
- **Rustlings**: watch mode, progress tracking, hints, verification (https://github.com/rust-lang/rustlings README). Progress is kept locally; that is a good fit for a repo-based tool. File-level detail of how progress is stored: unverified.
- **GitHub Skills**: learner copies a template repo; Actions workflows run (visible in the Actions tab), post issue/PR comments with the next step, and update the README. `skills/exercise-toolkit` provides `start-exercise.yml`, `find-exercise-issue.yml`, markdown step-feedback templates and the `skills/action-text-variables` action. Tip from the course: use a public repo to avoid consuming Actions minutes.
- **GitHub Classroom autograding** (pattern, not the service): tests defined in `.github/workflows/classroom.yml`; points by passing tests; run on push or on a schedule to save minutes. The same pattern can be done with a plain Actions workflow in the learner's fork.
- **Kotlin Koans / JetBrains Academy plugin**: each task is a failing unit test; learner clicks check, can "Peek solution". Course content lives in a GitHub repo (kotlin-koans-edu). Plugin internals of validation beyond "built-in tests": unverified (docs pages did not load).
- **type-challenges**: puzzle = type assertions; solved when the compiler reports no errors; contributions via PR.

## Licensing and reuse

- MIT (reusable and forkable with notice retained): Exercism language tracks and CLI, problem-specifications, type-challenges, typescript-exercises, kotlin-koans(-edu), kotlin-by-example, learnyounode (per LICENSE.md), node-learn, nodejs.org site repo, GitHub Skills courses and exercise-toolkit, rust-lang/rustlings, jetbrains-academy/rustlings-course.
- Apache-2.0: JetBrains/educational-plugin, JetBrains/kotlin-web-site.
- CC-BY-4.0: TypeScript-Website (docs content; reuse requires attribution).
- No licence (all rights reserved by default, do not copy): typescriptlings, karianov/nodejs-exercises.
- Proprietary: Hyperskill.
- Caveats: Exercism's LICENSE file covers the repo; a separate content licence is not stated there, and individual exercises may carry source attribution in metadata (unverified). Official Kotlin and Node docs prose licences were not checked.

## Gaps (nothing found that does this)

1. One path spanning Kotlin, TypeScript and Node with a shared structure.
2. Experienced-developer framing: "you know JS or Java, skip the basics" (Koans targets Java developers; TS handbook has "for JS programmers"; no combined track).
3. Git workflow embedded in the exercises: branch per exercise, PR to your own fork, Actions as the grader, README-driven feedback. GitHub Skills does this for Git only; Exercism does tests only.
4. Maintained Rustlings-style Kotlin tool (none found).
5. Modern Node (node:test, ESM, fetch, built-in watch, type-stripping) as an exercise set; only `Rossoline/node-learn` appears, and it is brand new with 2 stars.
6. Replacement for Classroom autograding that individuals can self-host in their own repos.

## Sources

- https://api.github.com/repos/exercism/kotlin, /typescript, /javascript, /cli, /problem-specifications
- https://api.github.com/repos/type-challenges/type-challenges
- https://api.github.com/repos/rust-lang/rustlings
- https://api.github.com/repos/Kotlin/kotlin-koans, /kotlin-koans-edu, /kotlin-by-example, https://api.github.com/repos/JetBrains/kotlin-web-site
- https://api.github.com/repos/JetBrains/educational-plugin
- https://api.github.com/repos/typescript-exercises/typescript-exercises
- https://api.github.com/repos/ayakovlenko/typescriptlings and https://raw.githubusercontent.com/ayakovlenko/typescriptlings/main/README.md
- https://api.github.com/repos/workshopper/learnyounode, /workshopper-adventure; https://github.com/workshopper/learnyounode/blob/master/LICENSE.md
- https://api.github.com/repos/nodeschool/nodeschool.github.io, https://api.github.com/repos/nodejs/nodejs.org, https://api.github.com/repos/microsoft/TypeScript-Website
- https://api.github.com/repos/Rossoline/node-learn and its README; https://api.github.com/repos/karianov/nodejs-exercises
- https://api.github.com/repos/skills/introduction-to-github, /hello-github-actions, /test-with-actions, /exercise-toolkit; https://github.com/skills/exercise-toolkit
- https://exercism.org/about; https://exercism.org/tracks/kotlin; https://exercism.org/tracks/typescript; https://exercism.org/docs/using/solving-exercises/working-locally; https://github.com/exercism/typescript/blob/main/LICENSE
- https://kotlinlang.org/docs/koans.html; https://kotlinlang.org/docs/getting-started.html
- https://www.typescriptlang.org/docs/handbook/intro.html; https://nodejs.org/en/learn
- https://hyperskill.org/tracks/18; https://plugins.jetbrains.com/plugin/10081-jetbrains-academy
- https://raw.githubusercontent.com/JetBrains/educational-plugin/master/README.md; https://raw.githubusercontent.com/rust-lang/rustlings/main/README.md; https://raw.githubusercontent.com/type-challenges/type-challenges/main/README.md
- https://docs.github.com/en/education/manage-coursework-with-github-classroom/teach-with-github-classroom/use-autograding
- https://github.blog/changelog/2026-05-26-github-classroom-sign-ups-are-no-longer-available/
- https://docs.github.com/en/actions/about-github-actions/understanding-github-actions
- https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions
