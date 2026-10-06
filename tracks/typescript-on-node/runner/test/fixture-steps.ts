// Steps shared by the process-level tests, used to build fixture Projects.

export const greetUnsolved = `export function greet(name: string): string {
  throw new Error("Not implemented yet");
}
`;

export const greetSolved = `export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
`;

export const greetStep = {
  id: "01-greet",
  title: "Greet someone",
  files: {
    "greet.test.ts": `import assert from "node:assert/strict";
import { test } from "node:test";
import { greet } from "../../src/greet.ts";

test("greets by name", () => {
  assert.equal(greet("Ada"), "Hello, Ada!");
});
`,
  },
};

export const farewellStep = {
  id: "02-farewell",
  title: "Say goodbye",
  files: {
    "farewell.test.ts": `import assert from "node:assert/strict";
import { test } from "node:test";
import { farewell } from "../../src/greet.ts";

test("says goodbye by name", () => {
  assert.equal(farewell("Ada"), "Goodbye, Ada!");
});

test("says goodbye to everyone when no name is given", () => {
  assert.equal(farewell(), "Goodbye, everyone!");
});
`,
  },
};

export const shoutStep = {
  id: "03-shout",
  title: "Shout",
  files: {
    "shout.test.ts": `import assert from "node:assert/strict";
import { test } from "node:test";
import { shout } from "../../src/greet.ts";

test("shouts", () => {
  assert.equal(shout("hi"), "HI!");
});
`,
  },
};

export const pairStep = {
  id: "01-pair",
  title: "Type a pair",
  files: {
    "pair.test.ts": `import type { Pair } from "../../src/pair.ts";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

export type Cases = [Expect<Equal<Pair<number>, [number, number]>>];
`,
  },
};
