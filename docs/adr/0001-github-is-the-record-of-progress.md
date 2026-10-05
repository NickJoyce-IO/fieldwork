# GitHub is the only record of progress; no hosted service

The project must be free for Learners and maintainers, and it should give Learners real practice with Git and GitHub. So there is no hosted service, no accounts and no server-side progress store. A Learner's progress is the merged PRs on `main` of their own Project repositories, with tests passing in GitHub Actions. Any local CLI only reads this state and never owns it.

## Considered Options

- **Hosted web service with accounts** (Exercism-style): rejected because of running cost, hosting burden for an open-source maintainer, and because it takes Learners away from the Git workflow we want them to practise.
- **Local progress file written by a CLI** (Rustlings-style): rejected as the source of truth because it duplicates what Git already records and diverges from it. It is acceptable as a cache.

## Consequences

- Progress is public by default if the Learner's repo is public, which is also what keeps GitHub Actions free.
- Features that need cross-Learner data (leaderboards, mentoring) are out of scope unless built on GitHub itself.
