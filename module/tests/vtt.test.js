// FR-BLV-07: A description cue can point at a voice file.
import assert from "node:assert/strict";
import test from "node:test";
import { parseVtt } from "../blind/vtt.js";

test("an audio line is kept apart from the spoken text", () => {
  const [cue] = parseVtt("WEBVTT\n\nAD04\n00:00:08.844 --> 00:00:11.705\naudio:ad/AD04.am.opus\nመምህሩ ይጠቁማል።\n");
  assert.equal(cue.id, "AD04");
  assert.equal(cue.audio, "ad/AD04.am.opus");
  assert.equal(cue.text, "መምህሩ ይጠቁማል።");
  assert.ok(cue.start > 8 && cue.end > cue.start);
});
