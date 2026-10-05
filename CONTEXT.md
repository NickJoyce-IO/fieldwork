# Fieldwork

Fieldwork is a free, open-source, self-driven set of hands-on learning material for experienced developers picking up Kotlin, or moving from JavaScript to TypeScript on modern Node. Learners work entirely through Git and GitHub, with failing tests marking progress.

## Language

**Learner**:
A developer who already knows how to program and is new to the language in question, or converting into it from another language.
_Avoid_: Student, beginner, user

**Track**:
A self-contained learning path for one language ecosystem. A Learner can take any Track on its own, in any order.
_Avoid_: Course, curriculum

**Kotlin Track**:
The Track for Kotlin, progressing from the language itself into Spring Boot.

**TypeScript-on-Node Track**:
The Track that teaches TypeScript and modern Node together, aimed at Learners coming from JavaScript.
_Avoid_: TS track, Node track (as separate things)

**Project**:
One real-world thing a Learner builds within a Track, in its own repository. Projects stand alone where possible and state what they assume the Learner already knows.
_Avoid_: Exercise, kata, module, lesson

**Step**:
One slice of a Project covering a single concept, defined by a small set of failing tests the Learner makes pass in roughly fifteen minutes.
_Avoid_: Task, exercise, stage

**Current Step**:
The first Step in a Project whose tests do not yet pass locally. It is where the Learner is working now.

**Locked Step**:
Any Step after the Current Step. Its instructions and tests are visible, but it is not checked until every earlier Step passes.

**Completed Step**:
A Step whose work has been merged to `main` of the Learner's Project repository with its tests passing in CI. GitHub is the sole record of progress.
_Avoid_: Submitted, checked off

**Hint**:
Guidance shipped alongside a Step to unblock a Learner without giving the answer.

**Reference Solution**:
The maintainers' working solution to a Step, kept outside the Learner's Project repository so it is only seen deliberately.
_Avoid_: Answer key

**Project Content**:
The parts of a Project repository the maintainers own: Step tests, Step instructions and Hints. Learners do not edit it.

**Learner Code**:
The parts of a Project repository the Learner writes and owns. Project Updates never touch it.

**Project Update**:
A newer version of a Project's Project Content brought into a Learner's existing Project repository.
_Avoid_: Sync, upgrade

## Flagged ambiguities

- "Service" was used early on for the whole project. Resolved: there is no hosted service. The project is delivered through GitHub repositories, with a small local CLI only if needed.
