// FR-DEAF-06: Planned lesson rate and hold for Smooth and Pause pacing.
import { readFileSync } from "fs";
import { plan } from "../module/deaf/sign-pace.js";

function report(doc, mode) {
  const rows = plan(doc.segments, { mode, signRate: 1 });
  console.log(mode);
  for (const row of rows) console.log(`${row.cue}  rate ${row.lessonRate.toFixed(3)}  hold ${row.holdAfter.toFixed(2)}  lag ${row.lag.toFixed(2)}`);
  const holds = rows.filter((row) => row.holdAfter >= 0.5);
  const sum = holds.reduce((total, row) => total + row.holdAfter, 0);
  const longest = holds.reduce((max, row) => Math.max(max, row.holdAfter), 0);
  const mean = rows.reduce((total, row) => total + row.lag, 0) / (rows.length || 1);
  const max = rows.reduce((value, row) => Math.max(value, row.lag), 0);
  const slowest = rows.reduce((value, row) => Math.min(value, row.lessonRate), 1);
  console.log(`holds ${holds.length}  total ${sum.toFixed(2)} s  longest ${longest.toFixed(2)} s  mean lag ${mean.toFixed(2)}  max lag ${max.toFixed(2)}  wall ${rows.wall.toFixed(2)} s  min rate ${slowest.toFixed(3)}`);
}

if (process.argv[1] && process.argv[1].endsWith("simulate_sign.mjs")) {
  const doc = JSON.parse(readFileSync(new URL("../demo/data/sign.json", import.meta.url), "utf8"));
  report(doc, "smooth");
  report(doc, "pause");
}
