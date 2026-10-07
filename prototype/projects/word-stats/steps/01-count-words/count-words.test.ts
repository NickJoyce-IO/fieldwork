import assert from "node:assert/strict";
import { test } from "node:test";
import { countWords } from "../../src/stats.ts";

test("counts words separated by whitespace", () => {
  assert.equal(countWords("the quick  brown\nfox"), 4);
});

test("counts no words in blank text", () => {
  assert.equal(countWords("   "), 0);
});
