// FR-BLV-07, FR-NET-02: VTT cues and the connection choice.
import assert from "node:assert/strict";
import test from "node:test";
import { parseVtt } from "../blind/vtt.js";
import { chooseVariant } from "../net/light-lesson.js";

test("a description cue keeps its id and times", () => {
  const cues = parseVtt("WEBVTT\n\nAD04\n00:00:08.844 --> 00:00:11.705\nThe editor is empty.\n");
  assert.equal(cues[0].id, "AD04");
  assert.ok(cues[0].start > 8 && cues[0].start < 9);
  assert.equal(cues[0].text, "The editor is empty.");
});

test("save-data chooses the text lesson", () => {
  assert.equal(chooseVariant({ saveData: true, effectiveType: "4g" }), "text");
  assert.equal(chooseVariant({ effectiveType: "4g", downlink: 10 }), "full");
  assert.equal(chooseVariant(null), "full");
});
