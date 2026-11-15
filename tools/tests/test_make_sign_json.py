# FR-DEAF-05, FR-SL-07: Ends-only trim keeps interior pauses and uses each clip's levels.
import json
import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import make_sign_json as sign
import sign_motion as motion


def bounds(curve, dur):
    frm, to, note, _high, _low = motion.trim_bounds(curve, dur)
    return frm, to, note


class SignJsonTests(unittest.TestCase):
    def test_head_rest_is_cut(self):
        curve = np.zeros(200)
        curve[60:] = 10
        frm, to, note = bounds(curve, 10.0)
        self.assertNotEqual(note, "flagged")
        self.assertAlmostEqual(frm, 2.85, places=2)
        self.assertAlmostEqual(to, 10.0, places=2)

    def test_tail_rest_is_cut(self):
        curve = np.zeros(200)
        curve[:140] = 10
        frm, to, note = bounds(curve, 10.0)
        self.assertNotEqual(note, "flagged")
        self.assertAlmostEqual(frm, 0.0, places=2)
        self.assertAlmostEqual(to, 7.25, places=2)

    def test_interior_pause_is_kept(self):
        curve = np.zeros(96)
        curve[:40] = 10
        curve[56:] = 10
        frm, to, note = bounds(curve, 4.8)
        self.assertNotEqual(note, "flagged")
        self.assertLessEqual(frm, 2.0)
        self.assertGreaterEqual(to, 2.8)

    def test_faster_return_does_not_hide_the_gesture(self):
        curve = np.full(40, 1.0)
        curve[4:14] = 6.0
        curve[22:30] = 9.0
        frm, to, note = bounds(curve, 2.0)
        self.assertNotEqual(note, "flagged")
        self.assertLess(frm, 0.3)
        self.assertGreater(to, 1.3)

    def test_clip_with_no_rest_keeps_everything(self):
        curve = np.full(100, 12.0)
        curve[10:20] = 6.0
        frm, to, _note = bounds(curve, 5.0)
        self.assertAlmostEqual(frm, 0.0, places=2)
        self.assertAlmostEqual(to, 5.0, places=2)

    def test_low_contrast_uses_its_own_levels(self):
        curve = np.full(160, 1.0)
        curve[40:120] = 1.8
        frm, to, note = bounds(curve, 8.0)
        self.assertNotEqual(note, "flagged")
        self.assertAlmostEqual(frm, 1.85, places=2)
        self.assertAlmostEqual(to, 6.25, places=2)

    def test_config_fractions(self):
        cfg = json.loads(motion.CONFIG.read_text(encoding="utf-8"))
        self.assertEqual(cfg["high"], 0.35)
        self.assertEqual(cfg["low"], 0.15)
        self.assertEqual(cfg["sustain"], 0.3)
        self.assertEqual(cfg["lead"], 0.15)
        self.assertEqual(cfg["tail"], 0.25)
        self.assertNotIn("threshold", cfg)

    def test_missing_clip_and_relative_path(self):
        def measure(_path):
            curve = np.zeros(40)
            curve[4:20] = 5
            return 2.0, curve

        doc, rows = sign.assemble(
            [("A01", 0.5, 1.5), ("A02", 1.5, 2.5)],
            {"A01"}, Path("/proj/demo/data/sign.json"), Path("/proj/demo/data/memory"), measure)
        self.assertEqual(doc["segments"][0]["src"], "memory/A01.mp4")
        self.assertNotIn("..", doc["segments"][0]["src"])
        self.assertEqual(doc["segments"][1]["source"], "none")
        self.assertNotIn("src", doc["segments"][1])
        self.assertEqual(sign.validate(doc), [])
        self.assertEqual(rows[1][6], "missing")

    def test_totals(self):
        def measure(_path):
            curve = np.zeros(80)
            curve[10:50] = 5
            return 4.0, curve

        _doc, rows = sign.assemble(
            [("A01", 0.0, 1.0), ("A02", 1.0, 2.0)],
            {"A01", "A02"}, Path("/tmp/sign.json"), Path("/tmp/memory"), measure)
        lesson = sum(row[1] for row in rows)
        signing = sum(row[5] for row in rows)
        self.assertAlmostEqual(lesson, 2.0)
        self.assertGreater(signing, 0)


if __name__ == "__main__":
    unittest.main()
