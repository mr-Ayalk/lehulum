// FR-DEAF-11: Longest glossary form wins, including an Amharic ending.
import assert from "node:assert/strict";
import test from "node:test";
import { matchGloss } from "../deaf/gloss-match.js";

const terms = [
  { id: "VARIABLE", am: "ተለዋዋጭ", en: "variable", forms_am: ["ተለዋዋጮች"], forms_en: ["variables"], sign: "lexicon/variable.mp4" },
  { id: "NAME", am: "ስም", en: "name", forms_am: [], forms_en: [], sign: "lexicon/name.mp4" }
];

test("matches an Amharic form and an English word", () => {
  const hits = matchGloss("ስለ ተለዋዋጮች እንማራለን variable", terms);
  assert.deepEqual(hits.map((hit) => hit.id), ["VARIABLE", "VARIABLE"]);
  assert.equal(hits[0].labelled, "machine");
});

test("does not match a Latin word inside another word", () => {
  const hits = matchGloss("namespace", terms);
  assert.equal(hits.length, 0);
});
