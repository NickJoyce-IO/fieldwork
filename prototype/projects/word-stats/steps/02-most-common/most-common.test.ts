import assert from "node:assert/strict";
import { test } from "node:test";
import { mostCommonWord } from "../../src/stats.ts";

test("finds the most common word, ignoring case", () => {
  assert.equal(mostCommonWord("The cat saw the dog"), "the");
});

test("finds no word in blank text", () => {
  assert.equal(mostCommonWord(""), undefined);
});
