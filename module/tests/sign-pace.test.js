// FR-DEAF-06: Lesson pacing keeps the signer inside the lag limit.
import assert from "node:assert/strict";
import test from "node:test";
import { plan } from "../deaf/sign-pace.js";

function cue(id, start, end, span) {
  return { cue: id, start, end, source: "memory", src: id + ".mp4", from: 0, to: span };
}

const lesson = [
  cue("A01", 0.78, 2.4, 7.25),
  cue("A02", 2.82, 6, 3.7),
  cue("A03", 6, 10, 4),
  cue("A04", 10.4, 16, 3),
  cue("A05", 16, 22, 4),
  cue("A06", 22, 30, 3)
];

function check(rows, minRate) {
  rows.forEach((row, index) => {
    assert.ok(row.lessonRate >= minRate - 1e-9 && row.lessonRate <= 1);
    assert.ok(row.holdAfter === 0 || row.holdAfter >= 0.5 - 1e-9);
    assert.ok(row.lag <= 2.2 + 1e-6);
    if (index) assert.ok(Math.abs(row.lessonRate - rows[index - 1].lessonRate) <= 0.05 + 1e-9);
  });
}

test("rates stay above the floor and neighbours move by at most 0.05", () => {
  const rows = plan(lesson);
  check(rows, 0.85);
});

test("a hold is only the remainder that is at least the minimum", () => {
  const rows = plan(lesson, { minHold: 0.5 });
  assert.ok(rows.some((row) => row.holdAfter >= 0.5));
  assert.ok(rows.every((row) => row.holdAfter === 0 || row.holdAfter >= 0.5));
});

test("slowing the lesson enough removes every hold", () => {
  const mild = [cue("B1", 0, 8, 14), cue("B2", 8, 18, 12), cue("B3", 18, 28, 10)];
  const tight = plan(mild, { minLessonRate: 0.85 });
  const loose = plan(mild, { minLessonRate: 0.5 });
  assert.ok(tight.some((row) => row.holdAfter >= 0.5));
  assert.equal(loose.filter((row) => row.holdAfter > 0).length, 0);
  check(loose, 0.5);
});

test("a short line with a long sign still holds once", () => {
  const rows = plan(lesson);
  const held = rows.filter((row) => row.holdAfter >= 0.5);
  assert.equal(held.length, 1);
  assert.equal(held[0].cue, "A01");
});

test("a seek rebuilds the plan from the new time", () => {
  const full = plan(lesson);
  const again = plan(lesson, { from: 20, backlog: 0, into: 1 });
  assert.ok(full.find((row) => row.cue === "A01").holdAfter >= 0.5);
  assert.equal(again.find((row) => row.cue === "A01").holdAfter, 0);
  assert.equal(again.find((row) => row.cue === "A01").lessonRate, 1);
  check(again, 0.85);
});
