// FR-DEAF-02: Free position, edge magnet, aspect-locked resize, and fraction storage.
import assert from "node:assert/strict";
import test from "node:test";
import { clampBox, fromFractions, magnet, resizeScale, sized, toFractions } from "../deaf/sign-geometry.js";
import { mapSignTime } from "../deaf/sign-sync.js";

test("a free position inside the stage stays where it is", () => {
  const box = { x: 30, y: 20, w: 40, h: 40 / (3 / 4) };
  assert.equal(clampBox(box, 200, 200).x, 30);
  assert.equal(clampBox(box, 200, 200).y, 20);
});

test("edges snap only within 12 pixels", () => {
  assert.equal(magnet({ x: 8, y: 40, w: 30, h: 40 }, 200, 160).x, 0);
  assert.equal(magnet({ x: 30, y: 40, w: 30, h: 40 }, 200, 160).x, 30);
  assert.equal(magnet({ x: 158, y: 40, w: 30, h: 40 }, 200, 160).x, 170);
});

test("resize stays between 18 and 55 percent and keeps 3:4", () => {
  assert.equal(resizeScale(0.18, -1), 0.18);
  assert.equal(resizeScale(0.55, 1), 0.55);
  const box = sized(0.4, 200, 400);
  assert.equal(box.w, 80);
  assert.ok(Math.abs(box.w / box.h - 3 / 4) < 0.001);
  const fitted = sized(0.55, 100, 80);
  assert.ok(fitted.h <= 80);
  assert.ok(Math.abs(fitted.w / fitted.h - 3 / 4) < 0.001);
});

test("fractions survive a larger stage", () => {
  const frac = toFractions({ x: 20, y: 10, w: 40, h: 40 / (3 / 4) }, 200, 160);
  const next = fromFractions(frac, 400, 320);
  assert.equal(next.x, 40);
  assert.equal(next.w, 80);
  assert.ok(Math.abs(next.w / next.h - 3 / 4) < 0.01);
});

test("sign time stays on the onset until the first cue", () => {
  assert.equal(mapSignTime(0.2, 4.95, 0.781, 1), 4.95);
  assert.ok(Math.abs(mapSignTime(0.78, 4.95, 0.781, 1) - 4.95) < 0.25);
});
