// FR-CAP-02: Caption contrast stays at least 4.5 to 1.
import assert from "node:assert/strict";
import test from "node:test";
import { contrastRatio } from "../core/contrast.js";

test("white on black is readable", () => {
  assert.ok(contrastRatio("#ffffff", "#000000") >= 4.5);
});

test("yellow on black is readable", () => {
  assert.ok(contrastRatio("#ffe14a", "#000000") >= 4.5);
});

test("a faint pair is refused", () => {
  assert.ok(contrastRatio("#777777", "#888888") < 4.5);
});
