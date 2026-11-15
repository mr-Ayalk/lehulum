// FR-CAP-04, FR-HOH-11: Cue text parser, without a browser.
import assert from "node:assert/strict";
import test from "node:test";
import { parseCueText } from "../core/captions.js";

test("voice tag becomes a speaker and plain text", () => {
  const cue = parseCueText("<v Teacher>Hello, and welcome.");
  assert.equal(cue.speaker, "Teacher");
  assert.deepEqual(cue.sounds, []);
  assert.equal(cue.parts.map((part) => part.text).join(""), "Hello, and welcome.");
});

test("square brackets are sound events and c.low is marked", () => {
  const cue = parseCueText("<v Teacher>Check your spelling.\n[error sound]\nThe word is <c.low>name</c>.");
  assert.deepEqual(cue.sounds, ["error sound"]);
  assert.ok(cue.parts.some((part) => part.type === "sound" && part.text === "error sound"));
  assert.ok(cue.parts.some((part) => part.type === "low" && part.text === "name"));
  assert.equal(cue.speaker, "Teacher");
});

test("stray tags are removed and their text is kept", () => {
  const cue = parseCueText("Hi <b>there</b> <i>now</i> <ruby>x</ruby>.");
  assert.equal(cue.speaker, "");
  assert.equal(cue.parts.filter((part) => part.type === "text").map((part) => part.text).join(""), "Hi there now x.");
  assert.equal(cue.parts.some((part) => part.text.includes("<")), false);
});
